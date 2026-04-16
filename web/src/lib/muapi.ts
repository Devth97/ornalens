// MuAPI client — jewellery placement, multi-angle shots (with face lock), video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Angle shot definitions ────────────────────────────────────────────────
const SHOT_ANGLES = [
  { angle: 'front',         composition: 'front view, face-on, eye-level camera, 50mm lens, f/4, soft studio lighting, full necklace clearly visible, clean white background' },
  { angle: 'three_quarter', composition: 'three-quarter view, slight left turn, 50mm lens, f/4, studio lighting, jewellery fully visible, clean white background' },
  { angle: 'close_up',      composition: 'upper body shot focusing on the necklace, 85mm lens, f/2.8, jewellery in sharp detail, model face and neck visible, white background' },
  { angle: 'side',          composition: 'side profile view, 35mm lens, f/4, elegant standing pose, full jewellery drape visible, white background' },
  { angle: 'overhead_tilt', composition: 'slight high-angle editorial shot, 35mm lens, f/5.6, dramatic lighting, jewellery fully visible, white background' },
]

// ─── Core request helpers ──────────────────────────────────────────────────
async function submitJob(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MUAPI_KEY!,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MuAPI [${endpoint}] submit failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.request_id
}

async function pollResult(requestId: string, maxWaitMs = 300_000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 4000))
    const res = await fetch(`${BASE_URL}/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': process.env.MUAPI_KEY! },
    })
    if (!res.ok) continue
    const data = await res.json()
    const status = (data.status || '').toLowerCase()
    if (['completed', 'succeeded', 'success'].includes(status)) {
      return data.outputs?.[0] ?? data.video_url ?? data.url ?? data.output
    }
    if (['failed', 'error'].includes(status)) {
      throw new Error(`MuAPI job failed: ${data.error || status}`)
    }
  }
  throw new Error(`MuAPI job timed out after ${maxWaitMs / 1000}s`)
}

export async function uploadToMuAPI(imageBuffer: Buffer, filename: string): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob([imageBuffer.buffer as ArrayBuffer]), filename)
  const res = await fetch(`${BASE_URL}/api/v1/upload_file`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.MUAPI_KEY! },
    body: form,
  })
  if (!res.ok) throw new Error(`MuAPI upload failed: ${res.status}`)
  const data = await res.json()
  return data.url
}

// ─── Step 1: Place jewellery on model (NanoBanana 2) ──────────────────────
/**
 * CRITICAL: Reference image IS the jewellery source of truth.
 * Prompt only controls model/scene. Jewellery is read from images_list.
 * Skin texture is subtle and realistic — not exaggerated.
 */
export async function placeJewelleryOnModel(
  jewelleryImageUrl: string,
  description: string,
  modelStyle: { skin_tone?: string; body_type?: string; pose?: string }
): Promise<string> {
  const skinTone = modelStyle.skin_tone ?? 'medium'
  const bodyType = modelStyle.body_type ?? 'slim'
  const pose = modelStyle.pose ?? 'standing'

  const prompt = [
    `Indian female model, ${skinTone} skin tone, ${bodyType} build, ${pose} pose, elegant expression`,
    `wearing the exact jewellery shown in the reference image — copy every gemstone shape color and metal detail precisely`,
    // Subtle realism — not exaggerated
    `photorealistic skin — fine natural pores, subtle warmth on cheeks, natural lip texture`,
    `slight natural T-zone sheen, fine baby hair at temples, no heavy airbrushing`,
    `professional jewellery photography, clean white studio background, soft elegant lighting`,
    `hyperrealistic fashion editorial, Phase One IQ4 camera quality, 9:16 portrait`,
  ].join(', ')

  const requestId = await submitJob('nano-banana-2-edit', {
    prompt,
    images_list: [jewelleryImageUrl],
    aspect_ratio: '9:16',
    quality: 'high',
  })

  return pollResult(requestId)
}

// ─── Step 2: Face-lock swap — ensures identity matches Step 1 model ────────
/**
 * After generating each angle shot, swap the face from the original
 * Step 1 model image onto it. This is how Higgsfield "Shots" maintains
 * consistent identity across all angles — generate variant, then face-lock.
 */
async function lockFaceConsistency(
  angleImageUrl: string,   // generated angle shot (target — face may have drifted)
  modelImageUrl: string,   // Step 1 output (source face to lock in)
): Promise<string> {
  try {
    const requestId = await submitJob('ai-image-face-swap', {
      target_image_url: angleImageUrl,  // the angle shot to fix
      source_image_url: modelImageUrl,  // the reference face to lock in
    })
    return await pollResult(requestId, 120_000)
  } catch (e) {
    // Face swap failed — return original angle shot rather than crashing pipeline
    console.warn(`[muapi] Face swap failed for angle shot, using original:`, e)
    return angleImageUrl
  }
}

// ─── Step 3: 5 multi-angle shots with face consistency ────────────────────
/**
 * Two-pass approach (like Higgsfield Shots):
 * Pass 1 — flux-kontext-pro generates angle variant (may drift in face)
 * Pass 2 — face-swap locks original model face back onto each shot
 * This guarantees consistent identity across all 5 angles.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  _description: string
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  // Run all 5 angle generations in parallel (Pass 1)
  const pass1Results = await Promise.all(
    SHOT_ANGLES.map(async ({ angle, composition }) => {
      const prompt = [
        `Same Indian female model from the reference image`,
        `wearing the exact same jewellery — do not alter any gemstone metal or design detail`,
        composition,
        // Subtle skin realism — consistent with Step 1, not over-applied
        `natural photorealistic skin, subtle pores, no airbrushing`,
        `professional jewellery advertisement photography, hyperrealistic`,
        `CRITICAL: preserve jewellery design and model appearance exactly as in reference`,
      ].join(', ')

      const requestId = await submitJob('flux-kontext-pro-i2i', {
        prompt,
        images_list: [modelImageUrl],
        aspect_ratio: '9:16',
        quality: 'high',
        strength: 0.30,  // Very low = stays very close to source, preserves face + jewellery
      })
      const imageUrl = await pollResult(requestId)
      return { angle, prompt, image_url: imageUrl }
    })
  )

  // Pass 2 — face-lock each angle shot back to original model (sequential to avoid rate limits)
  const results = []
  for (const shot of pass1Results) {
    console.log(`[muapi] Locking face consistency for angle: ${shot.angle}`)
    const lockedImageUrl = await lockFaceConsistency(shot.image_url, modelImageUrl)
    results.push({ ...shot, image_url: lockedImageUrl })
  }

  return results
}

// ─── Step 4: Image-to-video (Kling v3.0 Standard) ─────────────────────────
/**
 * Correct field: image_url (string) — NOT images_list (array).
 * Error confirmed: loc: ["body","image_url"] missing.
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  _description: string
): Promise<string> {
  const motionPrompt = buildVideoMotionPrompt(angle)

  const requestId = await submitJob('kling-v3.0-standard-image-to-video', {
    prompt: motionPrompt,
    image_url: imageUrl,   // ← FIXED: was images_list:[imageUrl], Kling needs image_url string
    duration: 5,
    aspect_ratio: '9:16',
    cfg_scale: 0.5,
  })

  return pollResult(requestId, 600_000)
}

function buildVideoMotionPrompt(angle: string): string {
  const motionMap: Record<string, string> = {
    front:         'model gently tilts her head and smiles softly, jewellery catches the studio light elegantly, slow graceful movement, cinematic fashion film',
    three_quarter: 'model slowly turns from three-quarter toward camera, jewellery shimmers beautifully, smooth elegant motion, fashion advertisement',
    close_up:      'subtle camera pull-back from jewellery revealing model face, jewellery sparkles with studio lighting, slow elegant reveal',
    side:          'model gracefully turns her head from side profile toward camera, jewellery catches the light, smooth fashion motion',
    overhead_tilt: 'camera slowly descends from high angle to eye-level, dramatic jewellery reveal, editorial fashion film',
  }
  return motionMap[angle] ?? 'model moves gracefully, jewellery shimmers in studio light, elegant slow motion, cinematic fashion'
}

/**
 * Generate all 5 video clips sequentially (avoids MuAPI rate limits)
 */
export async function generateAllVideoClips(
  shots: Array<{ angle: string; image_url: string }>,
  description: string
): Promise<Array<{ angle: string; video_url: string }>> {
  const results: Array<{ angle: string; video_url: string }> = []
  for (const shot of shots) {
    console.log(`[muapi] Generating video for angle: ${shot.angle}`)
    const videoUrl = await generateVideoFromShot(shot.image_url, shot.angle, description)
    results.push({ angle: shot.angle, video_url: videoUrl })
  }
  return results
}

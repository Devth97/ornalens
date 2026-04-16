// MuAPI client — jewellery placement, multi-angle shots, and video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Angle shot definitions ────────────────────────────────────────────────
const SHOT_ANGLES = [
  { angle: 'front',         composition: 'front view, face-on, eye-level camera, 50mm lens, f/4, professional studio lighting, full necklace clearly visible' },
  { angle: 'three_quarter', composition: 'three-quarter view, slight left turn, 50mm lens, f/4, studio lighting, jewellery fully visible' },
  { angle: 'close_up',      composition: 'extreme close-up on the necklace, 100mm macro lens, f/2.8, shallow depth of field, every gemstone in sharp detail' },
  { angle: 'side',          composition: 'side profile view, 35mm lens, f/4, elegant standing pose, full jewellery drape visible' },
  { angle: 'overhead_tilt', composition: 'slight high-angle editorial shot, 35mm lens, f/5.6, dramatic lighting, full jewellery layout visible' },
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
      // video endpoints return video URL, image endpoints return image URL
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

// ─── Step 1: Place jewellery on model (NanoBanana) ─────────────────────────
/**
 * CRITICAL: The reference image IS the jewellery source of truth.
 * We never describe the jewellery design in the prompt — the model reads it
 * directly from images_list. The prompt only controls the model/scene.
 */
export async function placeJewelleryOnModel(
  jewelleryImageUrl: string,
  description: string,
  modelStyle: { skin_tone?: string; body_type?: string; pose?: string }
): Promise<string> {
  const skinTone = modelStyle.skin_tone ?? 'medium'
  const bodyType = modelStyle.body_type ?? 'slim'
  const pose = modelStyle.pose ?? 'standing'

  // IMPORTANT: Do NOT describe the jewellery design in the prompt.
  // The AI must read it from the reference image (images_list), not invent from text.
  // The prompt only describes who is wearing it and the scene.
  const prompt = [
    `Indian female model, ${skinTone} skin tone, ${bodyType} build, ${pose} pose`,
    `wearing the exact jewellery shown in the reference image — preserve every gemstone, metal, and detail precisely as uploaded`,
    // Realism skin texture directives
    `photorealistic skin — visible natural pores on cheeks nose bridge and forehead`,
    `subtle golden warmth and natural flush on cheeks and nose tip`,
    `natural under-eye depth with faint realistic skin fold`,
    `fine natural lip texture with slight lip lines — not smoothed`,
    `very subtle T-zone natural sheen on forehead and nose`,
    `no airbrushing no digital smoothness — real human skin texture`,
    `one or two faint natural micro-blemishes for authenticity`,
    `fine baby hair strands visible at hairline temples`,
    `professional jewellery photography, clean white studio background, soft elegant lighting`,
    `hyperrealistic fashion editorial, shot on Phase One IQ4, 9:16 portrait`,
  ].join(', ')

  const requestId = await submitJob('nano-banana-2-edit', {
    prompt,
    images_list: [jewelleryImageUrl],
    aspect_ratio: '9:16',
    quality: 'high',
  })

  return pollResult(requestId)
}

// ─── Step 2: 5 multi-angle shots (flux-kontext i2i) ───────────────────────
/**
 * Input is the model-wearing-jewellery image from Step 1.
 * Low strength (0.35) = stays very close to the source — preserves jewellery identity.
 * Prompt only changes camera angle/composition, never redesigns jewellery.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  description: string
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  const results = await Promise.all(
    SHOT_ANGLES.map(async ({ angle, composition }) => {
      const prompt = [
        `Same Indian female model from the reference image`,
        `wearing the exact same jewellery — do not alter any gemstone, metal, or design detail`,
        composition,
        // Realism skin texture — same across all angles for consistency
        `photorealistic skin texture — natural pores visible on cheeks and forehead`,
        `subtle golden skin warmth, natural under-eye depth, fine lip texture`,
        `no airbrushing no digital smoothing — real human skin`,
        `fine baby hair at temples, one or two faint natural skin marks`,
        `professional jewellery advertisement photography, hyperrealistic, high resolution`,
        `IMPORTANT: preserve jewellery design exactly as in reference image`,
      ].join(', ')

      const requestId = await submitJob('flux-kontext-dev-i2i', {
        prompt,
        images_list: [modelImageUrl],
        aspect_ratio: '9:16',
        quality: 'high',
        strength: 0.35,   // Low = stays close to source image → preserves jewellery
      })
      const imageUrl = await pollResult(requestId)
      return { angle, prompt, image_url: imageUrl }
    })
  )
  return results
}

// ─── Step 3: Image-to-video via MuAPI (Kling v2.1 — best available) ───────
/**
 * Generates a 5-second cinematic video clip from each angle shot.
 * Uses Kling v2.1 image-to-video — best motion quality on MuAPI.
 * Prompt focuses on elegant model movement only; jewellery is locked to the image.
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  _description: string
): Promise<string> {
  const motionPrompt = buildVideoMotionPrompt(angle)

  // Kling v3.0 Standard: best temporal consistency (jewellery stays identical across frames)
  // + smooth realistic motion at standard cost tier
  const requestId = await submitJob('kling-v3.0-standard-image-to-video', {
    prompt: motionPrompt,
    images_list: [imageUrl],
    duration: 5,         // seconds
    aspect_ratio: '9:16',
    cfg_scale: 0.5,
  })

  return pollResult(requestId, 600_000) // 10 min timeout for video
}

function buildVideoMotionPrompt(angle: string): string {
  const motionMap: Record<string, string> = {
    front:         'model gently tilts her head and smiles softly, jewellery catches the light elegantly, slow graceful movement, cinematic',
    three_quarter: 'model slowly turns from three-quarter to face the camera, jewellery shimmers, smooth elegant motion',
    close_up:      'camera slowly pulls back from jewellery close-up, revealing the model\'s face, jewellery sparkles beautifully',
    side:          'model gracefully turns her head toward camera from side profile, jewellery catches studio light',
    overhead_tilt: 'camera slowly descends from overhead angle to eye-level, dramatic jewellery reveal, editorial fashion',
  }
  return motionMap[angle] ?? 'model moves gracefully, jewellery shimmers in studio light, elegant slow motion, cinematic fashion film'
}

/**
 * Generate all 5 video clips in sequence (not parallel — avoids MuAPI rate limits)
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

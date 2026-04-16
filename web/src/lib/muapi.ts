// MuAPI client — jewellery placement, multi-angle shots, video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Angle shot definitions ───────────────────────────────────────────────
// Each angle changes ONLY camera composition — model, clothing, jewellery unchanged
const SHOT_ANGLES = [
  {
    angle: 'front',
    composition: 'front view portrait, face-on, eye-level, 50mm lens, f/4, soft studio lighting, full necklace visible, clean white background',
  },
  {
    angle: 'three_quarter',
    composition: 'three-quarter view, slight left turn showing jawline, 50mm lens, f/4, studio lighting, full necklace visible, white background',
  },
  {
    angle: 'close_up',
    composition: 'upper body and face portrait, 85mm lens, f/2.8, necklace in sharp focus, model face visible, elegant studio lighting',
  },
  {
    angle: 'side',
    composition: 'side profile portrait, 35mm lens, f/4, elegant pose, necklace drape fully visible, white studio background',
  },
  {
    angle: 'overhead_tilt',
    composition: 'slight high-angle editorial portrait, 35mm lens, f/5.6, dramatic lighting, full necklace layout visible',
  },
]

// ─── Core request helpers ────────────────────────────────────────────────
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

// ─── Step 1: Place jewellery on model (NanoBanana 2) ─────────────────────
/**
 * CRITICAL: jewellery design comes from images_list reference image ONLY.
 * Prompt controls: model appearance, clothing, scene — NOT jewellery design.
 * Clothing: elegant Indian formal (cream/ivory silk blouse with dupatta) —
 * professional enough to not compete with the jewellery.
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
    // Who is wearing
    `Indian female model, ${skinTone} skin tone, ${bodyType} build, ${pose} pose, calm elegant expression`,
    // JEWELLERY: read from image — do NOT describe design in text
    `wearing the exact necklace jewellery shown in the reference image — copy every gemstone shape color arrangement and metal detail with pixel-perfect accuracy, do not alter the jewellery in any way`,
    // CLOTHING — elegant Indian attire that complements high-end jewellery
    `wearing an elegant ivory cream silk blouse with subtle embroidery, simple Indian formal attire that showcases the necklace beautifully`,
    // MAKEUP — define clearly so it stays consistent across angles
    `soft bridal makeup, warm nude-rose lip colour, natural kajal-lined eyes, subtle golden highlighter, groomed brows`,
    // SKIN — subtle realism
    `photorealistic skin, natural pores, soft golden warmth, no heavy airbrushing`,
    // SCENE
    `professional jewellery photography, clean white studio background, soft diffused lighting`,
    `hyperrealistic, Phase One IQ4 camera quality, 9:16 portrait`,
  ].join(', ')

  const requestId = await submitJob('nano-banana-2-edit', {
    prompt,
    images_list: [jewelleryImageUrl],
    aspect_ratio: '9:16',
    quality: 'high',
  })

  return pollResult(requestId)
}

// ─── Step 2: 5 multi-angle shots using Flux PuLID (face identity lock) ────
/**
 * Flux PuLID is purpose-built for consistent face rendering across different
 * scenes/styles. Unlike flux-kontext (general i2i), PuLID anchors the exact
 * face identity — same lips, eyes, skin tone, makeup — across all 5 angles.
 * This is the same technique used by Higgsfield Shots.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  _description: string
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  const results = await Promise.all(
    SHOT_ANGLES.map(async ({ angle, composition }) => {
      const prompt = [
        // Identity anchor — PuLID reads face from reference image
        `same Indian female model from reference image, identical face features lips eyes brows skin tone`,
        // JEWELLERY — must not change
        `wearing the exact same necklace jewellery as reference — same gemstones same metal same arrangement, do not alter jewellery`,
        // CLOTHING — same as Step 1
        `ivory cream silk blouse with subtle embroidery, elegant Indian formal attire`,
        // MAKEUP — lock these explicitly to prevent drift
        `identical makeup as reference: warm nude-rose lips, natural kajal eyes, subtle golden highlighter`,
        // Camera angle — only thing that changes
        composition,
        // Quality
        `professional jewellery advertisement photography, hyperrealistic, clean white studio background`,
      ].join(', ')

      // Flux PuLID: purpose-built face identity preservation
      // Accepts reference_image_url for face lock + prompt for scene/angle
      const requestId = await submitJob('flux-pulid', {
        prompt,
        reference_image_url: modelImageUrl,  // PuLID anchors face from this
        aspect_ratio: '9:16',
        quality: 'high',
      })

      const imageUrl = await pollResult(requestId)
      return { angle, prompt, image_url: imageUrl }
    })
  )
  return results
}

// ─── Step 3: Image-to-video (Kling v3.0 Standard) ────────────────────────
/**
 * Correct Kling field: image_url (string) NOT images_list (array)
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  _description: string
): Promise<string> {
  const motionPrompt = buildVideoMotionPrompt(angle)

  const requestId = await submitJob('kling-v3.0-standard-image-to-video', {
    prompt: motionPrompt,
    image_url: imageUrl,   // ← string, not array
    duration: 5,
    aspect_ratio: '9:16',
    cfg_scale: 0.5,
  })

  return pollResult(requestId, 600_000)
}

function buildVideoMotionPrompt(angle: string): string {
  const motionMap: Record<string, string> = {
    front:         'model gently tilts her head and smiles softly, necklace catches the studio light elegantly, slow graceful movement, luxury jewellery advertisement',
    three_quarter: 'model slowly turns from three-quarter toward camera, necklace shimmers beautifully, smooth elegant motion, high fashion',
    close_up:      'subtle slow camera pull-back revealing the necklace and model face, gemstones sparkle with studio lighting, cinematic jewellery reveal',
    side:          'model gracefully turns her head from side profile toward camera, necklace drapes catch the light, smooth elegant fashion motion',
    overhead_tilt: 'camera slowly descends from high angle to eye-level, dramatic jewellery reveal, editorial luxury fashion',
  }
  return motionMap[angle] ?? 'model moves gracefully, jewellery shimmers in studio light, elegant slow motion, cinematic fashion film'
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

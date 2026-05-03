// MuAPI client — jewellery placement, multi-angle shots, video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Dev mode ─────────────────────────────────────────────────────────────
// Set MUAPI_DEV_MODE=true in .env.local to skip all MuAPI calls and return
// placeholder images/videos instantly. Tests the full pipeline (DB writes,
// chain-fire routing, stitching, mobile UI) at zero credit cost.
const DEV_MODE = process.env.MUAPI_DEV_MODE === 'true'

// Consistent placeholder URLs — same seed = same image every run, so you can
// verify DB writes and UI rendering without burning credits.
const DEV_PORTRAIT   = 'https://picsum.photos/seed/ornalens-portrait/720/1280'
const DEV_VIDEO      = 'https://www.w3schools.com/html/mov_bbb.mp4'
const devShotUrl = (angle: string) => `https://picsum.photos/seed/ornalens-${angle}/720/1280`

// ─── Character anchor ─────────────────────────────────────────────────────
// Locked across ALL prompts — prevents model drift between angles and videos.
// Skin tone intentionally omitted here; injected dynamically from modelStyle.
// Full anchor — used in Step 1 (NanoBanana) only where we control the initial generation.
// Includes skin realism details that get baked into the output image.
const CHARACTER_ANCHOR = [
  'modern elegant Indian woman, mid-20s, sharp jawline, almond-shaped dark brown eyes, sleek straight dark hair',
  'soft bridal makeup, warm nude-rose lips, natural kajal-lined eyes, subtle golden highlighter',
  'refined confident expression',
  'photorealistic skin with visible natural pores on cheeks nose bridge and forehead, fine grain texture',
  'slight natural warmth and golden flush on cheeks and nose tip, natural under-eye depth with faint realistic shadow',
  'fine natural lip texture with subtle lip lines, very subtle T-zone natural sheen on forehead and nose, alive not oily',
  'no digital smoothness no airbrushed appearance, one or two faint natural skin marks for authenticity',
  'fine baby hair strands visible at hairline and temples',
].join(', ')

// ─── Outfit options ───────────────────────────────────────────────────────
// Picked once per job in runPipeline and passed to both Step 1 + Step 2.
// All options: round/scoop neck to keep full neck + collarbone visible for jewellery.
// Varied colours and embroidery so each job looks distinct.
const OUTFIT_OPTIONS = [
  'round-neck navy blue silk saree blouse with gold zari border, saree draped over one shoulder',
  'round-neck deep burgundy silk blouse with silver zari embroidery, dupatta draped elegantly over one shoulder',
  'round-neck ivory cream silk blouse with subtle gold threadwork, champagne silk saree draped over one shoulder',
  'round-neck forest green silk blouse with copper and gold embellishment, saree draped over one shoulder',
  'round-neck deep rose blush-pink silk blouse with pearl and gold embroidery, saree draped over one shoulder',
  'round-neck midnight black silk blouse with gold geometric embroidery, silk saree draped elegantly over one shoulder',
  'round-neck royal purple silk blouse with silver zari border, deep plum saree draped over one shoulder',
  'round-neck teal peacock-blue silk blouse with gold threadwork, saree draped elegantly over one shoulder',
]

export function pickOutfit(): string {
  return OUTFIT_OPTIONS[Math.floor(Math.random() * OUTFIT_OPTIONS.length)]
}

// ─── Angle shot definitions ───────────────────────────────────────────────
// 5 genuinely distinct shots — same as a real multi-camera jewellery photoshoot.
// Each targets a different editorial use case: full look, editorial turn,
// beauty close-up, architectural profile, and jewellery macro detail.
const SHOT_ANGLES = [
  {
    angle: 'full_front',
    composition: 'full portrait from head to waist, model facing camera directly, standing with elegant posture, jewellery centred and fully visible at neckline, both hands relaxed at sides, clean white studio background, soft diffused front lighting, 50mm lens, sharp on jewellery and face, professional luxury jewellery campaign',
  },
  {
    angle: 'over_shoulder',
    composition: 'three-quarter portrait, model turned 45 degrees away from camera with head turned back over her shoulder looking into lens, jewellery visible at neckline from this angle, saree draped elegantly over turned shoulder, clean white studio background, soft studio lighting, 85mm lens, f/2.0, editorial luxury feel',
  },
  {
    angle: 'face_closeup',
    composition: 'extreme close-up portrait from forehead to just below chin, face fills the frame, jewellery barely visible at the very bottom edge of frame, sharp focus on face eyes and skin texture, clean white studio background, soft diffused beauty lighting, 135mm lens, f/1.8, high-end editorial beauty shot',
  },
  {
    angle: 'side_profile',
    composition: 'clean full side profile, model facing left, entire profile visible from ear to shoulder, jewellery visible in full silhouette profile along the neckline, saree draping over shoulder visible, clean white studio background, soft side lighting catching jewellery facets and gemstone edges, 85mm lens, f/2.0, architectural jewellery shot',
  },
  {
    angle: 'jewellery_detail',
    composition: 'macro detail shot framed from chin to mid-chest, jewellery fills the frame and is the primary subject, model chin and lips visible at top of frame, collarbone and décolletage visible below, every gemstone chain link and metal element in ultra-sharp focus, clean white studio background, soft diffused studio lighting, 100mm macro lens, f/2.8, jewellery catalogue shot',
  },
]

// ─── Core request helpers ────────────────────────────────────────────────

// Submit with retry — 429/500/503 are transient; back off and retry up to 4 times.
// Without this, parallel angle-shot submissions all hit MuAPI at the same ms and
// 3/5 get rate-limited immediately (cost $0, fail permanently).
async function submitJob(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const MAX_RETRIES = 4
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MUAPI_KEY!,
      },
      body: JSON.stringify(body),
    })

    // Transient errors — back off and retry
    if (res.status === 429 || res.status === 500 || res.status === 503) {
      const backoffMs = attempt * 6000  // 6s, 12s, 18s, 24s
      lastError = `${res.status}`
      console.warn(`[muapi] ${endpoint} submit ${res.status} (attempt ${attempt}/${MAX_RETRIES}), retrying in ${backoffMs / 1000}s`)
      await new Promise(r => setTimeout(r, backoffMs))
      continue
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`MuAPI [${endpoint}] submit failed: ${res.status} ${text}`)
    }

    const data = await res.json()
    // Validate the job ID exists — if missing, polling /undefined/result wastes 5-10 min
    const requestId: string | undefined = data.request_id ?? data.id ?? data.prediction_id
    if (!requestId) {
      throw new Error(`MuAPI [${endpoint}] submit succeeded but no request_id in response. Keys: ${Object.keys(data).join(', ')}`)
    }
    return requestId
  }

  throw new Error(`MuAPI [${endpoint}] submit failed after ${MAX_RETRIES} retries (last status: ${lastError})`)
}

async function pollResult(requestId: string, maxWaitMs = 300_000): Promise<string> {
  const start = Date.now()
  let delay = 4000

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, delay))

    const res = await fetch(`${BASE_URL}/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': process.env.MUAPI_KEY! },
    })

    // 429 rate-limit: back off exponentially instead of hammering
    if (res.status === 429) {
      delay = Math.min(delay * 2, 30_000)
      console.warn(`[muapi] poll 429 rate-limit, backing off to ${delay / 1000}s`)
      continue
    }

    if (!res.ok) {
      console.warn(`[muapi] poll non-ok ${res.status} for ${requestId}, retrying`)
      continue
    }

    // Reset delay on successful poll
    delay = 4000

    const data = await res.json()
    const status = (data.status || '').toLowerCase()

    if (['completed', 'succeeded', 'success'].includes(status)) {
      // Check all known output field names across MuAPI endpoints:
      // nano-banana/flux → outputs[0] or image or url
      // seedance/kling i2v → video or video_url
      const result = data.outputs?.[0] ?? data.video ?? data.image ?? data.video_url ?? data.url ?? data.output
      if (!result) throw new Error(`MuAPI job completed but no output URL found. Keys: ${Object.keys(data).join(', ')}`)
      return result
    }

    if (['failed', 'error'].includes(status)) {
      throw new Error(`MuAPI job failed: ${data.error || data.message || status}`)
    }
  }
  throw new Error(`MuAPI job timed out after ${maxWaitMs / 1000}s (request_id: ${requestId})`)
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

// ─── Template photoshoot: single-pass AI generation ─────────────────────
/**
 * Generate a styled jewellery product photo from a template prompt.
 * Uses nano-banana-2-edit with the jewellery image as reference.
 *
 * The prompt is carefully constructed to:
 *   1. Extract ONLY the jewellery piece from the reference (ignore fingers, hands, tags, skin)
 *   2. Reproduce the exact jewellery design — every gemstone, metal, setting, detail
 *   3. Place it naturally in the template scene
 */
export async function generatePhotoshootImage(
  jewelleryImageUrl: string,
  prompt: string,
  aspectRatio: string = '1:1',
  resolution?: string,
): Promise<string> {
  if (DEV_MODE) {
    console.log('[muapi:dev] Photoshoot — returning placeholder image (no API call)')
    await new Promise(r => setTimeout(r, 800))
    return DEV_PORTRAIT
  }

  // Build an enhanced prompt with strict jewellery fidelity + extraction instructions
  const enhancedPrompt = [
    // Scene/template instruction (from the template prompt)
    prompt,

    // EXTRACTION: tell the AI what to take from the reference image
    'REFERENCE IMAGE EXTRACTION: The reference image contains a jewellery piece that may be held by fingers, worn on a hand, or shown with tags/labels/skin/background.',
    'Extract ONLY the jewellery piece itself from the reference image — completely ignore and remove all fingers, hands, skin, wrists, price tags, labels, stickers, and any non-jewellery elements.',
    'The output image must show ONLY the jewellery piece — no human body parts whatsoever.',

    // FIDELITY: exact reproduction of the jewellery design
    'JEWELLERY FIDELITY: Reproduce the EXACT jewellery design from the reference image with 100% accuracy.',
    'Copy every gemstone — exact shape, cut, size, colour, clarity, number, and arrangement — with zero modification.',
    'Copy every metal element — exact colour (yellow gold, white gold, rose gold, platinum, silver), texture, finish (polished, matte, brushed), and pattern.',
    'Copy the exact band width, prong style, setting type, and structural design.',
    'DO NOT add, remove, resize, simplify, or alter ANY design element of the jewellery.',
    'DO NOT add extra accessories, stones, or decorative elements not present in the reference.',

    // SURFACE PROTECTION: scene elements must NEVER touch the jewellery
    'CRITICAL SURFACE RULE: The jewellery surface must remain 100% clean, clear, and fully visible at all times.',
    'Scene elements like ice, snow, frost, water, dust, petals, sand, smoke, or any particles must ONLY appear in the background and surrounding area.',
    'NOTHING from the scene should overlap, cover, rest on, or obscure any part of the jewellery — not even partially.',
    'The jewellery must look freshly polished and pristine with every gemstone, metal detail, and design feature clearly visible and unobstructed.',

    // QUALITY
    'Professional product photography, ultra-sharp focus on every jewellery detail, 4K, photorealistic',
  ].join('. ')

  const params: Record<string, unknown> = {
    prompt: enhancedPrompt,
    images_list: [jewelleryImageUrl],
    aspect_ratio: aspectRatio,
  }
  if (resolution) params.resolution = resolution

  const requestId = await submitJob('nano-banana-2-edit', params)
  return pollResult(requestId, 600_000)
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
  modelStyle: { skin_tone?: string; body_type?: string; pose?: string },
  outfit: string,
): Promise<string> {
  if (DEV_MODE) {
    console.log('[muapi:dev] Step 1 — returning placeholder portrait (no API call)')
    await new Promise(r => setTimeout(r, 800))
    return DEV_PORTRAIT
  }

  const skinTone = modelStyle.skin_tone ?? 'medium'
  const bodyType = modelStyle.body_type ?? 'slim'
  const pose = modelStyle.pose ?? 'standing'

  const prompt = [
    // CHARACTER_ANCHOR locks face/makeup/expression — prevents drift across all 5 angle shots
    `${CHARACTER_ANCHOR}, ${skinTone} skin tone, ${bodyType} build, ${pose} pose`,
    // JEWELLERY LOCK — the jewellery is a FIXED reference element, not generated by text.
    // Explicit prohibitions are required because image-edit models hallucinate additional accessories.
    `JEWELLERY CONSTRAINT: reproduce ONLY the exact ${description} shown in the reference image.`,
    `Copy every gemstone — their exact shape, cut, size, colour, quantity, and arrangement — with zero modification.`,
    `Copy every metal element — chain links, pendant shape, hanging bars, fringe details — exactly as shown.`,
    `DO NOT add earrings, rings, bangles, maang tikka, nose ring, or ANY accessory not present in the reference image.`,
    `DO NOT simplify, stylise, resize, or alter any part of the jewellery design. The jewellery is locked.`,
    // CLOTHING — picked once per job, passed in from runPipeline for consistency across all steps
    `wearing ${outfit}, full neck and collarbone clearly visible to showcase the jewellery beautifully`,
    // SCENE — luxury formula: minimal subject + premium environment + soft lighting
    `professional jewellery photography, clean white studio background, soft diffused lighting, emphasis on texture and reflections`,
    `hyperrealistic, Phase One IQ4 camera quality, 9:16 portrait`,
  ].join('. ')

  // Valid nano-banana-2-edit params: prompt, images_list, aspect_ratio, resolution, output_format
  // 'quality' is NOT valid — removed to prevent 422
  const requestId = await submitJob('nano-banana-2-edit', {
    prompt,
    images_list: [jewelleryImageUrl],
    aspect_ratio: '9:16',
    resolution: '2k',   // valid — upgrades output quality
  })

  return pollResult(requestId, 600_000)
}

// ─── Step 2: Multi-angle shots via NanoBanana 2 (dual-reference) ─────────────
/**
 * Dual-reference: NanoBanana receives BOTH the Step 1 model image AND the original
 * jewellery image simultaneously. This anchors both the model identity and the exact
 * jewellery design, preventing the drift and hallucinated accessories that Flux (single-ref) had.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  _description: string,
  jewelleryImageUrl?: string,
  outfit?: string,
): Promise<Array<{ angle: string; image_url: string }>> {
  if (DEV_MODE) {
    console.log('[muapi:dev] Step 2 — returning placeholder angle shots (no API call)')
    await new Promise(r => setTimeout(r, 600))
    return SHOT_ANGLES.map(({ angle }) => ({ angle, image_url: devShotUrl(angle) }))
  }

  const outfitDesc = outfit ?? OUTFIT_OPTIONS[0]

  // Build images_list: always include model image; add jewellery ref if available for dual-anchor
  const imagesList = jewelleryImageUrl
    ? [modelImageUrl, jewelleryImageUrl]
    : [modelImageUrl]

  // Promise.allSettled — if one angle fails we keep the rest and don't waste credits.
  // Stagger submissions by 500ms each — prevents all 5 hitting MuAPI at the same ms
  // which caused 3/5 to be rate-limited ($0 failure) in back-to-back testing.
  const settled = await Promise.allSettled(
    SHOT_ANGLES.map(async ({ angle, composition }, index) => {
      if (index > 0) await new Promise(r => setTimeout(r, index * 500))
      const prompt = [
        // Model identity — baked into reference image, keep prompt short
        'same model as reference image, identical face skin tone makeup and sleek straight dark hair',
        // JEWELLERY LOCK — reproduced from both reference images
        'exact same jewellery as shown in reference images, every gemstone colour shape and arrangement preserved, DO NOT add earrings rings bangles or any accessory not in the reference',
        // CLOTHING
        `wearing ${outfitDesc}, full neck and collarbone visible`,
        // Camera angle
        composition,
        // Quality
        'clean white studio background, professional luxury jewellery photography, hyperrealistic',
      ].join(', ')

      // nano-banana-2-edit: supports images_list with multiple images (dual reference).
      // resolution omitted for Step 2 — default is faster, keeps 5 parallel jobs within 300s Vercel limit.
      // resolution: '2k' is kept only for Step 1 (model portrait) where max quality matters most.
      const requestId = await submitJob('nano-banana-2-edit', {
        prompt,
        images_list: imagesList,
        aspect_ratio: '9:16',
      })

      const imageUrl = await pollResult(requestId, 600_000)
      return { angle, image_url: imageUrl }
    })
  )

  const successes = settled
    .map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      console.error(`[muapi] Angle shot ${SHOT_ANGLES[i].angle} failed: ${r.reason}`)
      return null
    })
    .filter((r): r is { angle: string; image_url: string } => r !== null)

  if (successes.length === 0) {
    throw new Error('All angle shots failed — no images to proceed with')
  }

  console.log(`[muapi] ${successes.length}/${SHOT_ANGLES.length} angle shots succeeded`)
  return successes
}

// ─── Step 3: Image-to-video (Seedance v1.5 Pro I2V Fast) ─────────────────
/**
 * Primary: seedance-v1.5-pro-i2v-fast — faster than non-fast v1.5, no audio (saves ~50% cost).
 * API uses `image_url` (string), NOT `images_list` (array).
 * Params: prompt, image_url, aspect_ratio, duration, quality, generate_audio.
 * Fallback: seedance-pro-i2v-fast (v1.0) if v1.5-fast endpoint 422s/404s.
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  _description: string,
  _modelImageUrl?: string,
): Promise<string> {
  if (DEV_MODE) {
    console.log(`[muapi:dev] Step 3 — returning placeholder video for angle: ${angle} (no API call)`)
    await new Promise(r => setTimeout(r, 400))
    return DEV_VIDEO
  }

  const motionPrompt = buildVideoMotionPrompt(angle)

  // Primary: v1.5 fast variant — same quality tier as v1.5-pro-i2v but significantly faster.
  // generate_audio: false — disables audio track generation (we never use it, halves credit cost).
  // Fallback: seedance-pro-i2v-fast (confirmed working v1.0) if v1.5-fast endpoint 422s/404s.
  let requestId: string
  try {
    requestId = await submitJob('seedance-v1.5-pro-i2v-fast', {
      prompt: motionPrompt,
      image_url: imageUrl,
      aspect_ratio: '9:16',
      duration: 5,
      quality: 'basic',
      generate_audio: false,
    })
    console.log(`[muapi] Using seedance-v1.5-pro-i2v-fast for angle: ${angle}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('422') || msg.includes('404') || msg.includes('not found')) {
      console.warn(`[muapi] seedance-v1.5-pro-i2v-fast failed (${msg}), falling back to seedance-pro-i2v-fast`)
      requestId = await submitJob('seedance-pro-i2v-fast', {
        prompt: motionPrompt,
        image_url: imageUrl,
        aspect_ratio: '9:16',
        duration: 5,
        generate_audio: false,
      })
    } else {
      throw e
    }
  }

  // Fast variant should complete in 1-3 min. Fail at 180s rather than blocking the 300s budget.
  return pollResult(requestId, 180_000)
}

// Motion-only prompts — the reference IMAGE handles all visuals.
// DO NOT describe lighting effects, sparkle, flares, or gem appearance in video prompts.
// Telling the model to "generate sparkle on gemstones" causes it to fabricate new gem designs.
// Prompts describe MOVEMENT only: how the model moves, how the camera moves, pace.
function buildVideoMotionPrompt(angle: string): string {
  const motionMap: Record<string, string> = {
    full_front:
      'model walks slowly toward camera, subtle confident stride, slight natural sway, hair moves gently, slow motion',

    over_shoulder:
      'model slowly turns head back over her shoulder toward camera, graceful unhurried movement, hair shifts naturally',

    face_closeup:
      'model blinks softly, very subtle smile, slight natural head tilt, calm breathing, minimal movement',

    side_profile:
      'model slowly turns head a few degrees, subtle chin lift, elegant stillness with very slight natural sway',

    jewellery_detail:
      'model breathes naturally causing very slight chest movement, shoulders settle gently, near stillness',
  }

  const basePrompt = motionMap[angle] ?? 'model moves gracefully with subtle natural motion, slow elegant pace'

  return basePrompt
}

/**
 * Generate all video clips in PARALLEL — all submitted simultaneously.
 * Sequential took ~15 min for 5 clips and hit Vercel's 300s timeout after clip 4.
 * Parallel brings total time down to ~3-4 min (time of the single slowest clip).
 * MuAPI confirmed no rate limit issues with 5 parallel jobs (same as Flux step).
 */
export async function generateAllVideoClips(
  shots: Array<{ angle: string; image_url: string }>,
  description: string,
  modelImageUrl?: string,
): Promise<Array<{ angle: string; video_url: string }>> {
  console.log(`[muapi] Submitting all ${shots.length} Seedance jobs in parallel`)

  const settled = await Promise.allSettled(
    shots.map(async (shot, index) => {
      if (index > 0) await new Promise(r => setTimeout(r, index * 500))
      console.log(`[muapi] Submitted Seedance job for angle: ${shot.angle}`)
      const videoUrl = await generateVideoFromShot(shot.image_url, shot.angle, description, modelImageUrl)
      console.log(`[muapi] Video done for angle: ${shot.angle}`)
      return { angle: shot.angle, video_url: videoUrl }
    })
  )

  const results = settled
    .map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      console.error(`[muapi] Video for ${shots[i].angle} failed: ${r.reason}`)
      return null
    })
    .filter((r): r is { angle: string; video_url: string } => r !== null)

  if (results.length === 0) throw new Error('All video generations failed — no clips to stitch')
  console.log(`[muapi] ${results.length}/${shots.length} videos completed`)
  return results
}

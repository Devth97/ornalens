// MuAPI client — jewellery placement, multi-angle shots, video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Character anchor ─────────────────────────────────────────────────────
// Locked across ALL prompts — prevents model drift between angles and videos.
// Skin tone intentionally omitted here; injected dynamically from modelStyle.
const CHARACTER_ANCHOR = [
  'modern elegant Indian woman, mid-20s, sharp jawline, almond-shaped dark brown eyes, sleek straight dark hair',
  'soft bridal makeup, warm nude-rose lips, natural kajal-lined eyes, subtle golden highlighter',
  'refined confident expression',
  // Skin realism — subtle, not exaggerated
  'photorealistic skin with visible natural pores on cheeks nose bridge and forehead, fine grain texture',
  'slight natural warmth and golden flush on cheeks and nose tip, natural under-eye depth with faint realistic shadow',
  'fine natural lip texture with subtle lip lines, very subtle T-zone natural sheen on forehead and nose — alive not oily',
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
// Each angle changes ONLY camera/composition — model, clothing, jewellery unchanged.
// Luxury Brand Formula: Minimal Subject + Premium Environment + Soft Lighting +
//   Texture Focus + Elegant Camera Angle (from AI Video Creation Guide)
const SHOT_ANGLES = [
  {
    angle: 'front',
    composition: 'full portrait, model facing camera directly, jewellery centred and fully visible at neckline, clean white studio background, soft diffused front lighting, professional luxury jewellery campaign, 85mm lens, f/2.0, sharp on jewellery',
  },
  {
    angle: 'three_quarter',
    composition: 'three-quarter portrait, model at 45-degree angle to camera, jewellery visible against neckline, elegant posture, saree draped over one shoulder clearly visible, soft directional studio lighting, muted dark background, 85mm lens, jewellery in sharp focus',
  },
  {
    angle: 'close_up',
    composition: 'medium close-up portrait framed from shoulders to chin, both shoulders clearly visible with saree draped over one shoulder, jewellery centred and prominently displayed against the neckline, studio lighting enhancing gemstone brilliance and precious metal shine, 85mm lens, f/2.0, ultra-sharp on jewellery, soft blurred studio background',
  },
  {
    angle: 'side',
    composition: 'clean side profile portrait, model facing left, saree draped over shoulder visible, jewellery catching soft window light from the right side, subtle hair tucked behind ear, 85mm lens, shallow depth of field, neutral background, jewellery in sharp focus',
  },
  {
    angle: 'overhead_tilt',
    composition: 'slightly elevated camera angle looking down at model, model gazes slightly upward, saree draped elegantly over one shoulder visible, jewellery fully visible and catching warm ambient light, lifestyle luxury aesthetic, 50mm lens, 4K cinematic framing, shallow depth of field',
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
  // Validate the job ID exists — if missing, polling /undefined/result wastes 5-10 min
  const requestId: string | undefined = data.request_id ?? data.id ?? data.prediction_id
  if (!requestId) {
    throw new Error(`MuAPI [${endpoint}] submit succeeded but no request_id in response. Keys: ${Object.keys(data).join(', ')}`)
  }
  return requestId
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

  return pollResult(requestId)
}

// ─── Step 2: Multi-angle shots via Flux Kontext Pro ────────────────────────
/**
 * Single reference = NanoBanana output (already has model + jewellery together).
 * Dual-reference (two images in images_list) caused all 5 jobs to fail — Flux
 * Kontext Pro I2I only accepts one image. Jewellery design is locked through the
 * NanoBanana output + strong prompt constraints instead.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  _description: string,
  _jewelleryImageUrl?: string,  // kept for API compat, not used (single-ref only)
  outfit?: string,
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  const outfitDesc = outfit ?? OUTFIT_OPTIONS[0]

  // Promise.allSettled — if one angle fails we keep the rest and don't waste credits
  const settled = await Promise.allSettled(
    SHOT_ANGLES.map(async ({ angle, composition }) => {
      const prompt = [
        // CHARACTER_ANCHOR + reference image lock face identity across all angles
        `same model as reference: ${CHARACTER_ANCHOR}, identical face lips eyes brows skin tone preserved`,
        // JEWELLERY LOCK — NanoBanana output already contains the jewellery; reinforce via prompt
        `wearing the EXACT same jewellery as shown in the reference image — every gemstone shape cut colour quantity and arrangement preserved identically`,
        `DO NOT add earrings rings bangles or any accessory not visible in reference. DO NOT simplify or change any jewellery element.`,
        // CLOTHING — same outfit as Step 1 for consistency within this job
        `wearing ${outfitDesc}, full neck and collarbone visible`,
        // Camera angle — only thing that changes per shot
        composition,
        // Quality — luxury formula: texture focus + elegant camera angle
        `professional luxury jewellery advertisement photography, hyperrealistic, emphasis on gemstone sparkle and precious metal texture`,
      ].join('. ')

      // flux-kontext-pro-i2i: single reference image only — confirmed working in production
      const requestId = await submitJob('flux-kontext-pro-i2i', {
        prompt,
        images_list: [modelImageUrl],  // single ref — dual-ref caused all 5 to fail
        aspect_ratio: '9:16',
        strength: 0.20,                // low = stays close to source
      })

      const imageUrl = await pollResult(requestId)
      return { angle, prompt, image_url: imageUrl }
    })
  )

  const successes = settled
    .map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      console.error(`[muapi] Angle shot ${SHOT_ANGLES[i].angle} failed: ${r.reason}`)
      return null
    })
    .filter((r): r is { angle: string; prompt: string; image_url: string } => r !== null)

  if (successes.length === 0) {
    throw new Error('All angle shots failed — no images to proceed with')
  }

  console.log(`[muapi] ${successes.length}/${SHOT_ANGLES.length} angle shots succeeded`)
  return successes
}

// ─── Step 3: Image-to-video (Seedance Pro I2V Fast) ──────────────────────
/**
 * Seedance v1.5 Pro I2V — confirmed cheaper and better motion than v1.0 Pro.
 * API uses `image_url` (string), NOT `images_list` (array).
 * Confirmed params: prompt, image_url, aspect_ratio, duration, quality.
 * Falls back to seedance-pro-i2v-fast if v1.5 endpoint 422s.
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  _description: string,
  _modelImageUrl?: string,
): Promise<string> {
  const motionPrompt = buildVideoMotionPrompt(angle)

  // Try v1.5 first (cheaper + better motion). Fall back to confirmed v1.0 endpoint if 422.
  let requestId: string
  try {
    requestId = await submitJob('seedance-v1.5-pro-i2v', {
      prompt: motionPrompt,
      image_url: imageUrl,
      aspect_ratio: '9:16',
      duration: 5,
      quality: 'basic',
    })
    console.log(`[muapi] Using seedance-v1.5-pro-i2v for angle: ${angle}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('422') || msg.includes('404') || msg.includes('not found')) {
      console.warn(`[muapi] seedance-v1.5-pro-i2v failed (${msg}), falling back to seedance-pro-i2v-fast`)
      requestId = await submitJob('seedance-pro-i2v-fast', {
        prompt: motionPrompt,
        image_url: imageUrl,
        aspect_ratio: '9:16',
        duration: 5,
        quality: 'basic',
      })
    } else {
      throw e
    }
  }

  return pollResult(requestId, 600_000)
}

// Jewellery consistency lock — prepended to every video prompt.
// Seedance drifts from the reference image over time; this constraint anchors
// the design in every frame, preventing mid-video hallucination.
const VIDEO_JEWELLERY_LOCK =
  'jewellery design is IDENTICAL in every single frame of the video — ' +
  'same gemstone colours, shapes, arrangement, and metal finish throughout, ' +
  'no changes to jewellery design at any point, jewellery remains exactly as shown in the reference image'

// Motion Prompt Formula: Camera Movement + Subject Motion + Environmental Effects + Speed + Mood
// Jewellery lock is prepended to every prompt to prevent mid-video design drift.
function buildVideoMotionPrompt(angle: string): string {
  const motionMap: Record<string, string> = {
    front:
      'model walks slowly toward camera in a minimal luxury setting, hair moves naturally with one side tucked revealing jewellery, ' +
      'golden-hour sunlight creates soft glow and sparkle on gemstones, jewellery stays highlighted throughout, ' +
      '50mm lens, shallow depth of field, focus tracks jewellery as she moves, ' +
      '4K ultra-realistic cinematic video, 60fps slow motion, elegant luxury jewellery campaign feel',

    three_quarter:
      'model turns gently over her shoulder toward camera, hair tucked behind ear revealing jewellery, subtle elegant pace, ' +
      'controlled studio lighting creates soft highlights and reflections on precious stones, ' +
      'focus tracks jewellery as she moves, dark muted background, cinematic contrast, ' +
      '85mm lens, 4K slow motion, jewellery in sharp focus throughout',

    close_up:
      'model subtly shifts shoulders causing the saree drape to settle gracefully, jewellery catches studio light and gemstones sparkle brilliantly, ' +
      'light flares cascade across gemstone surface illuminating each facet, shoulders and saree drape remain visible throughout, ' +
      '85mm lens, ultra-detailed 4K video, shallow depth of field, jewellery in perfect sharp focus, soft blurred background',

    side:
      'model in clean side profile slowly turns head by a few degrees causing jewellery to catch light and sparkle, ' +
      'soft natural window light falls across face, diamonds and gemstones throw brilliant light flares with each subtle movement, ' +
      '85mm lens, shallow depth of field, 4K ultra-realistic cinematic video, 60fps slow motion, ' +
      'neutral background, jewellery remains in sharp focus throughout',

    overhead_tilt:
      'model seated gracefully, gently adjusts hair behind ear naturally revealing jewellery, ' +
      'warm ambient lighting enhances gold tones and gemstone colour, slow controlled elegant movement, ' +
      'soft shadows, premium lifestyle aesthetic, ' +
      '50mm lens, 4K cinematic framing, shallow depth of field, focus remains on jewellery',
  }

  const basePrompt = motionMap[angle] ??
    'model moves gracefully, jewellery catches studio light brilliantly, gemstones sparkle with each subtle movement, ' +
    'focus tracks jewellery throughout, 4K slow motion, cinematic luxury jewellery campaign'

  return `${VIDEO_JEWELLERY_LOCK}. ${basePrompt}`
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
    shots.map(async (shot) => {
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

// MuAPI client — jewellery placement, multi-angle shots, video generation
const BASE_URL = 'https://api.muapi.ai'

// ─── Character anchor ─────────────────────────────────────────────────────
// Locked across ALL prompts — prevents model drift between angles and videos.
// Skin tone intentionally omitted here; injected dynamically from modelStyle.
const CHARACTER_ANCHOR = [
  'modern elegant Indian woman, mid-20s, sharp jawline, almond-shaped dark brown eyes, sleek straight dark hair',
  'soft bridal makeup, warm nude-rose lips, natural kajal-lined eyes, subtle golden highlighter',
  'refined confident expression, photorealistic skin texture, natural pores',
].join(', ')

// ─── Angle shot definitions ───────────────────────────────────────────────
// Each angle changes ONLY camera/composition — model, clothing, jewellery unchanged.
// Luxury Brand Formula: Minimal Subject + Premium Environment + Soft Lighting +
//   Texture Focus + Elegant Camera Angle (from AI Video Creation Guide)
// TEMPORARY — 2 angles only to test stitch + Remotion transitions. Restore all 5 after confirming.
const SHOT_ANGLES = [
  {
    angle: 'front',
    composition: 'full portrait, model facing camera directly, jewellery centred and fully visible at neckline, clean white studio background, soft diffused front lighting, professional luxury jewellery campaign, 85mm lens, f/2.0, sharp on jewellery',
  },
  {
    angle: 'close_up',
    composition: 'medium close-up portrait framed from shoulders to chin, both shoulders clearly visible with saree draped over one shoulder, jewellery centred and prominently displayed against the neckline, studio lighting enhancing gemstone brilliance and precious metal shine, 85mm lens, f/2.0, ultra-sharp on jewellery, soft blurred studio background',
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
  modelStyle: { skin_tone?: string; body_type?: string; pose?: string }
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
    // CLOTHING — deep V-neck for maximum jewellery visibility
    `wearing a deep V-neck Indian saree blouse in rich navy dark-blue with gold zari border, bare shoulders, décolletage and full neck clearly visible to showcase the jewellery beautifully, saree draped elegantly over one shoulder`,
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

// ─── Step 2: Multi-angle shots — Higgsfield Shots dual-reference approach ──
/**
 * Dual-reference = Higgsfield Shots technique:
 *   images_list[0] = NanoBanana output  → locks model face, pose, clothing
 *   images_list[1] = original jewellery → locks exact gemstone/metal design
 * Flux Kontext sees both simultaneously — it cannot drift the jewellery
 * design because the original product image is always in its context.
 */
export async function generateAngleShots(
  modelImageUrl: string,
  _description: string,
  jewelleryImageUrl?: string,       // original jewellery photo — dual-reference lock
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  // Build reference list — jewellery image added as second ref when available
  const referenceImages = jewelleryImageUrl
    ? [modelImageUrl, jewelleryImageUrl]  // dual-reference: model + product
    : [modelImageUrl]

  // Promise.allSettled — if one angle fails we keep the rest and don't waste credits
  const settled = await Promise.allSettled(
    SHOT_ANGLES.map(async ({ angle, composition }) => {
      const prompt = [
        // CHARACTER_ANCHOR + reference image together lock face identity across all angles
        `same model as reference: ${CHARACTER_ANCHOR}, identical face lips eyes brows skin tone preserved`,
        // JEWELLERY LOCK — second reference image enforces this at the pixel level
        `wearing the EXACT same jewellery as the product reference image — every gemstone shape cut colour quantity and arrangement preserved identically`,
        `DO NOT add earrings rings bangles or any accessory not visible in reference. DO NOT simplify or change any jewellery element.`,
        // CLOTHING — same as Step 1, deep V-neck for jewellery visibility
        `deep V-neck navy dark-blue saree blouse with gold zari border, bare shoulders, neck and décolletage fully visible, saree draped over one shoulder`,
        // Camera angle — only thing that changes per shot
        composition,
        // Quality — luxury formula: texture focus + elegant camera angle
        `professional luxury jewellery advertisement photography, hyperrealistic, emphasis on gemstone sparkle and precious metal texture`,
      ].join('. ')

      // flux-kontext-pro-i2i: PROVEN to work in production
      // Dual reference: [model image, jewellery image] — Higgsfield Shots approach
      const requestId = await submitJob('flux-kontext-pro-i2i', {
        prompt,
        images_list: referenceImages,  // dual-reference when jewellery URL provided
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

// Motion Prompt Formula (from AI Video Creation Guide):
// Camera Movement + Subject Motion + Environmental Effects + Speed + Mood
// + Jewelry-Specific: focus-tracks-jewellery, sparkle/flare language, lens specs
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
  return (
    motionMap[angle] ??
    'model moves gracefully, jewellery catches studio light brilliantly, gemstones sparkle with each subtle movement, ' +
    'focus tracks jewellery throughout, 4K slow motion, cinematic luxury jewellery campaign'
  )
}

/**
 * Generate all 5 video clips sequentially (avoids MuAPI rate limits).
 * modelImageUrl is the NanoBanana output — passed as a secondary reference
 * to Seedance for consistent face/jewellery identity across all clips.
 */
export async function generateAllVideoClips(
  shots: Array<{ angle: string; image_url: string }>,
  description: string,
  modelImageUrl?: string,
): Promise<Array<{ angle: string; video_url: string }>> {
  const results: Array<{ angle: string; video_url: string }> = []
  for (const shot of shots) {
    console.log(`[muapi] Generating video for angle: ${shot.angle}`)
    const videoUrl = await generateVideoFromShot(shot.image_url, shot.angle, description, modelImageUrl)
    results.push({ angle: shot.angle, video_url: videoUrl })
  }
  return results
}

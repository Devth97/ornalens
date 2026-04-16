// MuAPI client — covers NanoBanana model placement + multi-angle shots
const BASE_URL = 'https://api.muapi.ai'

const SHOT_ANGLES = [
  { angle: 'front',          prompt: 'front view, face-on, eye-level, 50mm lens, f/4, studio lighting' },
  { angle: 'three_quarter',  prompt: 'three-quarter view, slight left turn, 50mm, f/4, studio lighting' },
  { angle: 'close_up',       prompt: 'close-up detail shot, 85mm, f/1.4, shallow depth of field, jewellery focus' },
  { angle: 'side',           prompt: 'side profile, 35mm, f/4, elegant pose, full necklace visible' },
  { angle: 'overhead_tilt',  prompt: 'slight overhead angle, 35mm, f/5.6, dramatic lighting, editorial' },
]

async function submitJob(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MUAPI_KEY!,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MuAPI submit failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.request_id
}

async function pollResult(requestId: string, maxWaitMs = 180_000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(`${BASE_URL}/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': process.env.MUAPI_KEY! },
    })
    if (!res.ok) continue
    const data = await res.json()
    const status = (data.status || '').toLowerCase()
    if (['completed', 'succeeded', 'success'].includes(status)) {
      return data.outputs?.[0] ?? data.url ?? data.output
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

/**
 * Step 1 — Place jewellery on a model using NanoBanana
 * Takes raw jewellery photo + model style prefs → returns model wearing jewellery
 */
export async function placeJewelleryOnModel(
  jewelleryImageUrl: string,
  description: string,
  modelStyle: { skin_tone?: string; body_type?: string; pose?: string }
): Promise<string> {
  const skinTone = modelStyle.skin_tone ?? 'medium'
  const bodyType = modelStyle.body_type ?? 'slim'
  const pose = modelStyle.pose ?? 'standing, neutral pose'

  const prompt = `Indian female model, ${skinTone} skin tone, ${bodyType} build, ${pose}, wearing ${description}, professional jewellery photography, white studio background, elegant, high fashion`

  const requestId = await submitJob('nano-banana-2-edit', {
    prompt,
    images_list: [jewelleryImageUrl],   // API requires array, not image_url
    aspect_ratio: '9:16',
    quality: 'high',
  })

  return pollResult(requestId)
}

/**
 * Step 2 — Generate 5 multi-angle shots from the model image
 * Uses flux-kontext to maintain consistency across angles
 */
export async function generateAngleShots(
  modelImageUrl: string,
  description: string
): Promise<Array<{ angle: string; prompt: string; image_url: string }>> {
  const results = await Promise.all(
    SHOT_ANGLES.map(async ({ angle, prompt }) => {
      const fullPrompt = `Indian female model wearing ${description}, ${prompt}, professional jewellery photography, high resolution, editorial fashion`
      const requestId = await submitJob('flux-kontext-dev-i2i', {
        prompt: fullPrompt,
        images_list: [modelImageUrl],   // API requires array, not image_url
        aspect_ratio: '9:16',
        quality: 'high',
        strength: 0.55,
      })
      const imageUrl = await pollResult(requestId)
      return { angle, prompt: fullPrompt, image_url: imageUrl }
    })
  )
  return results
}

// Veo 3 video generation via Google Cloud Vertex AI
// Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos
import { GoogleAuth } from 'google-auth-library'
import path from 'path'

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!
const LOCATION = 'us-central1'
const MODEL = 'veo-3.0-generate-preview'
const BASE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1`

async function getAccessToken(): Promise<string> {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const auth = new GoogleAuth({
    keyFilename: credPath ? path.resolve(process.cwd(), credPath) : undefined,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token!
}

async function submitVeoJob(imageUrl: string, prompt: string): Promise<string> {
  const token = await getAccessToken()

  const body = {
    instances: [{
      prompt,
      image: { gcsUri: imageUrl }, // If Supabase URL, need to download first
    }],
    parameters: {
      sampleCount: 1,
      durationSeconds: 5,
      aspectRatio: '9:16',
      generateAudio: false,
    },
  }

  const url = `${BASE_URL}/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predictLongRunning`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Veo3 submit failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.name // operation name for polling
}

async function pollVeoOperation(operationName: string, maxWaitMs = 600_000): Promise<string> {
  const token = await getAccessToken()
  const start = Date.now()

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 10_000)) // poll every 10s

    const res = await fetch(`${BASE_URL}/${operationName}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) continue

    const data = await res.json()
    if (data.done) {
      if (data.error) throw new Error(`Veo3 failed: ${JSON.stringify(data.error)}`)
      const videos = data.response?.predictions?.[0]?.videoGcsUri
        || data.response?.videos?.[0]?.gcsUri
      if (videos) return videos
      throw new Error('Veo3 done but no video URI found')
    }
  }
  throw new Error(`Veo3 timed out after ${maxWaitMs / 1000}s`)
}

/**
 * Generate a 5-second video clip from a still image
 * Returns GCS URI — caller must copy to Supabase storage for public access
 */
export async function generateVideoFromShot(
  imageUrl: string,
  angle: string,
  description: string
): Promise<string> {
  const prompt = `Elegant jewellery advertisement video, Indian female model wearing ${description}, ${angle} angle, slow graceful movement, professional fashion film, cinematic lighting`
  const operationName = await submitVeoJob(imageUrl, prompt)
  return pollVeoOperation(operationName)
}

/**
 * Generate all video clips for all angle shots in parallel
 */
export async function generateAllVideoClips(
  shots: Array<{ angle: string; image_url: string }>,
  description: string
): Promise<Array<{ angle: string; video_gcs_uri: string }>> {
  const results = await Promise.all(
    shots.map(async (shot) => {
      const gcsUri = await generateVideoFromShot(shot.image_url, shot.angle, description)
      return { angle: shot.angle, video_gcs_uri: gcsUri }
    })
  )
  return results
}

// API client for the Next.js backend
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('clerk-token')
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}` }
}

export async function uploadJewelleryImage(uri: string): Promise<string> {
  const headers = await getAuthHeader()
  const formData = new FormData()
  const filename = uri.split('/').pop() ?? 'jewellery.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { ...headers },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Upload failed')
  }

  const data = await res.json()
  return data.url
}

export async function createJob(params: {
  jewellery_image_url: string
  jewellery_description: string
  model_style: {
    skin_tone: string
    body_type: string
    pose: string
  }
}): Promise<string> {
  const headers = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to create job')
  }

  const data = await res.json()
  return data.job_id
}

export async function getJob(jobId: string) {
  const headers = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    headers,
  })

  if (!res.ok) throw new Error('Failed to fetch job')
  const data = await res.json()
  return data.job
}

export async function listJobs() {
  const headers = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs`, { headers })
  if (!res.ok) throw new Error('Failed to fetch jobs')
  const data = await res.json()
  return data.jobs
}

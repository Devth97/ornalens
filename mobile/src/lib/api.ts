// API client for the Next.js backend
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// Injected by App.tsx via setClerkTokenGetter — Clerk manages its own token
// storage internally; we must use its getToken() rather than reading
// SecureStore directly (Clerk does NOT write to a 'clerk-token' key).
let _getToken: (() => Promise<string | null>) | null = null

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!_getToken) throw new Error('Clerk token getter not initialized')
  const token = await _getToken()
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
    const errText = await res.text().catch(() => '')
    let err
    try { err = JSON.parse(errText) } catch { err = { error: errText } }
    console.error(`[API Error] POST /api/jobs: ${res.status}`, errText)
    throw new Error(err.error ?? `Failed to create job (${res.status})`)
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
  if (!res.ok) {
    const errText = await res.text()
    console.error(`[API Error] GET /api/jobs: ${res.status}`, errText)
    throw new Error(`Failed to fetch jobs (${res.status}): ${errText}`)
  }
  const data = await res.json()
  return data.jobs
}

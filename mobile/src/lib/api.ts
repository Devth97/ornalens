// API client for the Next.js backend
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// Injected by App.tsx — Clerk's getToken() is the only reliable way to get
// a fresh JWT in Expo. We store the function reference here and call it per-request.
let _getToken: (() => Promise<string | null>) | null = null

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!_getToken) throw new Error('Not authenticated — Clerk not ready')

  // getToken() with no args returns the session JWT for the current user
  // It refreshes automatically if expired
  const token = await _getToken()

  if (!token) {
    throw new Error('Unauthorized — please sign in again')
  }

  return { Authorization: `Bearer ${token}` }
}

export async function uploadJewelleryImage(uri: string): Promise<string> {
  const authHeaders = await getAuthHeader()

  const formData = new FormData()
  const filename = uri.split('/').pop() ?? 'jewellery.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  // React Native FormData requires this exact shape for file uploads
  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob)

  console.log('[API] Uploading to:', `${API_URL}/api/upload`)
  console.log('[API] Auth token present:', true)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      // Do NOT set Content-Type for multipart — React Native sets it automatically with boundary
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let err
    try { err = JSON.parse(text) } catch { err = { error: text || `HTTP ${res.status}` } }
    console.error('[API] Upload failed:', res.status, text.slice(0, 200))
    throw new Error(err.error ?? `Upload failed (${res.status})`)
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
  const authHeaders = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let err
    try { err = JSON.parse(text) } catch { err = { error: text || `HTTP ${res.status}` } }
    console.error(`[API] POST /api/jobs failed: ${res.status}`, text.slice(0, 200))
    throw new Error(err.error ?? `Failed to create job (${res.status})`)
  }

  const data = await res.json()
  return data.job_id
}

export async function getJob(jobId: string) {
  const authHeaders = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs/${jobId}`, { headers: authHeaders })

  if (!res.ok) throw new Error(`Failed to fetch job (${res.status})`)
  const data = await res.json()
  return data.job
}

export async function listJobs() {
  const authHeaders = await getAuthHeader()

  const res = await fetch(`${API_URL}/api/jobs`, { headers: authHeaders })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[API] GET /api/jobs failed: ${res.status}`, text.slice(0, 200))
    throw new Error(`Failed to fetch jobs (${res.status})`)
  }

  const data = await res.json()
  return data.jobs
}

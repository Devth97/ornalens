// Helpers for internal step-to-step pipeline calls.
// Each pipeline step fires the next step as a separate Vercel invocation
// (its own maxDuration=300s budget) via a POST with this secret header.
// Add INTERNAL_API_SECRET to your Vercel env vars (any random string ≥32 chars).

export const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'dev-secret'

export function getBaseUrl(): string {
  // VERCEL_URL is auto-set by Vercel (no https:// prefix). Fallback for local dev.
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
}

// Fire a pipeline step and await the HTTP response (confirms the new invocation started).
// Does NOT await the step's completion — that runs in its own serverless context.
export async function fireStep(jobId: string, step: 'videos' | 'stitch'): Promise<void> {
  const url = `${getBaseUrl()}/api/jobs/${jobId}/${step}`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'x-internal-secret': INTERNAL_SECRET },
    })
  } catch (e) {
    console.error(`[internal] Failed to fire ${step} for job ${jobId}:`, e)
  }
}

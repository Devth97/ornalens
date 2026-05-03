// POST /api/jobs/[id]/videos — Step 3: generate video clips (internal only)
// Called by /api/jobs after angle shots are saved. Fires /stitch when done.
// Internal requests only — authenticated via x-internal-secret header.
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabaseAdmin } from '@/lib/supabase'
import { generateAllVideoClips } from '@/lib/muapi'
import { INTERNAL_SECRET, fireStep } from '@/lib/internal'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (req.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: jobId } = await params

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  waitUntil(runVideos(job))
  return NextResponse.json({ ok: true })
}

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', jobId)
  if (error) console.error(`[videos] updateJob failed for ${jobId}:`, error.message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runVideos(job: any) {
  const { id: jobId, jewellery_description: description, model_image_url: modelImageUrl } = job

  const shots: Array<{ angle: string; image_url: string }> = (job.angle_shots ?? [])
    .filter((s: { image_url: string | null }) => s.image_url)
    .map((s: { angle: string; image_url: string }) => ({ angle: s.angle, image_url: s.image_url }))

  if (shots.length === 0) {
    await updateJob(jobId, { status: 'failed', error_message: 'No angle shots to generate videos from' })
    return
  }

  try {
    console.log(`[videos:${jobId}] Step 3: Generating ${shots.length} video clips in parallel`)
    const videoClips = await generateAllVideoClips(shots, description, modelImageUrl)

    // Merge video URLs into existing angle_shots array (preserves image_urls)
    const shotsWithVideos = (job.angle_shots ?? []).map((s: { angle: string; image_url: string | null; video_url: string | null }) => ({
      ...s,
      video_url: videoClips.find(v => v.angle === s.angle)?.video_url ?? s.video_url ?? null,
    }))

    await updateJob(jobId, { status: 'videos_done', angle_shots: shotsWithVideos })
    console.log(`[videos:${jobId}] ${videoClips.length}/${shots.length} clips done — firing stitch`)

    await fireStep(jobId, 'stitch')

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[videos:${jobId}] ❌ Failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: msg })
  }
}

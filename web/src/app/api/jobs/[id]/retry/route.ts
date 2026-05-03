// POST /api/jobs/[id]/retry — resume pipeline from last completed step
//
// Resumes from earliest failure point using chain-fire (each step = own 300s invocation):
//   has videos saved   → fires /stitch directly
//   has shots saved    → fires /videos  (which then fires /stitch)
//   no shots saved     → re-runs Step 2 inline, then fires /videos
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateAngleShots, pickOutfit } from '@/lib/muapi'
import { fireStep } from '@/lib/internal'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jobId } = await params

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (!job.model_image_url) {
    return NextResponse.json({ error: 'No model image saved — start a fresh job' }, { status: 400 })
  }

  if (job.status === 'completed') {
    return NextResponse.json({ error: 'Job already completed' }, { status: 400 })
  }

  // Reject if pipeline is still actively running — prevents duplicate Seedance charges
  // and racy writes to angle_shots from two concurrent invocations.
  const activeStatuses = ['processing', 'model_done', 'shots_done', 'videos_done', 'stitching']
  if (activeStatuses.includes(job.status)) {
    return NextResponse.json(
      { error: 'Job is still running — wait for it to complete or fail before resuming' },
      { status: 409 }
    )
  }

  const hasAngleShots = job.angle_shots?.some((s: { image_url: string | null }) => s.image_url)
  const hasVideos     = job.angle_shots?.some((s: { video_url: string | null }) => s.video_url)
  const resumingFrom  = hasVideos ? 'stitch' : hasAngleShots ? 'videos' : 'angle_shots'

  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', error_message: null })
    .eq('id', jobId)

  if (hasVideos) {
    // Clips already exist — just re-stitch
    waitUntil(fireStep(jobId, 'stitch'))
  } else if (hasAngleShots) {
    // Shots exist, videos don't — start from Step 3
    waitUntil(fireStep(jobId, 'videos'))
  } else {
    // No shots — re-run Step 2 inline (fits in 300s), then fire Step 3
    waitUntil(rerunAngleShots(job))
  }

  return NextResponse.json({ job_id: jobId, status: 'processing', resuming_from: resumingFrom })
}

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', jobId)
  if (error) console.error(`[retry] updateJob failed for ${jobId}:`, error.message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rerunAngleShots(job: any) {
  const { id: jobId, jewellery_description: description,
          model_image_url: modelImageUrl, jewellery_image_url: jewelleryImageUrl } = job
  try {
    console.log(`[retry:${jobId}] Re-running Step 2: angle shots`)
    // Use the outfit baked into the saved portrait. Fall back to a new pick only for old
    // job rows that predate the `outfit` column — avoids visible cloth/colour drift.
    const outfit: string = job.outfit ?? pickOutfit()
    const shots = await generateAngleShots(modelImageUrl, description, jewelleryImageUrl, outfit)
    await updateJob(jobId, {
      status: 'shots_done',
      angle_shots: shots.map(s => ({ angle: s.angle, image_url: s.image_url, video_url: null })),
    })
    console.log(`[retry:${jobId}] ${shots.length} shots done — firing videos`)
    await fireStep(jobId, 'videos')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[retry:${jobId}] ❌ Angle shots failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: msg })
  }
}

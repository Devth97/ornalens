// POST /api/jobs/[id]/retry — resume pipeline from last completed step
// Reads saved job state and continues from the earliest failed point:
//   model_done  (angle shots never saved) → re-run Steps 2 + 3 + 4
//   shots_done  (videos never generated) → run Steps 3 + 4
//   videos_done (stitch never ran)       → run Step 4
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateAngleShots, generateAllVideoClips, pickOutfit } from '@/lib/muapi'
import { stitchVideosWithTransitions, uploadFinalVideo } from '@/lib/remotion-stitch'

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

  const hasAngleShots = job.angle_shots?.some((s: { image_url: string | null }) => s.image_url)
  const hasVideos     = job.angle_shots?.some((s: { video_url: string | null }) => s.video_url)
  const resumingFrom  = hasVideos ? 'stitch' : hasAngleShots ? 'videos' : 'angle_shots'

  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', error_message: null })
    .eq('id', jobId)

  waitUntil(
    resumePipeline(job).catch(err => console.error(`[retry] Job ${jobId} crashed:`, err))
  )

  return NextResponse.json({ job_id: jobId, status: 'processing', resuming_from: resumingFrom })
}

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', jobId)
  if (error) console.error(`[retry] updateJob failed for ${jobId}:`, error.message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resumePipeline(job: any) {
  const { id: jobId, jewellery_description: description, model_image_url: modelImageUrl,
          jewellery_image_url: jewelleryImageUrl, model_style: modelStyle } = job

  const hasAngleShots = job.angle_shots?.some((s: { image_url: string | null }) => s.image_url)
  const hasVideos     = job.angle_shots?.some((s: { video_url: string | null }) => s.video_url)

  try {
    let shots: Array<{ angle: string; image_url: string }>
    let videoClips: Array<{ angle: string; video_url: string }>

    // ── Step 2: angle shots (only if not already saved) ───────────────────
    if (!hasAngleShots) {
      console.log(`[retry:${jobId}] Step 2: generating angle shots`)
      const outfit = pickOutfit()
      const newShots = await generateAngleShots(modelImageUrl, description, jewelleryImageUrl, outfit)
      await updateJob(jobId, {
        status: 'shots_done',
        angle_shots: newShots.map(s => ({ angle: s.angle, image_url: s.image_url, video_url: null })),
      })
      shots = newShots
      console.log(`[retry:${jobId}] ${shots.length} angle shots done`)
    } else {
      shots = job.angle_shots
        .filter((s: { image_url: string | null }) => s.image_url)
        .map((s: { angle: string; image_url: string }) => ({ angle: s.angle, image_url: s.image_url }))
      console.log(`[retry:${jobId}] Reusing ${shots.length} saved angle shots`)
    }

    // ── Step 3: videos (only if not already saved) ────────────────────────
    if (!hasVideos) {
      console.log(`[retry:${jobId}] Step 3: generating video clips`)
      videoClips = await generateAllVideoClips(shots, description, modelImageUrl)
      const shotsWithVideos = shots.map(shot => ({
        ...shot,
        video_url: videoClips.find(v => v.angle === shot.angle)?.video_url ?? null,
      }))
      await updateJob(jobId, { status: 'videos_done', angle_shots: shotsWithVideos })
      console.log(`[retry:${jobId}] ${videoClips.length} videos done`)
    } else {
      videoClips = job.angle_shots
        .filter((s: { video_url: string | null }) => s.video_url)
        .map((s: { angle: string; video_url: string }) => ({ angle: s.angle, video_url: s.video_url }))
      console.log(`[retry:${jobId}] Reusing ${videoClips.length} saved videos`)
    }

    // ── Step 4: stitch ────────────────────────────────────────────────────
    console.log(`[retry:${jobId}] Step 4: stitching`)
    await updateJob(jobId, { status: 'stitching' })

    let finalVideoUrl: string | null = null
    try {
      const videoUrls = videoClips.map(v => v.video_url)
      const finalPath = await stitchVideosWithTransitions(videoUrls, jobId)
      finalVideoUrl = await uploadFinalVideo(finalPath, jobId, supabaseAdmin as any)
      console.log(`[retry:${jobId}] ✅ Stitch complete: ${finalVideoUrl}`)
    } catch (stitchErr) {
      const msg = stitchErr instanceof Error ? stitchErr.message : String(stitchErr)
      console.error(`[retry:${jobId}] ⚠️ Stitch failed (non-fatal): ${msg}`)
      finalVideoUrl = videoClips[0]?.video_url ?? null
    }

    await updateJob(jobId, { status: 'completed', final_video_url: finalVideoUrl })
    console.log(`[retry:${jobId}] ✅ Complete`)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[retry:${jobId}] ❌ Failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: msg })
  }
}

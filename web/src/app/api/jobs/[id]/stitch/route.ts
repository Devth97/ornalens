// POST /api/jobs/[id]/stitch — Step 4: FFmpeg xfade stitch + Supabase upload (internal only)
// Called by /api/jobs/[id]/videos after all clips are saved.
// Internal requests only — authenticated via x-internal-secret header.
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabaseAdmin } from '@/lib/supabase'
import { stitchVideosWithTransitions, uploadFinalVideo } from '@/lib/remotion-stitch'
import { INTERNAL_SECRET } from '@/lib/internal'

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

  waitUntil(runStitch(job))
  return NextResponse.json({ ok: true })
}

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', jobId)
  if (error) console.error(`[stitch] updateJob failed for ${jobId}:`, error.message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runStitch(job: any) {
  const { id: jobId } = job

  const videoUrls: string[] = (job.angle_shots ?? [])
    .filter((s: { video_url: string | null }) => s.video_url)
    .map((s: { video_url: string }) => s.video_url)

  if (videoUrls.length === 0) {
    await updateJob(jobId, { status: 'failed', error_message: 'No video clips available to stitch' })
    return
  }

  await updateJob(jobId, { status: 'stitching' })

  let finalVideoUrl: string | null = null
  try {
    console.log(`[stitch:${jobId}] Step 4: Stitching ${videoUrls.length} clips — URLs:`, videoUrls)
    const finalPath = await stitchVideosWithTransitions(videoUrls, jobId)
    finalVideoUrl = await uploadFinalVideo(finalPath, jobId, supabaseAdmin as any)
    console.log(`[stitch:${jobId}] ✅ Stitch complete: ${finalVideoUrl}`)
  } catch (stitchErr) {
    const msg = stitchErr instanceof Error ? stitchErr.message : String(stitchErr)
    console.error(`[stitch:${jobId}] ❌ Stitch failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: `Stitch failed: ${msg}` })
    return
  }

  await updateJob(jobId, { status: 'completed', final_video_url: finalVideoUrl })
  console.log(`[stitch:${jobId}] ✅ Job complete`)
}

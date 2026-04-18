// POST /api/jobs — create job + kick off full pipeline async
// GET  /api/jobs — list jobs for authenticated user

// Pipeline: NanoBanana (Step 1) + 5×Flux parallel (Step 2) + 5×Seedance sequential (Step 3) + ffmpeg xfade stitch (Step 4)
// Total runtime: 8–15 min. Vercel Hobby maxDuration=300s covers Steps 1+2 and ~3 Seedance clips.
// Stitch fallback: if stitch fails or times out, first video clip is used as final video.
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { placeJewelleryOnModel, generateAngleShots, generateAllVideoClips, pickOutfit } from '@/lib/muapi'
import { stitchVideosWithTransitions, uploadFinalVideo } from '@/lib/remotion-stitch'

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    jewellery_image_url,
    jewellery_description,
    model_style = {},
  } = body

  if (!jewellery_image_url || !jewellery_description) {
    return NextResponse.json({ error: 'jewellery_image_url and jewellery_description required' }, { status: 400 })
  }

  // Create job record
  const { data: job, error: createErr } = await supabaseAdmin
    .from('jobs')
    .insert({
      user_id: userId,
      status: 'processing',
      jewellery_image_url,
      jewellery_description,
      model_style,
    })
    .select()
    .single()

  if (createErr || !job) {
    return NextResponse.json({ error: createErr?.message ?? 'Failed to create job' }, { status: 500 })
  }

  // waitUntil keeps the Vercel serverless function alive until pipeline completes
  // Without this, Vercel kills the process as soon as the response is sent
  waitUntil(
    runPipeline(job.id, jewellery_image_url, jewellery_description, model_style)
      .catch(err => console.error(`[pipeline] Job ${job.id} failed:`, err))
  )

  return NextResponse.json({ job_id: job.id, status: 'processing' }, { status: 201 })
}

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', jobId)
  if (error) console.error(`[pipeline] updateJob failed for ${jobId}:`, error.message)
}

async function runPipeline(
  jobId: string,
  jewelleryImageUrl: string,
  description: string,
  modelStyle: Record<string, string>,
) {
  console.log(`[pipeline] Starting job ${jobId}`)

  // Pick outfit once — used in both Step 1 + Step 2 so all angles match within a job
  const outfit = pickOutfit()
  console.log(`[pipeline:${jobId}] Outfit selected: ${outfit}`)

  try {
    // ── Step 1: NanoBanana — place jewellery on model ──────────────────
    console.log(`[pipeline:${jobId}] Step 1: Placing jewellery on model`)
    const modelImageUrl = await placeJewelleryOnModel(jewelleryImageUrl, description, modelStyle, outfit)
    await updateJob(jobId, { status: 'model_done', model_image_url: modelImageUrl })
    console.log(`[pipeline:${jobId}] Model image: ${modelImageUrl}`)

    // ── Step 2: Multi-angle shots ──────────────────────────────────────
    console.log(`[pipeline:${jobId}] Step 2: Generating angle shots`)
    const shots = await generateAngleShots(modelImageUrl, description, jewelleryImageUrl, outfit)
    await updateJob(jobId, {
      status: 'shots_done',
      angle_shots: shots.map(s => ({ ...s, video_url: null })),
    })
    console.log(`[pipeline:${jobId}] Generated ${shots.length} shots`)

    // ── Step 3: MuAPI Seedance Pro I2V Fast — video per shot ──────────────
    console.log(`[pipeline:${jobId}] Step 3: Generating video clips via MuAPI (Seedance v1.5 Pro I2V)`)
    const videoClips = await generateAllVideoClips(shots, description, modelImageUrl)

    const shotsWithVideos = shots.map((shot, i) => ({
      ...shot,
      video_url: videoClips[i]?.video_url ?? null,
    }))
    await updateJob(jobId, {
      status: 'videos_done',
      angle_shots: shotsWithVideos,
    })

    // ── Step 4: Stitch clips ────────────────────────────────────────────
    console.log(`[pipeline:${jobId}] Step 4: Stitching video clips`)
    await updateJob(jobId, { status: 'stitching' })

    let finalVideoUrl: string | null = null
    try {
      const videoUrls = videoClips.map(v => v.video_url)
      const finalVideoLocalPath = await stitchVideosWithTransitions(videoUrls, jobId)
      finalVideoUrl = await uploadFinalVideo(finalVideoLocalPath, jobId, supabaseAdmin as any)
      console.log(`[pipeline:${jobId}] ✅ Stitch complete: ${finalVideoUrl}`)
    } catch (stitchErr) {
      // Stitch failed — still mark completed so user can see images + individual clips
      // Fallback: use the first video clip as the "final" video
      const msg = stitchErr instanceof Error ? stitchErr.message : String(stitchErr)
      console.error(`[pipeline:${jobId}] ⚠️ Stitch failed (non-fatal): ${msg}`)
      finalVideoUrl = videoClips[0]?.video_url ?? null
    }

    await updateJob(jobId, { status: 'completed', final_video_url: finalVideoUrl })
    console.log(`[pipeline:${jobId}] ✅ Complete: ${finalVideoUrl}`)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pipeline:${jobId}] ❌ Failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: msg })
  }
}

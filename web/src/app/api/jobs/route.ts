// POST /api/jobs — create job + run Steps 1+2, then fire Step 3 as a separate invocation
// GET  /api/jobs — list jobs for authenticated user

// Chain-fire architecture — each step is a separate Vercel serverless invocation (own 300s budget):
//   POST /api/jobs          → Steps 1+2 (NanoBanana portrait + 5× angle shots) → fires /videos
//   POST /api/jobs/[id]/videos → Step 3 (5× Seedance parallel)                 → fires /stitch
//   POST /api/jobs/[id]/stitch → Step 4 (FFmpeg xfade + Supabase upload)
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { placeJewelleryOnModel, generateAngleShots, pickOutfit } from '@/lib/muapi'
import { fireStep } from '@/lib/internal'

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
    // Persist outfit separately so retry can reuse it instead of re-rolling a mismatched one.
    // Best-effort: silently ignored if `outfit TEXT` column hasn't been added to jobs table yet.
    await supabaseAdmin.from('jobs').update({ outfit }).eq('id', jobId).then(
      ({ error }) => { if (error) console.warn(`[pipeline:${jobId}] outfit save skipped: ${error.message}`) }
    )
    console.log(`[pipeline:${jobId}] Model image: ${modelImageUrl}`)

    // ── Step 2: Multi-angle shots ──────────────────────────────────────
    console.log(`[pipeline:${jobId}] Step 2: Generating angle shots`)
    const shots = await generateAngleShots(modelImageUrl, description, jewelleryImageUrl, outfit)
    await updateJob(jobId, {
      status: 'shots_done',
      angle_shots: shots.map(s => ({ angle: s.angle, image_url: s.image_url, video_url: null })),
    })
    console.log(`[pipeline:${jobId}] Generated ${shots.length} shots`)

    // ── Steps 3+4 run in their own Vercel invocations (separate 300s budgets) ──
    console.log(`[pipeline:${jobId}] Firing Step 3 (videos) as separate invocation`)
    await fireStep(jobId, 'videos')

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pipeline:${jobId}] ❌ Failed: ${msg}`)
    await updateJob(jobId, { status: 'failed', error_message: msg })
  }
}

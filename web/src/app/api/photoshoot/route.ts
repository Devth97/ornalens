// POST /api/photoshoot — template-based jewellery product photography
//
// Single-pass AI generation:
//   - MuAPI nano-banana-2-edit with the jewellery image as reference
//   - Prompt instructs the AI to extract ONLY the jewellery piece (ignore fingers/hands/tags)
//   - Reproduce exact design in the template scene
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePhotoshootImage } from '@/lib/muapi'

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    jewellery_image_url,
    template_id,
    prompt,
    additional_notes,
    aspect_ratio = '1:1',
    quality = 'Standard',
  } = body

  if (!jewellery_image_url || !prompt) {
    return NextResponse.json(
      { error: 'jewellery_image_url and prompt required' },
      { status: 400 }
    )
  }

  // ── Token check ──────────────────────────────────────────────────────
  const COST = 450
  const STARTER = 2000
  const { count: completedCount } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
  const tokensUsedSoFar = (completedCount ?? 0) * COST

  const { data: tokenRow } = await supabaseAdmin
    .from('user_tokens')
    .select('tokens_granted, tokens_used')
    .eq('user_id', userId)
    .maybeSingle()

  const granted = tokenRow?.tokens_granted ?? STARTER
  const used    = tokenRow?.tokens_used    ?? tokensUsedSoFar
  const balance = Math.max(0, granted - used)

  if (balance < COST) {
    return NextResponse.json(
      { error: `Insufficient tokens. You have ${balance} tokens but this generation costs ${COST}.` },
      { status: 402 }
    )
  }
  // ─────────────────────────────────────────────────────────────────────

  // Merge hidden template prompt with optional user notes
  const finalPrompt = additional_notes
    ? `${prompt}. ADDITIONAL USER REQUIREMENTS: ${additional_notes}`
    : prompt

  try {
    console.log(`[photoshoot] Generating for template ${template_id}...`)
    const imageUrl = await generatePhotoshootImage(
      jewellery_image_url,
      finalPrompt,
      aspect_ratio,
      quality === 'High' ? '2k' : undefined,
    )
    console.log(`[photoshoot] Generated: ${imageUrl}`)

    // Store result in jobs table for history tracking
    const { data: job, error: createErr } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: userId,
        status: 'completed',
        jewellery_image_url,
        jewellery_description: `Template: ${template_id}`,
        model_image_url: imageUrl,
        model_style: { template_id, aspect_ratio, quality },
        angle_shots: [],
      })
      .select('id')
      .single()

    if (createErr) {
      console.error('[photoshoot] DB insert failed:', createErr.message)
    }

    // ── Deduct tokens ──────────────────────────────────────────────────
    await supabaseAdmin
      .from('user_tokens')
      .upsert(
        { user_id: userId, plan: 'Starter', tokens_granted: granted, tokens_used: used + COST },
        { onConflict: 'user_id' }
      )

    if (job?.id) {
      await supabaseAdmin.from('token_transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: -COST,
        description: `AI photoshoot — template: ${template_id ?? 'unknown'}`,
        job_id: job.id,
      })
    }
    // ──────────────────────────────────────────────────────────────────

    return NextResponse.json({
      image_url: imageUrl,
      job_id: job?.id ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[photoshoot] Failed: ${msg}`)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

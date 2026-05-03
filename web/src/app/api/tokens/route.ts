// GET /api/tokens  — return token balance; auto-create Starter row for new users
// POST /api/tokens — admin / internal: grant tokens
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'

const COST_PER_GENERATION = 450
const STARTER_TOKENS = 2000

async function ensureUserTokens(userId: string) {
  // Calculate actual tokens_used from completed jobs
  const { count } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')

  const tokensUsed = (count ?? 0) * COST_PER_GENERATION

  const { data, error } = await supabaseAdmin
    .from('user_tokens')
    .upsert(
      {
        user_id: userId,
        plan: 'Starter',
        tokens_granted: STARTER_TOKENS,
        tokens_used: tokensUsed,
      },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const row = await ensureUserTokens(userId)
    return NextResponse.json({
      plan: row.plan,
      tokens_granted: row.tokens_granted,
      tokens_used: row.tokens_used,
      tokens_balance: Math.max(0, row.tokens_granted - row.tokens_used),
      plan_expires_at: row.plan_expires_at,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

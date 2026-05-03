// GET  /api/favorites         — list all favorite template IDs for the user
// POST /api/favorites         — toggle a favorite: { template_id: string }
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('template_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ favorites: data.map((r) => r.template_id) })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { template_id } = body
  if (!template_id) {
    return NextResponse.json({ error: 'template_id required' }, { status: 400 })
  }

  // Check if already favorited
  const { data: existing } = await supabaseAdmin
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', template_id)
    .maybeSingle()

  if (existing) {
    // Remove it
    await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', template_id)
    return NextResponse.json({ action: 'removed', template_id })
  } else {
    // Add it
    await supabaseAdmin
      .from('favorites')
      .insert({ user_id: userId, template_id })
    return NextResponse.json({ action: 'added', template_id })
  }
}

// GET /api/jobs/[id] — poll job status (used by mobile app for real-time updates)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId) // ensure ownership
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({ job })
}

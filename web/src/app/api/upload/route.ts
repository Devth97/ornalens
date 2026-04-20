// POST /api/upload — upload raw jewellery image to Supabase storage
// Returns public URL to be passed to POST /api/jobs

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/get-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })
  }

  const timestamp = Date.now()
  const storagePath = `uploads/${userId}/${timestamp}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin
    .storage
    .from('ornalens-media')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin
    .storage
    .from('ornalens-media')
    .getPublicUrl(storagePath)

  return NextResponse.json({ url: data.publicUrl })
}

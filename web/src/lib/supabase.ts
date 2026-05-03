import { createClient } from '@supabase/supabase-js'

// Server-side client (bypasses RLS) — only used in API routes.
// Falls back to placeholder values at build time (env vars are always
// present at runtime on Vercel).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-key'
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'model_done'
  | 'shots_done'
  | 'videos_done'
  | 'stitching'
  | 'completed'
  | 'failed'

export interface AngleShot {
  angle: string
  prompt: string
  image_url: string | null
  video_url: string | null
}

export interface Job {
  id: string
  user_id: string
  status: JobStatus
  error_message?: string
  jewellery_image_url?: string
  jewellery_description?: string
  model_style: {
    skin_tone?: string
    body_type?: string
    pose?: string
  }
  model_image_url?: string
  angle_shots: AngleShot[]
  final_video_url?: string
  created_at: string
  updated_at: string
}

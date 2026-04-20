export interface AngleShot {
  angle: string
  prompt?: string
  image_url: string | null
  video_url: string | null
}

export interface Job {
  id: string
  user_id: string
  status: string
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

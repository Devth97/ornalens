-- OrnalLens Schema
-- Run this in Supabase SQL editor: https://supabase.com/dashboard/project/gnuebxecqptmqleyloqk/sql

-- Jobs table: tracks the full generation pipeline per jewellery piece
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- Clerk user ID
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | processing | model_done | shots_done | videos_done | stitching | completed | failed
  error_message TEXT,

  -- Input
  jewellery_image_url TEXT,                 -- Raw jewellery photo (Supabase storage)
  jewellery_description TEXT,              -- e.g. "diamond necklace"
  model_style JSONB DEFAULT '{}',          -- { skin_tone, body_type, pose }

  -- Pipeline outputs
  model_image_url TEXT,                     -- NanoBanana output: model wearing jewellery
  angle_shots JSONB DEFAULT '[]',           -- Array of { angle, image_url, video_url }
  final_video_url TEXT,                     -- Stitched final video

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket for all media
INSERT INTO storage.buckets (id, name, public)
VALUES ('ornalens-media', 'ornalens-media', true)
ON CONFLICT DO NOTHING;

-- RLS: users can only see their own jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by Next.js API)
-- User-facing reads use anon key with these policies:
CREATE POLICY "Users read own jobs"
  ON jobs FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Storage policy: authenticated uploads
CREATE POLICY "Authenticated uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ornalens-media');

CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ornalens-media');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

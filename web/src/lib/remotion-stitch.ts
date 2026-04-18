// Video stitching with crossfade transitions via ffmpeg xfade filter
// Re-encoding with libx264 fast preset is reliable on Vercel for short clips (2-5×5s)
// xfade requires decoded input — clips must be same resolution and fps (Seedance guarantees this)

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import type { SupabaseClient } from '@supabase/supabase-js'

const execFileAsync = promisify(execFile)

function getFfmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@ffmpeg-installer/ffmpeg').path
  } catch {
    return 'ffmpeg'
  }
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download video (${res.status}): ${url}`)
  const buffer = await res.arrayBuffer()
  await fs.writeFile(destPath, Buffer.from(buffer))
}

const CLIP_DURATION_S = 5    // Seedance output duration (matches duration: 5 in muapi.ts)
const FADE_DURATION_S = 0.5  // crossfade overlap between clips

/**
 * Stitch clips with smooth crossfade transitions using ffmpeg xfade filter.
 *
 * xfade offset formula for N clips chained sequentially:
 *   transition_i_offset = (i + 1) * (CLIP_DURATION_S - FADE_DURATION_S)
 * e.g. 2 clips × 5s with 0.5s fade → offset = 4.5s, output = 9.5s total
 */
export async function stitchVideosWithTransitions(
  videoUrls: string[],
  jobId: string
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `ornalens-${jobId}`)
  await fs.mkdir(tmpDir, { recursive: true })

  console.log(`[stitch] Downloading ${videoUrls.length} clips`)

  // Download all clips
  const clipPaths: string[] = []
  for (let i = 0; i < videoUrls.length; i++) {
    const clipPath = path.join(tmpDir, `clip_${i}.mp4`)
    await downloadVideo(videoUrls[i], clipPath)
    clipPaths.push(clipPath)
    console.log(`[stitch] Downloaded clip ${i + 1}/${videoUrls.length}`)
  }

  if (clipPaths.length === 1) return clipPaths[0]

  const finalPath = path.join(tmpDir, 'final.mp4')
  const ffmpeg = getFfmpegPath()

  // Build xfade filter chain for N clips
  // Each clip is a separate -i input; xfade is chained progressively
  const inputs = clipPaths.flatMap(p => ['-i', p])

  const filterParts: string[] = []
  let prevLabel = '[0:v]'
  for (let i = 1; i < clipPaths.length; i++) {
    const offset = i * (CLIP_DURATION_S - FADE_DURATION_S)
    const outLabel = i === clipPaths.length - 1 ? '[outv]' : `[x${i}]`
    filterParts.push(
      `${prevLabel}[${i}:v]xfade=transition=fade:duration=${FADE_DURATION_S}:offset=${offset}${outLabel}`
    )
    prevLabel = `[x${i}]`
  }

  console.log(`[stitch] Encoding ${clipPaths.length} clips with xfade crossfade (${FADE_DURATION_S}s)`)

  await execFileAsync(ffmpeg, [
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[outv]',
    '-an',               // drop audio — Seedance clips have no meaningful audio
    '-c:v', 'libx264',
    '-preset', 'fast',   // fast encode, good quality
    '-crf', '23',        // visually lossless at this crf
    '-movflags', '+faststart',
    '-y', finalPath,
  ])

  console.log(`[stitch] Done: ${finalPath}`)
  return finalPath
}

export async function uploadFinalVideo(
  videoPath: string,
  jobId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any>
): Promise<string> {
  const buffer = await fs.readFile(videoPath)
  const storagePath = `jobs/${jobId}/final_video.mp4`

  const { error } = await (supabaseAdmin as any)
    .storage
    .from('ornalens-media')
    .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data } = (supabaseAdmin as any)
    .storage
    .from('ornalens-media')
    .getPublicUrl(storagePath)

  await fs.rm(path.dirname(videoPath), { recursive: true, force: true })
  return data.publicUrl
}

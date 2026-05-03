// Video stitching with crossfade transitions via ffmpeg xfade filter
// Re-encoding with libx264 fast preset is reliable on Vercel for short clips (5×5s)
// xfade requires decoded input — clips must be same resolution and fps (Seedance guarantees this)

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import type { SupabaseClient } from '@supabase/supabase-js'

const execFileAsync = promisify(execFile)

function getFfmpegPath(): string {
  // ffmpeg-static is in serverExternalPackages so webpack won't mangle require()
  // Returns correct absolute path on both Windows dev and Vercel Linux
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('ffmpeg-static') as string
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download video (${res.status}): ${url}`)
  const buffer = await res.arrayBuffer()
  await fs.writeFile(destPath, Buffer.from(buffer))
}

const FADE_DURATION_S = 0.5  // crossfade overlap between clips

/**
 * Probe the duration of a local video file using FFmpeg stderr output.
 * FFmpeg always exits non-zero when given only -i, so we catch the error and read stderr.
 */
async function getClipDuration(ffmpeg: string, clipPath: string): Promise<number> {
  const result = await execFileAsync(ffmpeg, ['-i', clipPath]).catch((e: unknown) => e)
  const stderr = (result as { stderr?: string }).stderr ?? ''
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (match) {
    const duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
    console.log(`[stitch] Probed clip duration: ${duration}s`)
    return duration
  }
  console.warn(`[stitch] Could not probe duration, falling back to 5s`)
  return 5
}

/**
 * Stitch clips with smooth crossfade transitions using ffmpeg xfade filter.
 *
 * xfade offset formula for N clips chained sequentially:
 *   offset[i] = i * (clipDuration - FADE_DURATION_S)
 * Duration is probed at runtime so dev-mode test clips and production clips both work.
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

  // Probe actual clip duration so xfade offsets are correct regardless of clip length
  const clipDuration = await getClipDuration(ffmpeg, clipPaths[0])

  // Build xfade filter chain for N clips
  // Each clip is a separate -i input; xfade is chained progressively
  const inputs = clipPaths.flatMap(p => ['-i', p])

  const filterParts: string[] = []

  // Step 1 — normalize every clip to same resolution + fps before xfade.
  // Seedance v1.5 clips can vary in SAR/resolution, causing xfade to fail.
  const TARGET_W = 720
  const TARGET_H = 1280
  const TARGET_FPS = 24
  const normalizedLabels: string[] = []
  for (let i = 0; i < clipPaths.length; i++) {
    const label = `[v${i}]`
    filterParts.push(
      `[${i}:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,` +
      `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${TARGET_FPS}${label}`
    )
    normalizedLabels.push(label)
  }

  // Step 2 — chain xfade transitions on normalized streams
  let prevLabel = normalizedLabels[0]
  for (let i = 1; i < clipPaths.length; i++) {
    const offset = i * (clipDuration - FADE_DURATION_S)
    const outLabel = i === clipPaths.length - 1 ? '[outv]' : `[x${i}]`
    filterParts.push(
      `${prevLabel}${normalizedLabels[i]}xfade=transition=fade:duration=${FADE_DURATION_S}:offset=${offset}${outLabel}`
    )
    prevLabel = `[x${i}]`
  }

  console.log(`[stitch] Encoding ${clipPaths.length} clips with xfade crossfade (${FADE_DURATION_S}s) at ${TARGET_W}x${TARGET_H}@${TARGET_FPS}fps`)

  await execFileAsync(ffmpeg, [
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[outv]',
    '-an',               // drop audio — Seedance clips have no meaningful audio
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
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

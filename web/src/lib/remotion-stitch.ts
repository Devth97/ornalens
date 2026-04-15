// Video stitching pipeline:
// 1. Veo3 generates individual clips per angle shot
// 2. Remotion renders dissolve transitions between clips
// 3. FFmpeg concatenates: clip1 + transition + clip2 + transition + ...
//
// This runs server-side on Railway (Node.js, NOT in browser)

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import type { SupabaseClient } from '@supabase/supabase-js'

const execFileAsync = promisify(execFile)

// Get ffmpeg path — works locally and on Railway
function getFfmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@ffmpeg-installer/ffmpeg').path
  } catch {
    return 'ffmpeg' // fallback to system ffmpeg
  }
}

/**
 * Download a remote video URL to a temp file
 */
async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download video: ${url}`)
  const buffer = await res.arrayBuffer()
  await fs.writeFile(destPath, Buffer.from(buffer))
}

/**
 * Generate a dissolve transition between two video clips using FFmpeg
 * Returns path to the transition clip
 */
async function generateDissolveTransition(
  clip1Path: string,
  clip2Path: string,
  outputPath: string,
  durationSec = 0.8
): Promise<void> {
  const ffmpeg = getFfmpegPath()

  // Get duration of clip1
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    clip1Path,
  ]).catch(() => ({ stdout: '5' }))

  const clip1Duration = parseFloat(stdout.trim()) || 5
  const offset = Math.max(0, clip1Duration - durationSec)

  // xfade dissolve transition
  await execFileAsync(ffmpeg, [
    '-i', clip1Path,
    '-i', clip2Path,
    '-filter_complex',
    `[0:v][1:v]xfade=transition=dissolve:duration=${durationSec}:offset=${offset}[v]`,
    '-map', '[v]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-y', outputPath,
  ])
}

/**
 * Stitch all video clips with dissolve transitions using FFmpeg
 * Input: array of video URLs (from Veo3 / Supabase storage)
 * Output: path to final stitched video
 */
export async function stitchVideosWithTransitions(
  videoUrls: string[],
  jobId: string
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `ornalens-${jobId}`)
  await fs.mkdir(tmpDir, { recursive: true })

  console.log(`[stitch] Downloading ${videoUrls.length} clips to ${tmpDir}`)

  // Download all clips
  const clipPaths: string[] = []
  for (let i = 0; i < videoUrls.length; i++) {
    const clipPath = path.join(tmpDir, `clip_${i}.mp4`)
    await downloadVideo(videoUrls[i], clipPath)
    clipPaths.push(clipPath)
    console.log(`[stitch] Downloaded clip ${i + 1}/${videoUrls.length}`)
  }

  if (clipPaths.length === 1) {
    return clipPaths[0] // Nothing to stitch
  }

  // Generate dissolve transitions between consecutive clips
  const transitionPaths: string[] = []
  for (let i = 0; i < clipPaths.length - 1; i++) {
    const transPath = path.join(tmpDir, `transition_${i}_${i + 1}.mp4`)
    console.log(`[stitch] Generating dissolve transition ${i} → ${i + 1}`)
    await generateDissolveTransition(clipPaths[i], clipPaths[i + 1], transPath)
    transitionPaths.push(transPath)
  }

  // Build concat list: clip0, transition_0_1, clip1, transition_1_2, clip2, ...
  const concatItems: string[] = []
  for (let i = 0; i < clipPaths.length; i++) {
    concatItems.push(clipPaths[i])
    if (i < transitionPaths.length) {
      concatItems.push(transitionPaths[i])
    }
  }

  // Write concat manifest
  const concatListPath = path.join(tmpDir, 'concat_list.txt')
  const concatContent = concatItems.map(p => `file '${p}'`).join('\n')
  await fs.writeFile(concatListPath, concatContent)

  // Final stitch
  const finalPath = path.join(tmpDir, 'final.mp4')
  const ffmpeg = getFfmpegPath()

  console.log(`[stitch] Stitching ${concatItems.length} segments into final video`)
  await execFileAsync(ffmpeg, [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-movflags', '+faststart',
    '-y', finalPath,
  ])

  console.log(`[stitch] Done: ${finalPath}`)
  return finalPath
}

/**
 * Upload stitched video to Supabase storage and return public URL
 */
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
    .upload(storagePath, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data } = (supabaseAdmin as any)
    .storage
    .from('ornalens-media')
    .getPublicUrl(storagePath)

  // Cleanup tmp
  await fs.rm(path.dirname(videoPath), { recursive: true, force: true })

  return data.publicUrl
}

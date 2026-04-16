// Video stitching — concat with fade transitions
// Uses only ffmpeg filters available in old bundled versions (no xfade)
// xfade was added in FFmpeg 4.3 (2020); bundled binary is 2017

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

/**
 * Add fade-out to tail of a clip (works on all ffmpeg versions)
 * This avoids xfade entirely — each clip fades to black at the end
 * and fades in from black at the start → smooth transition feel when concatenated
 */
async function addFadeEffects(
  inputPath: string,
  outputPath: string,
  durationSec: number,
  fadeDuration = 0.6
): Promise<void> {
  const ffmpeg = getFfmpegPath()
  const fadeOutStart = Math.max(0, durationSec - fadeDuration)

  await execFileAsync(ffmpeg, [
    '-i', inputPath,
    '-vf', `fade=in:0:${Math.round(fadeDuration * 24)},fade=out:st=${fadeOutStart}:d=${fadeDuration}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-an',   // strip audio (MuAPI videos have audio track that causes concat issues)
    '-y', outputPath,
  ])
}

/**
 * Get video duration via ffprobe
 */
async function getVideoDuration(clipPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      clipPath,
    ])
    return parseFloat(stdout.trim()) || 5
  } catch {
    return 5
  }
}

/**
 * Stitch all video clips with fade-in/out transitions
 * Works with any ffmpeg version — no xfade needed
 */
export async function stitchVideosWithTransitions(
  videoUrls: string[],
  jobId: string
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `ornalens-${jobId}`)
  await fs.mkdir(tmpDir, { recursive: true })

  console.log(`[stitch] Downloading ${videoUrls.length} clips`)

  // Download all clips
  const rawPaths: string[] = []
  for (let i = 0; i < videoUrls.length; i++) {
    const clipPath = path.join(tmpDir, `raw_${i}.mp4`)
    await downloadVideo(videoUrls[i], clipPath)
    rawPaths.push(clipPath)
    console.log(`[stitch] Downloaded clip ${i + 1}/${videoUrls.length}`)
  }

  if (rawPaths.length === 1) {
    return rawPaths[0]
  }

  // Add fade-in/out to each clip
  const fadedPaths: string[] = []
  for (let i = 0; i < rawPaths.length; i++) {
    const duration = await getVideoDuration(rawPaths[i])
    const fadedPath = path.join(tmpDir, `faded_${i}.mp4`)
    console.log(`[stitch] Adding fade effects to clip ${i + 1} (duration: ${duration}s)`)
    await addFadeEffects(rawPaths[i], fadedPath, duration)
    fadedPaths.push(fadedPath)
  }

  // Write concat manifest
  const concatListPath = path.join(tmpDir, 'concat_list.txt')
  const concatContent = fadedPaths.map(p => `file '${p}'`).join('\n')
  await fs.writeFile(concatListPath, concatContent)

  // Final concat stitch
  const finalPath = path.join(tmpDir, 'final.mp4')
  const ffmpeg = getFfmpegPath()

  console.log(`[stitch] Concatenating ${fadedPaths.length} clips`)
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
 * Upload stitched video to Supabase storage
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

  await fs.rm(path.dirname(videoPath), { recursive: true, force: true })
  return data.publicUrl
}

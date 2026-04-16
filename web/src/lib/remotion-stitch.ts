// Video stitching — simple copy concat (no re-encoding)
// Why no fade/xfade: re-encoding on Vercel is unreliable (binary permissions, /tmp limits)
// -c copy is instant, lossless, and works on any ffmpeg version

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
 * Stitch clips using -c copy (no re-encoding).
 * Fast, reliable, works on any ffmpeg. No fade effects needed at this stage.
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

  // Write concat manifest
  const concatListPath = path.join(tmpDir, 'concat_list.txt')
  const concatContent = clipPaths.map(p => `file '${p}'`).join('\n')
  await fs.writeFile(concatListPath, concatContent)

  const finalPath = path.join(tmpDir, 'final.mp4')
  const ffmpeg = getFfmpegPath()

  console.log(`[stitch] Concatenating ${clipPaths.length} clips with -c copy`)

  // -c copy = no re-encoding, instant, lossless — avoids all codec/filter issues on Vercel
  await execFileAsync(ffmpeg, [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c', 'copy',
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

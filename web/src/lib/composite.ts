// Composite pipeline: generate scene → remove jewellery background → overlay
// Result: pixel-perfect jewellery on an AI-generated template scene.
// The jewellery pixels are NEVER processed by any AI model.

import sharp from 'sharp'
import { supabaseAdmin } from './supabase'

// ─── 1. Remove background from jewellery image ─────────────────────────────
// Uses remove.bg API — industry standard for product images.
// Set REMOVE_BG_API_KEY in your .env.local / Vercel env vars.
// Free tier: 50 images/month. Paid: $0.05-$0.20/image.
// Docs: https://www.remove.bg/api

export async function removeJewelleryBackground(imageUrl: string): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) {
    throw new Error('REMOVE_BG_API_KEY is not set. Required for background removal.')
  }

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'image/png',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      size: 'auto',      // auto-detect best resolution
      type: 'product',   // optimised for product/jewellery images
      format: 'png',     // transparent background
      bg_color: '',      // transparent
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`remove.bg failed: ${res.status} — ${text}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── 2. Download image to buffer ────────────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── 3. Composite jewellery onto scene ──────────────────────────────────────
// Places the transparent jewellery PNG centred onto the generated scene.
// The jewellery is scaled to fit ~60-70% of the scene width for a natural look.

interface CompositeOptions {
  /** Where to position the jewellery: 'center', 'center-lower', 'center-upper' */
  position?: 'center' | 'center-lower' | 'center-upper'
  /** How much of the scene width the jewellery should occupy (0.0 - 1.0) */
  jewellerySizeRatio?: number
}

export async function compositeJewelleryOnScene(
  sceneImageUrl: string,
  jewelleryTransparentPng: Buffer,
  options: CompositeOptions = {},
): Promise<Buffer> {
  const { position = 'center', jewellerySizeRatio = 0.55 } = options

  // Load scene image
  const sceneBuffer = await downloadImage(sceneImageUrl)
  const sceneMeta = await sharp(sceneBuffer).metadata()
  const sceneW = sceneMeta.width ?? 1024
  const sceneH = sceneMeta.height ?? 1024

  // Resize jewellery to fit within the scene proportionally
  const targetJewelleryW = Math.round(sceneW * jewellerySizeRatio)
  const resizedJewellery = await sharp(jewelleryTransparentPng)
    .resize({
      width: targetJewelleryW,
      fit: 'inside',       // maintain aspect ratio
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  const jewelleryMeta = await sharp(resizedJewellery).metadata()
  const jewW = jewelleryMeta.width ?? targetJewelleryW
  const jewH = jewelleryMeta.height ?? targetJewelleryW

  // Calculate position
  let top: number
  let left: number = Math.round((sceneW - jewW) / 2) // always horizontally centred

  switch (position) {
    case 'center-upper':
      top = Math.round(sceneH * 0.15)
      break
    case 'center-lower':
      top = Math.round(sceneH * 0.45)
      break
    case 'center':
    default:
      top = Math.round((sceneH - jewH) / 2)
      break
  }

  // Clamp to bounds
  top = Math.max(0, Math.min(top, sceneH - jewH))
  left = Math.max(0, left)

  // Composite
  const result = await sharp(sceneBuffer)
    .composite([{
      input: resizedJewellery,
      top,
      left,
      blend: 'over',
    }])
    .jpeg({ quality: 92 })
    .toBuffer()

  return result
}

// ─── 4. Upload final composite to Supabase Storage ─────────────────────────

export async function uploadCompositeImage(
  imageBuffer: Buffer,
  userId: string,
): Promise<string> {
  const filename = `photoshoot/${userId}/${Date.now()}_composite.jpg`

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('ornalens-media')
    .upload(filename, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadErr) throw new Error(`Supabase upload failed: ${uploadErr.message}`)

  const { data } = supabaseAdmin.storage
    .from('ornalens-media')
    .getPublicUrl(filename)

  return data.publicUrl
}

// ─── Full pipeline: scene + segmentation + composite + upload ───────────────

export interface PhotoshootCompositeParams {
  jewelleryImageUrl: string
  sceneImageUrl: string  // AI-generated scene from MuAPI
  userId: string
  position?: CompositeOptions['position']
  jewellerySizeRatio?: number
}

export async function runCompositePhotoshoot(
  params: PhotoshootCompositeParams,
): Promise<string> {
  const {
    jewelleryImageUrl,
    sceneImageUrl,
    userId,
    position = 'center',
    jewellerySizeRatio = 0.55,
  } = params

  console.log('[composite] Step 1: Removing jewellery background...')
  const transparentJewellery = await removeJewelleryBackground(jewelleryImageUrl)
  console.log(`[composite] Background removed — ${(transparentJewellery.length / 1024).toFixed(0)}KB transparent PNG`)

  console.log('[composite] Step 2: Compositing onto scene...')
  const compositeBuffer = await compositeJewelleryOnScene(
    sceneImageUrl,
    transparentJewellery,
    { position, jewellerySizeRatio },
  )
  console.log(`[composite] Composite done — ${(compositeBuffer.length / 1024).toFixed(0)}KB JPEG`)

  console.log('[composite] Step 3: Uploading to storage...')
  const publicUrl = await uploadCompositeImage(compositeBuffer, userId)
  console.log(`[composite] Upload done → ${publicUrl}`)

  return publicUrl
}

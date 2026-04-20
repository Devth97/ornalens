// Direct Bearer token verification — bypasses clerkMiddleware dependency.
// Required because Next.js 16 deprecated the middleware file convention,
// meaning clerkMiddleware may not run, causing auth() to always return null.
import { verifyToken } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })
    return payload.sub
  } catch {
    return null
  }
}

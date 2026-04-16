import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// API routes handle their own auth via auth() in each route handler.
// Middleware must still RUN on API routes to set up Clerk's request context,
// but should NOT call auth.protect() on them (which would redirect to sign-in).
const isApiRoute = createRouteMatcher(['/api/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Let API routes pass through — they call auth() themselves and return 401
  if (!isApiRoute(req)) {
    // Only protect non-API page routes
    // (currently there are none, but this is ready for future pages)
  }
})

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

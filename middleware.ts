// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes (everything else is public by default)
// These will be used once dashboard/settings are built in later phases
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

// Webhook and auth routes MUST be public
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/api/generate(.*)',
  '/api/generate-image(.*)',
  '/api/db-health(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Always allow public routes
  if (isPublicRoute(req)) return

  // Protect designated routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

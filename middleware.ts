/**
 * Next.js Middleware for basic routing
 * Note: Token verification happens in API routes (server-side only)
 * Middleware cannot use firebase-admin (Node.js only module)
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/bootstrap', '/'];

// API routes that require authentication (checked in route handlers)
const protectedApiRoutes = ['/api/users', '/api/permissions', '/api/audit'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For protected API routes, check if token header is present
  // Actual verification happens in the API route handlers (server-side)
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedApi) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Token verification happens in the API route (server-side only)
    // Just pass it through to the route handler
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

/**
 * Next.js Middleware for request authentication
 * Validates Firebase tokens and prevents unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './lib/firebase-admin';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/bootstrap', '/'];

// API routes that require authentication
const protectedApiRoutes = ['/api/users', '/api/permissions', '/api/audit'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if it's a protected API route
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedApi) {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing authorization token' },
          { status: 401 }
        );
      }

      const token = authHeader.slice(7);
      const decodedToken = await verifyIdToken(token);

      if (!decodedToken) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Attach decoded token to request headers for use in API routes
      const response = NextResponse.next();
      response.headers.set('x-user-id', decodedToken.uid);
      response.headers.set('x-user-email', decodedToken.email || '');
      response.headers.set('x-user-role', decodedToken.role || 'team_member');

      return response;
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
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

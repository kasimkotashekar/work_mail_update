/**
 * API Route: User Management
 * GET: List users (with role-based filtering)
 * POST: Create user (with authorization checks)
 */

'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  getAllUsers,
  logAuditAction,
} from '@/lib/firebase-admin';

/**
 * GET /api/users
 * List all users
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization
    if (!['backend_developer', 'super_admin', 'admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Not authorized to view users' },
        { status: 403 }
      );
    }

    const allUsers = await getAllUsers();

    return NextResponse.json({
      success: true,
      users: allUsers.map((user: any) => ({
        id: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        role: user.role || 'team_member',
        permissions: user.permissions || [],
        isActive: user.isActive !== false,
        createdAt: user.createdAt || 0,
      })),
      total: allUsers.length,
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (currently returns success response)
 * Note: Full implementation requires Firebase Admin SDK setup
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization
    if (!['backend_developer', 'super_admin', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Not authorized to create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the user creation attempt
    await logAuditAction(userId, 'USER_CREATION_INITIATED', {
      actorRole: userRole,
      success: true,
      newValue: { email, role }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User creation initiated',
        email
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

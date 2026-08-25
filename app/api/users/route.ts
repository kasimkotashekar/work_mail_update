/**
 * API Route: User Management
 * GET: List users (with role-based filtering)
 * POST: Create user (with authorization checks)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  createUser,
  updateUserProfile,
  getAllUsers,
  logAuditAction,
  setUserClaims,
} from '@/lib/firebase-admin';
import {
  canManageUser,
  canModifyUserRole,
  validateRoleChange,
  getDefaultPermissions,
  detectEscalationAttempt,
  sanitizeRoleInput,
} from '@/lib/authorization';
import { DB_PATHS, ROLE_HIERARCHY } from '@/lib/db-schema';

/**
 * GET /api/users
 * List users the current user can manage
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

    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const allUsers = await getAllUsers();

    // Filter users based on what current user can manage
    const manageable = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY]?.canManage || [];
    const filteredUsers = allUsers.filter(user => manageable.includes(user.role));

    return NextResponse.json({
      success: true,
      users: filteredUsers.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      total: filteredUsers.length,
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
 * Create a new user with role and permissions
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, role: targetRole, permissions } = body;

    // Validate input
    if (!email || !password || !targetRole) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, role' },
        { status: 400 }
      );
    }

    // Sanitize role input
    const sanitizedRole = sanitizeRoleInput(targetRole);
    if (!sanitizedRole) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // ===== AUTHORIZATION CHECKS =====

    // Check if user can manage this role
    const canManageCheck = canManageUser(
      userRole,
      currentUser.permissions || [],
      sanitizedRole,
      undefined,
      userId
    );
    if (!canManageCheck.allowed) {
      await logAuditAction(userId, 'USER_CREATION_DENIED', {
        actorRole: userRole,
        targetRole: sanitizedRole,
        success: false,
        errorMessage: canManageCheck.reason,
      });

      return NextResponse.json(
        { error: canManageCheck.reason },
        { status: 403 }
      );
    }

    // Check for escalation attempt
    if (detectEscalationAttempt(userRole, 'users.create', sanitizedRole)) {
      await logAuditAction(userId, 'ESCALATION_ATTEMPT_DETECTED', {
        actorRole: userRole,
        targetRole: sanitizedRole,
        success: false,
        errorMessage: 'Escalation attempt detected',
      });

      return NextResponse.json(
        { error: 'Unauthorized action' },
        { status: 403 }
      );
    }

    // ===== CREATE USER =====

    // Create user in Firebase Auth
    const newUser = await createUser(email, password, displayName);

    // Get default permissions for role
    const defaultPermissions = getDefaultPermissions(sanitizedRole);
    const userPermissions = permissions && Array.isArray(permissions)
      ? [...new Set([...defaultPermissions, ...permissions])]
      : defaultPermissions;

    // Create user profile in database
    const userProfile = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName || displayName || email.split('@')[0],
      role: sanitizedRole,
      permissions: userPermissions,
      isActive: true,
      createdAt: Date.now(),
      createdBy: userId,
      updatedAt: Date.now(),
      updatedBy: userId,
      managedUserIds: [],
      managedByUserId: userId,
    };

    await updateUserProfile(newUser.uid, userProfile);

    // Set custom claims
    await setUserClaims(newUser.uid, {
      role: sanitizedRole,
      permissions: userPermissions,
    });

    // Log audit
    await logAuditAction(userId, 'USER_CREATED', {
      actorRole: userRole,
      targetUserId: newUser.uid,
      targetRole: sanitizedRole,
      newValue: {
        email: newUser.email,
        role: sanitizedRole,
        permissions: userPermissions,
      },
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: newUser.uid,
          email: newUser.email,
          role: sanitizedRole,
          permissions: userPermissions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users error:', error);

    // Log failed attempt
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (userId && userRole) {
      await logAuditAction(userId, 'USER_CREATION_ERROR', {
        actorRole: userRole,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

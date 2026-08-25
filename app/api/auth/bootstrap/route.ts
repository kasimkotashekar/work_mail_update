/**
 * API Route: Bootstrap Super Admin
 * POST: Create the initial Super Admin user
 *
 * SECURITY: This endpoint is ONLY for initializing the first Super Admin
 * It can only be called with the correct BOOTSTRAP_SECRET
 * After first Super Admin is created, this endpoint is disabled
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  createUser,
  updateUserProfile,
  getAllUsers,
  logAuditAction,
  setUserClaims,
  adminDb,
} from '@/lib/firebase-admin';
import { getDefaultPermissions } from '@/lib/authorization';
import { DB_PATHS } from '@/lib/db-schema';

// Check if system is already initialized (has a Super Admin)
async function isSystemInitialized(): Promise<boolean> {
  try {
    const allUsers = await getAllUsers();
    const hasSuperAdmin = allUsers.some(user => user.role === 'super_admin');
    return hasSuperAdmin;
  } catch {
    return true; // Assume initialized on error (fail secure)
  }
}

/**
 * POST /api/auth/bootstrap
 * Create initial Super Admin user
 *
 * Required headers:
 * - X-Bootstrap-Secret: Must match BOOTSTRAP_SECRET env var
 *
 * Body:
 * - email: Super Admin email
 * - password: Super Admin password
 * - displayName: Display name (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // ===== SECURITY CHECK 1: Bootstrap Secret =====
    const bootstrapSecret = request.headers.get('x-bootstrap-secret');
    const validSecret = process.env.BOOTSTRAP_SECRET;

    if (!validSecret) {
      return NextResponse.json(
        { error: 'Bootstrap not configured' },
        { status: 500 }
      );
    }

    if (bootstrapSecret !== validSecret) {
      // Log suspicious activity
      await logAuditAction('SYSTEM', 'BOOTSTRAP_UNAUTHORIZED_ATTEMPT', {
        actorRole: 'unknown',
        success: false,
        errorMessage: 'Invalid bootstrap secret',
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      }).catch(() => {}); // Ignore logging errors

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ===== SECURITY CHECK 2: System Already Initialized =====
    const isInitialized = await isSystemInitialized();
    if (isInitialized) {
      return NextResponse.json(
        { error: 'System already initialized. Cannot create another Super Admin through bootstrap.' },
        { status: 403 }
      );
    }

    // ===== VALIDATE INPUT =====
    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // ===== CREATE SUPER ADMIN =====
    const newUser = await createUser(email, password, displayName);

    const defaultPermissions = getDefaultPermissions('super_admin');

    const userProfile = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName || displayName || email.split('@')[0],
      role: 'super_admin',
      permissions: defaultPermissions,
      isActive: true,
      createdAt: Date.now(),
      createdBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: Date.now(),
      updatedBy: 'SYSTEM_BOOTSTRAP',
      managedUserIds: [],
      metadata: {
        bootstrapUser: true,
        bootstrapTimestamp: Date.now(),
      },
    };

    await updateUserProfile(newUser.uid, userProfile);

    // Set custom claims with full super admin permissions
    await setUserClaims(newUser.uid, {
      role: 'super_admin',
      permissions: defaultPermissions,
      isBootstrapUser: true,
    });

    // Log bootstrap action
    await logAuditAction('SYSTEM_BOOTSTRAP', 'SYSTEM_INITIALIZED', {
      actorRole: 'backend_developer',
      targetUserId: newUser.uid,
      targetRole: 'super_admin',
      newValue: {
        email: newUser.email,
        role: 'super_admin',
        permissions: defaultPermissions,
      },
      success: true,
    }).catch(() => {}); // Ignore logging errors

    // Mark system as initialized in database
    try {
      await adminDb.ref(`${DB_PATHS.roles}/system_initialized`).set({
        initialized: true,
        superAdminUid: newUser.uid,
        superAdminEmail: newUser.email,
        initializedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error marking system as initialized:', error);
      // Don't fail the bootstrap if we can't mark it - the user is already created
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Super Admin created successfully. System initialized.',
        user: {
          uid: newUser.uid,
          email: newUser.email,
          role: 'super_admin',
          permissions: defaultPermissions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bootstrap error:', error);

    // Log the error (without system bootstrap access)
    try {
      await logAuditAction('SYSTEM_BOOTSTRAP', 'BOOTSTRAP_ERROR', {
        actorRole: 'backend_developer',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }).catch(() => {});
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: 'Failed to bootstrap system' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/bootstrap
 * Check if system is initialized
 */
export async function GET(request: NextRequest) {
  try {
    const isInitialized = await isSystemInitialized();

    return NextResponse.json({
      initialized: isInitialized,
      message: isInitialized
        ? 'System already initialized'
        : 'System not initialized. Use POST to bootstrap.',
    });
  } catch (error) {
    console.error('Bootstrap check error:', error);
    return NextResponse.json(
      { error: 'Failed to check system status' },
      { status: 500 }
    );
  }
}

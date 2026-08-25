/**
 * API Route: Individual User Management
 * GET: Get user details
 * PATCH: Update user (role, permissions)
 * DELETE: Disable/delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  updateUserProfile,
  disableUser,
  logAuditAction,
  setUserClaims,
  grantPermissionToUser,
  revokePermissionFromUser,
} from '@/lib/firebase-admin';
import {
  canManageUser,
  canModifyUserRole,
  validateRoleChange,
  canRevokePermission,
  canAssignPermission,
  sanitizeRoleInput,
  isValidPermission,
  detectEscalationAttempt,
} from '@/lib/authorization';

/**
 * GET /api/users/[id]
 * Get specific user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const targetUserId = params.id;

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

    const targetUser = await getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if current user can access this user's details
    const canAccessCheck = canManageUser(
      userRole,
      currentUser.permissions || [],
      targetUser.role,
      targetUserId,
      userId
    );

    if (!canAccessCheck.allowed) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: targetUser.role,
        permissions: targetUser.permissions,
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
        createdBy: targetUser.createdBy,
        managedByUserId: targetUser.managedByUserId,
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user role or permissions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const targetUserId = params.id;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prevent self-modification
    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot modify your own user account this way' },
        { status: 400 }
      );
    }

    const currentUser = await getUserProfile(userId);
    const targetUser = await getUserProfile(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role: newRole, addPermissions, removePermissions } = body;

    // ===== HANDLE ROLE CHANGE =====
    if (newRole) {
      const sanitizedRole = sanitizeRoleInput(newRole);
      if (!sanitizedRole) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      // Check authorization
      const canModifyCheck = canModifyUserRole(
        userRole,
        currentUser.permissions || [],
        targetUser.role,
        sanitizedRole
      );

      if (!canModifyCheck.allowed) {
        await logAuditAction(userId, 'ROLE_CHANGE_DENIED', {
          actorRole: userRole,
          targetUserId,
          targetRole: sanitizedRole,
          previousValue: targetUser.role,
          success: false,
          errorMessage: canModifyCheck.reason,
        });

        return NextResponse.json(
          { error: canModifyCheck.reason },
          { status: 403 }
        );
      }

      // Validate role change (no self-escalation check)
      const validateCheck = validateRoleChange(userRole, userId, targetUserId, sanitizedRole);
      if (!validateCheck.valid) {
        return NextResponse.json(
          { error: validateCheck.reason },
          { status: 400 }
        );
      }

      // Update role
      await updateUserProfile(targetUserId, {
        role: sanitizedRole,
        updatedBy: userId,
      });

      // Update custom claims
      await setUserClaims(targetUserId, {
        role: sanitizedRole,
        permissions: targetUser.permissions,
      });

      // Log
      await logAuditAction(userId, 'ROLE_CHANGED', {
        actorRole: userRole,
        targetUserId,
        previousValue: targetUser.role,
        newValue: sanitizedRole,
        success: true,
      });
    }

    // ===== HANDLE PERMISSION ADDITIONS =====
    if (addPermissions && Array.isArray(addPermissions)) {
      for (const permission of addPermissions) {
        if (!isValidPermission(permission)) {
          return NextResponse.json(
            { error: `Invalid permission format: ${permission}` },
            { status: 400 }
          );
        }

        const canGrantCheck = canAssignPermission(
          userRole,
          currentUser.permissions || [],
          permission,
          targetUser.role
        );

        if (!canGrantCheck.allowed) {
          await logAuditAction(userId, 'PERMISSION_GRANT_DENIED', {
            actorRole: userRole,
            targetUserId,
            targetPermission: permission,
            success: false,
            errorMessage: canGrantCheck.reason,
          });

          return NextResponse.json(
            { error: canGrantCheck.reason },
            { status: 403 }
          );
        }

        await grantPermissionToUser(targetUserId, permission, userId);

        await logAuditAction(userId, 'PERMISSION_GRANTED', {
          actorRole: userRole,
          targetUserId,
          targetPermission: permission,
          success: true,
        });
      }
    }

    // ===== HANDLE PERMISSION REMOVALS =====
    if (removePermissions && Array.isArray(removePermissions)) {
      for (const permission of removePermissions) {
        if (!isValidPermission(permission)) {
          return NextResponse.json(
            { error: `Invalid permission format: ${permission}` },
            { status: 400 }
          );
        }

        const canRevokeCheck = canRevokePermission(
          userRole,
          currentUser.permissions || [],
          permission,
          targetUser.role
        );

        if (!canRevokeCheck.allowed) {
          await logAuditAction(userId, 'PERMISSION_REVOKE_DENIED', {
            actorRole: userRole,
            targetUserId,
            targetPermission: permission,
            success: false,
            errorMessage: canRevokeCheck.reason,
          });

          return NextResponse.json(
            { error: canRevokeCheck.reason },
            { status: 403 }
          );
        }

        await revokePermissionFromUser(targetUserId, permission, userId);

        await logAuditAction(userId, 'PERMISSION_REVOKED', {
          actorRole: userRole,
          targetUserId,
          targetPermission: permission,
          success: true,
        });
      }
    }

    // Return updated user
    const updatedUser = await getUserProfile(targetUserId);

    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser?.uid,
        email: updatedUser?.email,
        role: updatedUser?.role,
        permissions: updatedUser?.permissions,
      },
    });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Disable user account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const targetUserId = params.id;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prevent self-deletion
    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const currentUser = await getUserProfile(userId);
    const targetUser = await getUserProfile(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const canDeleteCheck = canManageUser(
      userRole,
      currentUser.permissions || [],
      targetUser.role,
      targetUserId,
      userId
    );

    if (!canDeleteCheck.allowed) {
      return NextResponse.json(
        { error: canDeleteCheck.reason },
        { status: 403 }
      );
    }

    // Disable user
    await disableUser(targetUserId);

    // Log
    await logAuditAction(userId, 'USER_DISABLED', {
      actorRole: userRole,
      targetUserId,
      targetRole: targetUser.role,
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: 'User account disabled',
    });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, logAuditAction, grantPermissionWithAudit, revokePermissionWithAudit } from '@/lib/firebase-admin';
import { canGrantPermission, canRevokePermission, isValidPermission } from '@/lib/rbac-utils';

/**
 * POST /api/permissions/manage
 * Grant or revoke permissions with full authorization checks
 *
 * Body:
 * {
 *   action: 'grant' | 'revoke',
 *   targetUserId: string,
 *   permission: string,
 *   reason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userPermissionsHeader = request.headers.get('x-user-permissions');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userPermissions = userPermissionsHeader ? JSON.parse(userPermissionsHeader) : [];
    const currentUser = await getUserProfile(userId);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, targetUserId, permission, reason } = body;

    // Validate input
    if (!action || !targetUserId || !permission) {
      return NextResponse.json(
        { error: 'Missing required fields: action, targetUserId, permission' },
        { status: 400 }
      );
    }

    if (!['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "grant" or "revoke"' },
        { status: 400 }
      );
    }

    // Prevent self-modification
    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot modify your own permissions' },
        { status: 400 }
      );
    }

    // Validate permission format
    if (!isValidPermission(permission)) {
      return NextResponse.json(
        { error: `Invalid permission: ${permission}` },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    let result;

    if (action === 'grant') {
      // Check authorization to grant
      const canGrant = canGrantPermission(userRole, userPermissions, permission, targetUser.role);
      if (!canGrant.allowed) {
        // Log the denial
        await logAuditAction(userId, 'PERMISSION_GRANT_DENIED', {
          actorRole: userRole,
          targetUserId,
          targetRole: targetUser.role,
          targetPermission: permission,
          success: false,
          errorMessage: canGrant.reason
        });

        return NextResponse.json(
          { error: canGrant.reason || 'Not authorized to grant this permission' },
          { status: 403 }
        );
      }

      // Grant permission with audit trail
      result = await grantPermissionWithAudit(targetUserId, permission, userId, userRole);
    } else {
      // Check authorization to revoke
      const canRevoke = canRevokePermission(userRole, userPermissions, permission, targetUser.role);
      if (!canRevoke.allowed) {
        // Log the denial
        await logAuditAction(userId, 'PERMISSION_REVOKE_DENIED', {
          actorRole: userRole,
          targetUserId,
          targetRole: targetUser.role,
          targetPermission: permission,
          success: false,
          errorMessage: canRevoke.reason
        });

        return NextResponse.json(
          { error: canRevoke.reason || 'Not authorized to revoke this permission' },
          { status: 403 }
        );
      }

      // Revoke permission with audit trail
      result = await revokePermissionWithAudit(targetUserId, permission, userId, userRole);
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      action,
      targetUserId,
      permission
    });
  } catch (error) {
    console.error('POST /api/permissions/manage error:', error);
    return NextResponse.json(
      { error: 'Failed to manage permissions' },
      { status: 500 }
    );
  }
}

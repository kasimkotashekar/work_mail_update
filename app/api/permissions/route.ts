/**
 * API Route: Permission Management
 * GET: List available permissions
 * POST: Grant permission to user (with authorization checks)
 */

'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  grantPermissionToUser,
  revokePermissionFromUser,
  logAuditAction,
  setUserClaims,
} from '@/lib/firebase-admin';
import {
  canAssignPermission,
  canRevokePermission,
  isValidPermission,
} from '@/lib/authorization';

// Available permissions in the system
const AVAILABLE_PERMISSIONS = [
  {
    id: 'users.create',
    name: 'Create Users',
    category: 'user_management',
    description: 'Ability to create new users',
  },
  {
    id: 'users.read',
    name: 'View Users',
    category: 'user_management',
    description: 'Ability to view user details',
  },
  {
    id: 'users.update',
    name: 'Update Users',
    category: 'user_management',
    description: 'Ability to update user information',
  },
  {
    id: 'users.delete',
    name: 'Delete Users',
    category: 'user_management',
    description: 'Ability to disable/delete users',
  },
  {
    id: 'roles.assign',
    name: 'Assign Roles',
    category: 'role_management',
    description: 'Ability to assign roles to users',
  },
  {
    id: 'permissions.grant',
    name: 'Grant Permissions',
    category: 'permission_management',
    description: 'Ability to grant permissions to users',
  },
  {
    id: 'permissions.revoke',
    name: 'Revoke Permissions',
    category: 'permission_management',
    description: 'Ability to revoke permissions from users',
  },
  {
    id: 'permissions.modify',
    name: 'Modify Permissions',
    category: 'permission_management',
    description: 'Ability to modify permission settings',
  },
  {
    id: 'reports.view',
    name: 'View Reports',
    category: 'reports',
    description: 'Ability to view reports',
  },
  {
    id: 'team.manage',
    name: 'Manage Team',
    category: 'team_management',
    description: 'Ability to manage team members',
  },
  {
    id: 'team.manage_members',
    name: 'Manage Team Members',
    category: 'team_management',
    description: 'Ability to manage specific team members',
  },
  {
    id: 'dashboard.view',
    name: 'View Dashboard',
    category: 'dashboard',
    description: 'Ability to view dashboard',
  },
  {
    id: 'system.audit_logs',
    name: 'View Audit Logs',
    category: 'system',
    description: 'Ability to view system audit logs',
  },
  {
    id: 'system.settings',
    name: 'System Settings',
    category: 'system',
    description: 'Ability to modify system settings',
  },
];

/**
 * GET /api/permissions
 * List all available permissions
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

    return NextResponse.json({
      success: true,
      permissions: AVAILABLE_PERMISSIONS,
      total: AVAILABLE_PERMISSIONS.length,
    });
  } catch (error) {
    console.error('GET /api/permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions
 * Grant/revoke permissions
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

    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId, targetRole, action, permissions } = body;

    if (!targetUserId || !targetRole || !action || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, targetRole, action, permissions' },
        { status: 400 }
      );
    }

    if (!['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "grant" or "revoke"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Validate permissions
    for (const permission of permissions) {
      if (!isValidPermission(permission)) {
        return NextResponse.json(
          { error: `Invalid permission format: ${permission}` },
          { status: 400 }
        );
      }
    }

    // Get target user
    const targetUser = await getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Process each permission
    const results = [];

    for (const permission of permissions) {
      try {
        if (action === 'grant') {
          // Check authorization
          const canGrantCheck = canAssignPermission(
            userRole,
            currentUser.permissions || [],
            permission,
            targetRole
          );

          if (!canGrantCheck.allowed) {
            results.push({
              permission,
              status: 'denied',
              reason: canGrantCheck.reason,
            });

            await logAuditAction(userId, 'PERMISSION_GRANT_DENIED', {
              actorRole: userRole,
              targetUserId,
              targetPermission: permission,
              success: false,
              errorMessage: canGrantCheck.reason,
            });

            continue;
          }

          // Grant permission
          await grantPermissionToUser(targetUserId, permission, userId);

          results.push({
            permission,
            status: 'granted',
          });

          await logAuditAction(userId, 'PERMISSION_GRANTED', {
            actorRole: userRole,
            targetUserId,
            targetPermission: permission,
            success: true,
          });
        } else if (action === 'revoke') {
          // Check authorization
          const canRevokeCheck = canRevokePermission(
            userRole,
            currentUser.permissions || [],
            permission,
            targetRole
          );

          if (!canRevokeCheck.allowed) {
            results.push({
              permission,
              status: 'denied',
              reason: canRevokeCheck.reason,
            });

            await logAuditAction(userId, 'PERMISSION_REVOKE_DENIED', {
              actorRole: userRole,
              targetUserId,
              targetPermission: permission,
              success: false,
              errorMessage: canRevokeCheck.reason,
            });

            continue;
          }

          // Revoke permission
          await revokePermissionFromUser(targetUserId, permission, userId);

          results.push({
            permission,
            status: 'revoked',
          });

          await logAuditAction(userId, 'PERMISSION_REVOKED', {
            actorRole: userRole,
            targetUserId,
            targetPermission: permission,
            success: true,
          });
        }
      } catch (error) {
        results.push({
          permission,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update custom claims
    const updatedUser = await getUserProfile(targetUserId);
    if (updatedUser) {
      await setUserClaims(targetUserId, {
        role: updatedUser.role,
        permissions: updatedUser.permissions,
      }).catch(err => console.error('Error updating claims:', err));
    }

    return NextResponse.json({
      success: true,
      action,
      results,
    });
  } catch (error) {
    console.error('POST /api/permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}

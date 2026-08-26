'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/firebase-admin';
import { canManageRole, getEffectivePermissions as getGrantablePerms, getRoleLevel, getDefaultPermissionsForRole, ALL_PERMISSIONS } from '@/lib/rbac-utils';

/**
 * GET /api/users/{id}/permissions
 * Get a user's permissions (default + granted)
 * Returns: {
 *   effective: string[],      // All permissions (default + granted)
 *   default: string[],         // Role's default permissions
 *   granted: string[],         // Individually granted permissions
 *   available: string[]        // What the current user can grant to this user
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userPermissionsHeader = request.headers.get('x-user-permissions');
    const targetUserId = id;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
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

    // Check if current user can manage target user
    if (!canManageRole(userRole, targetUser.role)) {
      return NextResponse.json(
        { error: 'Not authorized to view this user\'s permissions' },
        { status: 403 }
      );
    }

    // Get permissions
    const defaultPerms = getDefaultPermissionsForRole(targetUser.role);
    const grantedPerms = targetUser.permissions?.filter(p => !defaultPerms.includes(p)) || [];
    const effectivePerms = [...new Set([...defaultPerms, ...grantedPerms])];

    // Get available permissions that current user can grant
    const userPermissions = userPermissionsHeader ? JSON.parse(userPermissionsHeader) : [];
    const grantablePerms = getGrantablePerms(userRole, userPermissions);

    // Filter available permissions to only those appropriate for target role
    const targetRoleLevel = getRoleLevel(targetUser.role);
    const availableForTarget = grantablePerms.filter(perm => {
      // Permission must be appropriate for the target's role level
      const permInfo = ALL_PERMISSIONS[perm as keyof typeof ALL_PERMISSIONS];
      return permInfo !== undefined;
    });

    return NextResponse.json({
      success: true,
      targetUserId,
      targetRole: targetUser.role,
      effective: effectivePerms,
      default: defaultPerms,
      granted: grantedPerms,
      available: availableForTarget,
      permissionDetails: effectivePerms.map(perm => {
        const info = ALL_PERMISSIONS[perm as keyof typeof ALL_PERMISSIONS];
        return {
          permission: perm,
          name: info?.name || perm,
          category: info?.category || 'other',
          isDefault: defaultPerms.includes(perm),
          isGranted: grantedPerms.includes(perm)
        };
      })
    });
  } catch (error) {
    console.error('GET /api/users/[id]/permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

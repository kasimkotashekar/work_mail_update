/**
 * Centralized Authorization Utilities
 * Backend security enforcement for RBAC
 */

import { ROLE_HIERARCHY } from './db-schema';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Get the hierarchy level of a role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]?.level ?? 0;
}

/**
 * Check if currentRole can manage targetRole
 */
export function canManageRole(currentRole: string, targetRole: string): boolean {
  if (!currentRole || !targetRole) return false;
  if (currentRole === targetRole) return false; // Cannot manage same role

  const hierarchy = ROLE_HIERARCHY[currentRole as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) return false;

  return hierarchy.canManage.includes(targetRole);
}

/**
 * Check if a user can manage another user
 */
export function canManageUser(
  currentUserRole: string,
  currentUserPermissions: string[],
  targetUserRole: string,
  targetUserId?: string,
  currentUserId?: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Cannot manage yourself
  if (currentUserId && targetUserId && currentUserId === targetUserId) {
    return {
      allowed: false,
      reason: 'Cannot manage yourself'
    };
  }

  // Cannot manage higher-level users
  if (!canManageRole(currentUserRole, targetUserRole)) {
    return {
      allowed: false,
      reason: `Role ${currentUserRole} cannot manage role ${targetUserRole}`
    };
  }

  // Must have user.update permission
  if (!hasPermission(currentUserPermissions, 'users.update') && !hasPermission(currentUserPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing users.update permission'
    };
  }

  return { allowed: true };
}

/**
 * Check if a user can assign a specific permission
 */
export function canAssignPermission(
  currentUserRole: string,
  currentUserPermissions: string[],
  permissionToAssign: string,
  targetRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Must have permissions.grant permission
  if (!hasPermission(currentUserPermissions, 'permissions.grant') && !hasPermission(currentUserPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing permissions.grant permission'
    };
  }

  // Can only assign permissions appropriate to lower roles
  const hierarchy = ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) {
    return {
      allowed: false,
      reason: 'Invalid role'
    };
  }

  // Cannot assign permissions that the current user doesn't have
  if (!hasPermission(currentUserPermissions, permissionToAssign) && !hasPermission(currentUserPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Cannot assign permission you do not have'
    };
  }

  // Cannot assign to higher-level roles
  if (!hierarchy.canManage.includes(targetRole)) {
    return {
      allowed: false,
      reason: `Cannot assign permissions to role ${targetRole}`
    };
  }

  return { allowed: true };
}

/**
 * Check if a user can revoke a permission
 */
export function canRevokePermission(
  currentUserRole: string,
  currentUserPermissions: string[],
  permissionToRevoke: string,
  targetRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Must have permissions.revoke permission
  if (!hasPermission(currentUserPermissions, 'permissions.revoke') && !hasPermission(currentUserPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing permissions.revoke permission'
    };
  }

  // Follow same rules as assignment
  return canAssignPermission(currentUserRole, currentUserPermissions, permissionToRevoke, targetRole);
}

/**
 * Check if a user can modify another user's role
 */
export function canModifyUserRole(
  currentUserRole: string,
  currentUserPermissions: string[],
  targetUserCurrentRole: string,
  newRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Must have roles.assign permission
  if (!hasPermission(currentUserPermissions, 'roles.assign') && !hasPermission(currentUserPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing roles.assign permission'
    };
  }

  // Cannot promote to higher role
  const hierarchy = ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) {
    return {
      allowed: false,
      reason: 'Invalid role'
    };
  }

  // New role must be manageable by current user
  if (!hierarchy.canManage.includes(newRole)) {
    return {
      allowed: false,
      reason: `Cannot assign role ${newRole}`
    };
  }

  // Current target role must be manageable
  if (!hierarchy.canManage.includes(targetUserCurrentRole)) {
    return {
      allowed: false,
      reason: `Cannot modify users with role ${targetUserCurrentRole}`
    };
  }

  return { allowed: true };
}

/**
 * Validate that a role change is secure (no self-escalation)
 */
export function validateRoleChange(
  currentUserRole: string,
  currentUserId: string,
  targetUserId: string,
  newRole: string
): {
  valid: boolean;
  reason?: string;
} {
  // Prevent self-escalation
  if (currentUserId === targetUserId) {
    const currentLevel = getRoleLevel(currentUserRole);
    const newLevel = getRoleLevel(newRole);

    if (newLevel > currentLevel) {
      return {
        valid: false,
        reason: 'Cannot promote yourself to a higher role'
      };
    }
  }

  return { valid: true };
}

/**
 * Get all roles that a user can manage
 */
export function getManageableRoles(userRole: string): string[] {
  const hierarchy = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  return hierarchy?.canManage ?? [];
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: string): string[] {
  const hierarchy = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
  return hierarchy?.defaultPermissions ?? [];
}

/**
 * Check if attempting an unauthorized escalation
 */
export function detectEscalationAttempt(
  currentUserRole: string,
  attemptedAction: string,
  targetRole?: string
): boolean {
  const hierarchy = ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) return true;

  // Detect attempts to bypass hierarchy
  if (targetRole && !hierarchy.canManage.includes(targetRole)) {
    return true;
  }

  // Detect attempts to access restricted actions
  const restrictedActions = [
    'system.audit_logs',
    'system.settings',
    'backend.bootstrap'
  ];

  if (restrictedActions.includes(attemptedAction)) {
    if (currentUserRole !== 'backend_developer' && currentUserRole !== 'super_admin') {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizeRoleInput(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const validRoles = Object.keys(ROLE_HIERARCHY);
  const trimmedInput = input.trim().toLowerCase();

  return validRoles.includes(trimmedInput) ? trimmedInput : null;
}

/**
 * Validate permission format
 */
export function isValidPermission(permission: string): boolean {
  if (typeof permission !== 'string') return false;
  if (permission === '*') return true; // Wildcard is valid

  // Permission format: category.action
  const parts = permission.split('.');
  return parts.length === 2 && parts.every(p => /^[a-z_]+$/.test(p));
}

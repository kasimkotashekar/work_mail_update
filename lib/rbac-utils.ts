/**
 * Advanced RBAC Utilities
 * Handles hierarchical permission management and validation
 */

import { ROLE_HIERARCHY } from './db-schema';

// Permission categories
export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: 'user_management',
  ROLE_MANAGEMENT: 'role_management',
  PERMISSION_MANAGEMENT: 'permission_management',
  REPORTS: 'reports',
  TEAM_MANAGEMENT: 'team_management',
  DASHBOARD: 'dashboard',
  SYSTEM: 'system'
} as const;

// All available permissions in the system
export const ALL_PERMISSIONS = {
  // User Management
  'users.create': { name: 'Create Users', category: 'user_management' },
  'users.read': { name: 'View Users', category: 'user_management' },
  'users.update': { name: 'Update Users', category: 'user_management' },
  'users.delete': { name: 'Delete Users', category: 'user_management' },

  // Role Management
  'roles.assign': { name: 'Assign Roles', category: 'role_management' },
  'roles.modify': { name: 'Modify Roles', category: 'role_management' },

  // Permission Management
  'permissions.grant': { name: 'Grant Permissions', category: 'permission_management' },
  'permissions.revoke': { name: 'Revoke Permissions', category: 'permission_management' },
  'permissions.modify': { name: 'Modify Permissions', category: 'permission_management' },

  // Reports
  'reports.view': { name: 'View Reports', category: 'reports' },
  'reports.generate': { name: 'Generate Reports', category: 'reports' },

  // Team Management
  'team.manage': { name: 'Manage Team', category: 'team_management' },
  'team.manage_members': { name: 'Manage Team Members', category: 'team_management' },
  'team.assign_tasks': { name: 'Assign Tasks', category: 'team_management' },
  'team.view_tasks': { name: 'View Team Tasks', category: 'team_management' },

  // Dashboard
  'dashboard.view': { name: 'View Dashboard', category: 'dashboard' },
  'dashboard.admin': { name: 'Admin Dashboard', category: 'dashboard' },

  // System
  'system.audit_logs': { name: 'View Audit Logs', category: 'system' },
  'system.settings': { name: 'System Settings', category: 'system' }
} as const;

/**
 * Get role level
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]?.level ?? 0;
}

/**
 * Check if userRole is higher than or equal to targetRole
 */
export function isRoleHigherOrEqual(userRole: string, targetRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  return userLevel >= targetLevel;
}

/**
 * Check if userRole is strictly higher than targetRole
 */
export function isRoleHigher(userRole: string, targetRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  return userLevel > targetLevel;
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(userRole: string, targetRole: string): boolean {
  if (userRole === targetRole) return false;
  const hierarchy = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) return false;
  return hierarchy.canManage.includes(targetRole);
}

/**
 * Get roles that a user can manage
 */
export function getManageableRoles(userRole: string): string[] {
  const hierarchy = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  return hierarchy?.canManage ?? [];
}

/**
 * Check if a permission exists
 */
export function isValidPermission(permission: string): boolean {
  return permission in ALL_PERMISSIONS || permission === '*';
}

/**
 * Get permission info
 */
export function getPermissionInfo(permission: string): {
  name: string;
  category: string;
} | null {
  const info = ALL_PERMISSIONS[permission as keyof typeof ALL_PERMISSIONS];
  return info || null;
}

/**
 * Get all permissions for a category
 */
export function getPermissionsByCategory(
  category: keyof typeof PERMISSION_CATEGORIES
): string[] {
  return Object.entries(ALL_PERMISSIONS)
    .filter(([_, info]) => info.category === category)
    .map(([permission]) => permission);
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(role: string): string[] {
  const hierarchy = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
  return hierarchy?.defaultPermissions ?? [];
}

/**
 * Check if user has permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Get effective permissions (default + granted)
 * In production, this would combine default permissions with individually granted ones
 */
export function getEffectivePermissions(
  role: string,
  grantedPermissions: string[] = []
): string[] {
  const defaultPerms = getDefaultPermissionsForRole(role);
  const combined = new Set([...defaultPerms, ...grantedPermissions]);
  return Array.from(combined);
}

/**
 * Check if user can grant a permission to another user
 */
export function canGrantPermission(
  userRole: string,
  userPermissions: string[],
  permissionToGrant: string,
  targetRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // User must have permissions.grant permission
  if (!hasPermission(userPermissions, 'permissions.grant') && !hasPermission(userPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing permissions.grant permission'
    };
  }

  // Can only grant to lower-level roles
  if (!canManageRole(userRole, targetRole)) {
    return {
      allowed: false,
      reason: `Cannot grant permissions to role ${targetRole} (insufficient authority)`
    };
  }

  // User can only grant permissions they have
  if (!hasPermission(userPermissions, permissionToGrant) && !hasPermission(userPermissions, '*')) {
    return {
      allowed: false,
      reason: `Cannot grant permission you do not have (${permissionToGrant})`
    };
  }

  // Check if permission exists
  if (!isValidPermission(permissionToGrant)) {
    return {
      allowed: false,
      reason: `Invalid permission: ${permissionToGrant}`
    };
  }

  // Permission should not be above user's role level
  const permissionRoleLevel = getMinimumRoleLevelForPermission(permissionToGrant);
  const userRoleLevel = getRoleLevel(userRole);
  if (permissionRoleLevel > userRoleLevel) {
    return {
      allowed: false,
      reason: `Cannot grant permission above your role level`
    };
  }

  return { allowed: true };
}

/**
 * Check if user can revoke a permission
 */
export function canRevokePermission(
  userRole: string,
  userPermissions: string[],
  permissionToRevoke: string,
  targetRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // User must have permissions.revoke permission
  if (!hasPermission(userPermissions, 'permissions.revoke') && !hasPermission(userPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing permissions.revoke permission'
    };
  }

  // Can only revoke from lower-level roles
  if (!canManageRole(userRole, targetRole)) {
    return {
      allowed: false,
      reason: `Cannot revoke permissions from role ${targetRole} (insufficient authority)`
    };
  }

  // Check if permission exists
  if (!isValidPermission(permissionToRevoke)) {
    return {
      allowed: false,
      reason: `Invalid permission: ${permissionToRevoke}`
    };
  }

  return { allowed: true };
}

/**
 * Check if user can modify another user's role
 */
export function canModifyUserRole(
  userRole: string,
  userPermissions: string[],
  targetUserRole: string,
  newRole: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Must have roles.assign permission
  if (!hasPermission(userPermissions, 'roles.assign') && !hasPermission(userPermissions, '*')) {
    return {
      allowed: false,
      reason: 'Missing roles.assign permission'
    };
  }

  // Can only manage lower-level users
  if (!canManageRole(userRole, targetUserRole)) {
    return {
      allowed: false,
      reason: `Cannot modify role for user with role ${targetUserRole} (insufficient authority)`
    };
  }

  // New role must be lower than or equal to current user's level
  if (!isRoleHigherOrEqual(userRole, newRole)) {
    return {
      allowed: false,
      reason: `Cannot assign role higher than your own`
    };
  }

  // New role must still be manageable by user
  if (!canManageRole(userRole, newRole) && newRole !== targetUserRole) {
    return {
      allowed: false,
      reason: `Cannot assign role ${newRole} (outside your authority)`
    };
  }

  return { allowed: true };
}

/**
 * Get minimum role level required for a permission
 * Returns the highest role level that can use this permission
 */
export function getMinimumRoleLevelForPermission(permission: string): number {
  // Full access permission
  if (permission === '*') return 6;

  // Super admin only permissions
  const superAdminOnlyPerms = ['system.settings', 'roles.modify'];
  if (superAdminOnlyPerms.includes(permission)) return 5;

  // Admin+ permissions
  const adminPerms = ['users.delete', 'permissions.modify'];
  if (adminPerms.includes(permission)) return 4;

  // Manager+ permissions
  const managerPerms = ['reports.generate', 'team.manage'];
  if (managerPerms.includes(permission)) return 3;

  // Team Lead+ permissions
  const teamLeadPerms = ['team.assign_tasks', 'team.manage_members'];
  if (teamLeadPerms.includes(permission)) return 2;

  // Available to all
  return 1;
}

/**
 * Get available permissions that a user can grant
 * (permissions they have AND appropriate for lower roles)
 */
export function getGrantablePermissions(
  userRole: string,
  userPermissions: string[]
): string[] {
  const userLevel = getRoleLevel(userRole);

  return Object.keys(ALL_PERMISSIONS).filter((permission) => {
    // Must have this permission
    if (!hasPermission(userPermissions, permission) && !hasPermission(userPermissions, '*')) {
      return false;
    }

    // Permission must not be above user's level
    const permMinLevel = getMinimumRoleLevelForPermission(permission);
    return permMinLevel <= userLevel;
  });
}

/**
 * Validate no self-escalation
 */
export function validateNoSelfEscalation(
  userId: string,
  targetUserId: string,
  currentUserRole: string,
  newRole?: string,
  newPermissions?: string[]
): {
  valid: boolean;
  reason?: string;
} {
  // Cannot modify yourself
  if (userId === targetUserId) {
    return {
      valid: false,
      reason: 'Cannot modify your own role or permissions'
    };
  }

  // If changing role to higher level, that's escalation prevention
  if (newRole) {
    const newLevel = getRoleLevel(newRole);
    const currentLevel = getRoleLevel(currentUserRole);
    if (newLevel > currentLevel) {
      return {
        valid: false,
        reason: 'Cannot escalate user to role higher than your own'
      };
    }
  }

  return { valid: true };
}

/**
 * Get a summary of what a user can do
 */
export function getUserAuthoritySummary(role: string): {
  level: number;
  displayName: string;
  canManage: string[];
  defaultPermissions: string[];
  grantablePermissionCount: number;
} {
  const hierarchy = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
  if (!hierarchy) {
    return {
      level: 0,
      displayName: 'Unknown Role',
      canManage: [],
      defaultPermissions: [],
      grantablePermissionCount: 0
    };
  }

  return {
    level: hierarchy.level,
    displayName: role.replace(/_/g, ' ').toUpperCase(),
    canManage: hierarchy.canManage,
    defaultPermissions: hierarchy.defaultPermissions,
    grantablePermissionCount: hierarchy.defaultPermissions.length
  };
}

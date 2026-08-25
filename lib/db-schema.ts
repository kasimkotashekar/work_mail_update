/**
 * Firebase Database Schema for RBAC System
 * Structure: /users/{uid}/...
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'backend_developer' | 'super_admin' | 'admin' | 'manager' | 'team_lead' | 'team_member';
  permissions: string[]; // Array of permission strings
  managedUserIds: string[]; // Users this user manages
  managedByUserId?: string; // Who created/manages this user
  isActive: boolean;
  createdAt: number; // Timestamp
  createdBy: string; // UID who created
  updatedAt: number;
  updatedBy: string;
  lastLogin?: number;
  metadata?: {
    loginCount?: number;
    lastIP?: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string; // 'user_management', 'role_management', 'reports', etc.
  grantedAt: number;
  grantedBy: string;
  isActive: boolean;
  scope?: {
    // Additional scope restrictions
    limitToRoles?: string[];
    limitToUsers?: string[];
  };
}

export interface AuditLog {
  id: string;
  actorId: string; // Who performed the action
  actorRole: string;
  action: string; // 'USER_CREATED', 'PERMISSION_GRANTED', etc.
  targetUserId?: string;
  targetRole?: string;
  targetPermission?: string;
  previousValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface RoleHierarchy {
  role: string;
  level: number; // Higher number = higher authority
  canManage: string[]; // Which roles can this role manage
  defaultPermissions: string[]; // Default permissions for this role
}

// Firebase DB structure:
export const DB_PATHS = {
  users: 'users', // users/{uid}
  permissions: 'permissions', // permissions/{permissionId}
  auditLogs: 'audit_logs', // audit_logs/{logId}
  roles: 'roles', // roles/{roleId}
  permissionGrants: 'permission_grants', // permission_grants/{grantId}
} as const;

// Role hierarchy configuration (immutable)
export const ROLE_HIERARCHY: Record<string, RoleHierarchy> = {
  backend_developer: {
    role: 'backend_developer',
    level: 6,
    canManage: ['super_admin', 'admin', 'manager', 'team_lead', 'team_member'],
    defaultPermissions: ['*'] // Full access
  },
  super_admin: {
    role: 'super_admin',
    level: 5,
    canManage: ['admin', 'manager', 'team_lead', 'team_member'],
    defaultPermissions: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'roles.assign',
      'permissions.grant',
      'permissions.revoke',
      'permissions.modify',
      'system.audit_logs',
      'system.settings'
    ]
  },
  admin: {
    role: 'admin',
    level: 4,
    canManage: ['manager', 'team_lead', 'team_member'],
    defaultPermissions: [
      'users.create',
      'users.read',
      'users.update',
      'permissions.grant',
      'permissions.revoke',
      'reports.view'
    ]
  },
  manager: {
    role: 'manager',
    level: 3,
    canManage: ['team_lead', 'team_member'],
    defaultPermissions: [
      'users.read',
      'team.manage',
      'reports.view',
      'dashboard.view'
    ]
  },
  team_lead: {
    role: 'team_lead',
    level: 2,
    canManage: ['team_member'],
    defaultPermissions: [
      'users.read',
      'team.manage_members',
      'dashboard.view'
    ]
  },
  team_member: {
    role: 'team_member',
    level: 1,
    canManage: [],
    defaultPermissions: [
      'dashboard.view'
    ]
  }
};

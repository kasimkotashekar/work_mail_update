// Role Hierarchy
export const ROLES = {
  BACKEND_DEVELOPER: 'backend_developer',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  TEAM_MEMBER: 'team_member'
} as const;

// Role Hierarchy Level (higher number = higher authority)
export const ROLE_LEVELS: Record<string, number> = {
  [ROLES.BACKEND_DEVELOPER]: 6,
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.TEAM_LEAD]: 2,
  [ROLES.TEAM_MEMBER]: 1
};

// What each role can manage (lower-level roles)
export const ROLE_MANAGEMENT_MAP: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
  [ROLES.ADMIN]: [ROLES.MANAGER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
  [ROLES.MANAGER]: [ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
  [ROLES.TEAM_LEAD]: [ROLES.TEAM_MEMBER],
  [ROLES.TEAM_MEMBER]: []
};

// Available Permissions
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',

  // User Management
  MANAGE_USERS: 'manage_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  VIEW_USER_DETAILS: 'view_user_details',

  // Role Management
  MANAGE_ROLES: 'manage_roles',
  ASSIGN_ROLE: 'assign_role',

  // Permission Management
  MANAGE_PERMISSIONS: 'manage_permissions',
  GRANT_PERMISSION: 'grant_permission',
  REVOKE_PERMISSION: 'revoke_permission',
  MODIFY_PERMISSION: 'modify_permission',

  // Reports
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',

  // Team Management
  MANAGE_TEAM: 'manage_team',
  ASSIGN_TASKS: 'assign_tasks',
  VIEW_TEAM_TASKS: 'view_team_tasks',

  // System
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_LOGS: 'view_logs',
  VIEW_AUDIT_TRAIL: 'view_audit_trail'
} as const;

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_USER_DETAILS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.ASSIGN_ROLE,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.GRANT_PERMISSION,
    PERMISSIONS.REVOKE_PERMISSION,
    PERMISSIONS.MODIFY_PERMISSION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_TEAM_TASKS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_AUDIT_TRAIL
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_USER_DETAILS,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.GRANT_PERMISSION,
    PERMISSIONS.REVOKE_PERMISSION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_TEAM_TASKS,
    PERMISSIONS.VIEW_AUDIT_TRAIL
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_TEAM_TASKS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_USER_DETAILS
  ],
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_TEAM_TASKS,
    PERMISSIONS.VIEW_USER_DETAILS
  ],
  [ROLES.TEAM_MEMBER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TEAM_TASKS
  ]
};

// Role descriptions and UI display names
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [ROLES.BACKEND_DEVELOPER]: 'Backend Developer',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.TEAM_LEAD]: 'Team Lead',
  [ROLES.TEAM_MEMBER]: 'Team Member'
};

// Role colors for UI
export const ROLE_COLORS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'from-red-600 to-red-400',
  [ROLES.ADMIN]: 'from-orange-600 to-orange-400',
  [ROLES.MANAGER]: 'from-blue-600 to-blue-400',
  [ROLES.TEAM_LEAD]: 'from-purple-600 to-purple-400',
  [ROLES.TEAM_MEMBER]: 'from-green-600 to-green-400',
  [ROLES.BACKEND_DEVELOPER]: 'from-pink-600 to-pink-400'
};

// Helper functions
export function getUserPermissions(role: string): string[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role: string, permission: string): boolean {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
}

export function canManageRole(userRole: string, targetRole: string): boolean {
  const manageable = ROLE_MANAGEMENT_MAP[userRole] || [];
  return manageable.includes(targetRole);
}

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role] || 0;
}

export function getDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || 'from-gray-600 to-gray-400';
}

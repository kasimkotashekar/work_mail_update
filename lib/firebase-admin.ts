/**
 * Firebase Admin SDK utilities for server-side operations
 * Used in Next.js API routes
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { UserProfile, AuditLog, DB_PATHS } from './db-schema';

// Initialize Firebase Admin only on server-side
const firebaseAdminApp = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  : getApps()[0];

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getDatabase(firebaseAdminApp);

/**
 * Get user profile from database
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snapshot = await adminDb.ref(`${DB_PATHS.users}/${uid}`).get();
    return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Create audit log entry
 */
export async function logAuditAction(
  actorId: string,
  action: string,
  details: Partial<AuditLog>
): Promise<void> {
  try {
    const logId = Date.now().toString();
    const auditEntry: AuditLog = {
      id: logId,
      actorId,
      actorRole: details.actorRole || 'unknown',
      action,
      timestamp: Date.now(),
      success: details.success ?? true,
      targetUserId: details.targetUserId,
      targetRole: details.targetRole,
      targetPermission: details.targetPermission,
      previousValue: details.previousValue,
      newValue: details.newValue,
      errorMessage: details.errorMessage,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    };

    await adminDb.ref(`${DB_PATHS.auditLogs}/${logId}`).set(auditEntry);
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw - audit logging should not fail the main operation
  }
}

/**
 * Set custom claims on user (for role/permissions)
 */
export async function setUserClaims(uid: string, claims: Record<string, any>): Promise<void> {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    return await adminAuth.getUserByEmail(email);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, displayName?: string) {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user profile in database
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = adminDb.ref(`${DB_PATHS.users}/${uid}`);
    await userRef.update({
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Disable a user account
 */
export async function disableUser(uid: string): Promise<void> {
  try {
    await adminAuth.updateUser(uid, { disabled: true });
    await updateUserProfile(uid, { isActive: false });
  } catch (error) {
    console.error('Error disabling user:', error);
    throw error;
  }
}

/**
 * Enable a user account
 */
export async function enableUser(uid: string): Promise<void> {
  try {
    await adminAuth.updateUser(uid, { disabled: false });
    await updateUserProfile(uid, { isActive: true });
  } catch (error) {
    console.error('Error enabling user:', error);
    throw error;
  }
}

/**
 * Get all users from database
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await adminDb.ref(DB_PATHS.users).get();
    if (!snapshot.exists()) return [];

    const users = snapshot.val();
    return Object.values(users) as UserProfile[];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

/**
 * Grant permission to user
 */
export async function grantPermissionToUser(
  uid: string,
  permission: string,
  grantedBy: string
): Promise<void> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) throw new Error('User not found');

    const permissions = userProfile.permissions || [];
    if (!permissions.includes(permission)) {
      permissions.push(permission);
    }

    await updateUserProfile(uid, {
      permissions,
      updatedBy: grantedBy,
    });
  } catch (error) {
    console.error('Error granting permission:', error);
    throw error;
  }
}

/**
 * Revoke permission from user
 */
export async function revokePermissionFromUser(
  uid: string,
  permission: string,
  revokedBy: string
): Promise<void> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) throw new Error('User not found');

    const permissions = userProfile.permissions?.filter(p => p !== permission) || [];

    await updateUserProfile(uid, {
      permissions,
      updatedBy: revokedBy,
    });
  } catch (error) {
    console.error('Error revoking permission:', error);
    throw error;
  }
}

/**
 * Verify Firebase ID token on backend
 */
export async function verifyIdToken(token: string) {
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get effective permissions (default + granted)
 */
export async function getEffectivePermissions(uid: string): Promise<string[]> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) return [];

    // Get role's default permissions
    const ROLE_HIERARCHY = {
      backend_developer: { defaultPermissions: ['*'] },
      super_admin: {
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
        defaultPermissions: [
          'users.read',
          'team.manage',
          'reports.view',
          'dashboard.view'
        ]
      },
      team_lead: {
        defaultPermissions: [
          'users.read',
          'team.manage_members',
          'dashboard.view'
        ]
      },
      team_member: {
        defaultPermissions: ['dashboard.view']
      }
    };

    const roleDefaults =
      ROLE_HIERARCHY[userProfile.role as keyof typeof ROLE_HIERARCHY]?.defaultPermissions || [];
    const grantedPermissions = userProfile.permissions || [];

    // Combine and deduplicate
    return [...new Set([...roleDefaults, ...grantedPermissions])];
  } catch (error) {
    console.error('Error getting effective permissions:', error);
    return [];
  }
}

/**
 * Grant permission with full audit trail
 */
export async function grantPermissionWithAudit(
  uid: string,
  permission: string,
  grantedBy: string,
  grantedByRole: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error('Target user not found');
    }

    // Check if already has permission
    if (userProfile.permissions?.includes(permission)) {
      return { success: false, message: 'User already has this permission' };
    }

    // Grant permission
    await grantPermissionToUser(uid, permission, grantedBy);

    // Log audit trail
    await logAuditAction(grantedBy, 'PERMISSION_GRANTED', {
      actorRole: grantedByRole,
      targetUserId: uid,
      targetRole: userProfile.role,
      targetPermission: permission,
      newValue: permission,
      success: true
    });

    // Update custom claims in Firebase Auth
    const effectivePerms = await getEffectivePermissions(uid);
    await setUserClaims(uid, {
      role: userProfile.role,
      permissions: effectivePerms
    });

    return { success: true, message: `Permission granted: ${permission}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log failed attempt
    await logAuditAction(grantedBy, 'PERMISSION_GRANT_FAILED', {
      actorRole: grantedByRole,
      targetUserId: uid,
      targetPermission: permission,
      success: false,
      errorMessage: message
    });

    return { success: false, message };
  }
}

/**
 * Revoke permission with full audit trail
 */
export async function revokePermissionWithAudit(
  uid: string,
  permission: string,
  revokedBy: string,
  revokedByRole: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error('Target user not found');
    }

    // Check if user has permission
    if (!userProfile.permissions?.includes(permission)) {
      return { success: false, message: 'User does not have this permission' };
    }

    // Revoke permission
    await revokePermissionFromUser(uid, permission, revokedBy);

    // Log audit trail
    await logAuditAction(revokedBy, 'PERMISSION_REVOKED', {
      actorRole: revokedByRole,
      targetUserId: uid,
      targetRole: userProfile.role,
      targetPermission: permission,
      previousValue: permission,
      success: true
    });

    // Update custom claims in Firebase Auth
    const effectivePerms = await getEffectivePermissions(uid);
    await setUserClaims(uid, {
      role: userProfile.role,
      permissions: effectivePerms
    });

    return { success: true, message: `Permission revoked: ${permission}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log failed attempt
    await logAuditAction(revokedBy, 'PERMISSION_REVOKE_FAILED', {
      actorRole: revokedByRole,
      targetUserId: uid,
      targetPermission: permission,
      success: false,
      errorMessage: message
    });

    return { success: false, message };
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsForUser(
  targetUserId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  try {
    const snapshot = await adminDb
      .ref(DB_PATHS.auditLogs)
      .orderByChild('targetUserId')
      .equalTo(targetUserId)
      .limitToLast(limit)
      .get();

    if (!snapshot.exists()) return [];
    const logs = snapshot.val();
    return Object.values(logs).reverse() as AuditLog[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get all audit logs
 */
export async function getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    const snapshot = await adminDb
      .ref(DB_PATHS.auditLogs)
      .orderByChild('timestamp')
      .limitToLast(limit)
      .get();

    if (!snapshot.exists()) return [];
    const logs = snapshot.val();
    return Object.values(logs).reverse() as AuditLog[];
  } catch (error) {
    console.error('Error fetching all audit logs:', error);
    return [];
  }
}

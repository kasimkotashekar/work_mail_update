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

'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { hasPermission, PERMISSIONS } from '@/lib/roles';

interface AuthUser extends User {
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user role from custom claims or Firestore
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as string) || 'team_member';

          setUser({
            ...firebaseUser,
            role: typeof role === 'string' ? role : 'team_member'
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkPermission = (permission: string) => {
    if (!user?.role) return false;
    return hasPermission(user.role, permission);
  };

  const canViewDashboard = () => checkPermission(PERMISSIONS.VIEW_DASHBOARD);
  const canManageUsers = () => checkPermission(PERMISSIONS.MANAGE_USERS);
  const canManageTeam = () => checkPermission(PERMISSIONS.MANAGE_TEAM);
  const canViewReports = () => checkPermission(PERMISSIONS.VIEW_REPORTS);
  const canSystemSettings = () => checkPermission(PERMISSIONS.SYSTEM_SETTINGS);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    checkPermission,
    canViewDashboard,
    canManageUsers,
    canManageTeam,
    canViewReports,
    canSystemSettings
  };
}

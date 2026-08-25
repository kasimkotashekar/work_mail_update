/**
 * Client-side authentication utilities
 * These functions use the Firebase client SDK only (no firebase-admin)
 */

import { auth } from '@/lib/firebase';

/**
 * Get current user's ID token
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken(true); // Force refresh
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Get current user's custom claims
 */
export async function getUserClaims() {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const idTokenResult = await user.getIdTokenResult(true); // Force refresh
    return {
      role: idTokenResult.claims.role || 'team_member',
      permissions: idTokenResult.claims.permissions || [],
    };
  } catch (error) {
    console.error('Error getting user claims:', error);
    return null;
  }
}

/**
 * Get authorization headers for API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string> | null> {
  try {
    const token = await getIdToken();
    if (!token) return null;

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return null;
  }
}

/**
 * Make authenticated API call
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  if (!headers) {
    throw new Error('Not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

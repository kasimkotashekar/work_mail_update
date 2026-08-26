'use server';

import { NextRequest, NextResponse } from 'next/server';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '@/lib/rbac-utils';

/**
 * GET /api/permissions/available
 * Get all available permissions in the system
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

    // Get category filter from query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Build permissions list
    let permissions = Object.entries(ALL_PERMISSIONS).map(([id, info]) => ({
      id,
      name: info.name,
      category: info.category
    }));

    // Filter by category if provided
    if (category && Object.values(PERMISSION_CATEGORIES).includes(category as any)) {
      permissions = permissions.filter(p => p.category === category);
    }

    // Group by category
    const grouped = permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      },
      {} as Record<string, typeof permissions>
    );

    return NextResponse.json({
      success: true,
      total: permissions.length,
      permissions,
      byCategory: grouped,
      categories: Object.values(PERMISSION_CATEGORIES)
    });
  } catch (error) {
    console.error('GET /api/permissions/available error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available permissions' },
      { status: 500 }
    );
  }
}

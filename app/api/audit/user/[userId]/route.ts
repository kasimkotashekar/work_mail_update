'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsForUser, getUserProfile } from '@/lib/firebase-admin';
import { canManageRole } from '@/lib/rbac-utils';

/**
 * GET /api/audit/user/{userId}
 * Get audit logs for a specific user
 * Query params:
 * - limit: number of logs to return (default: 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUserId = request.headers.get('x-user-id');
    const currentUserRole = request.headers.get('x-user-role');
    const targetUserId = userId;

    if (!currentUserId || !currentUserRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get target user to check role
    const targetUser = await getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if current user can manage target user
    if (!canManageRole(currentUserRole, targetUser.role)) {
      return NextResponse.json(
        { error: 'Not authorized to view this user\'s audit logs' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    const logs = await getAuditLogsForUser(targetUserId, limit);

    return NextResponse.json({
      success: true,
      targetUserId,
      total: logs.length,
      logs
    });
  } catch (error) {
    console.error('GET /api/audit/user/[userId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

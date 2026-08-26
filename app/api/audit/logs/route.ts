'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAllAuditLogs } from '@/lib/firebase-admin';

/**
 * GET /api/audit/logs
 * Get all audit logs in the system
 * Query params:
 * - limit: number of logs to return (default: 100)
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

    // Check if user has permission to view audit logs
    if (!['backend_developer', 'super_admin', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Not authorized to view audit logs' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const logs = await getAllAuditLogs(limit);

    return NextResponse.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (error) {
    console.error('GET /api/audit/logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

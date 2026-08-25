/**
 * API Route: Audit Logs
 * GET: Retrieve audit logs (with authorization check)
 */

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, adminDb } from '@/lib/firebase-admin';
import { hasPermission } from '@/lib/authorization';
import { DB_PATHS } from '@/lib/db-schema';

/**
 * GET /api/audit
 * Retrieve audit logs (requires system.audit_logs permission)
 *
 * Query parameters:
 * - limit: Number of logs to return (default: 50, max: 500)
 * - targetUserId: Filter by target user
 * - action: Filter by action type
 * - startDate: Filter logs from this timestamp
 * - endDate: Filter logs until this timestamp
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

    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (!hasPermission(currentUser.permissions || [], 'system.audit_logs')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view audit logs' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    let limit = parseInt(url.searchParams.get('limit') || '50');
    const targetUserId = url.searchParams.get('targetUserId');
    const action = url.searchParams.get('action');
    const startDate = url.searchParams.get('startDate')
      ? parseInt(url.searchParams.get('startDate')!)
      : null;
    const endDate = url.searchParams.get('endDate')
      ? parseInt(url.searchParams.get('endDate')!)
      : null;

    // Validate limit
    limit = Math.min(Math.max(1, limit), 500);

    // Fetch audit logs
    const snapshot = await adminDb
      .ref(DB_PATHS.auditLogs)
      .orderByChild('timestamp')
      .limitToLast(1000)
      .get();

    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
        filters: {
          limit,
          targetUserId: targetUserId || null,
          action: action || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
    }

    const allLogs = Object.values(snapshot.val() || {}) as any[];

    // Filter logs
    let filteredLogs = allLogs;

    if (targetUserId) {
      filteredLogs = filteredLogs.filter(log => log.targetUserId === targetUserId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    // Sort by timestamp descending (most recent first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const paginatedLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      total: filteredLogs.length,
      returned: paginatedLogs.length,
      filters: {
        limit,
        targetUserId: targetUserId || null,
        action: action || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error('GET /api/audit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

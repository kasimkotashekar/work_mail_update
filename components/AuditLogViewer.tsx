'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  timestamp: number;
  success: boolean;
  targetUserId?: string;
  targetRole?: string;
  targetPermission?: string;
  previousValue?: string;
  newValue?: string;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogViewerProps {
  filterUserId?: string;
  maxLogs?: number;
}

export default function AuditLogViewer({ filterUserId, maxLogs = 50 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [successFilter, setSuccessFilter] = useState<boolean | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const actions = [
    'PERMISSION_GRANTED',
    'PERMISSION_REVOKED',
    'PERMISSION_GRANT_DENIED',
    'PERMISSION_REVOKE_DENIED',
    'PERMISSION_GRANT_FAILED',
    'PERMISSION_REVOKE_FAILED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'ROLE_ASSIGNED',
    'LOGIN',
    'LOGOUT'
  ];

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const endpoint = filterUserId
          ? `/api/audit/user/${filterUserId}?limit=${maxLogs}`
          : `/api/audit/logs?limit=${maxLogs}`;

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filterUserId, maxLogs]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesSuccess = successFilter === null || log.success === successFilter;
    return matchesAction && matchesSuccess;
  });

  const getActionColor = (action: string): string => {
    if (action.includes('DENIED') || action.includes('FAILED')) {
      return 'bg-red-500/10 text-red-400 border-red-400/30';
    }
    if (action.includes('GRANTED')) {
      return 'bg-green-500/10 text-green-400 border-green-400/30';
    }
    if (action.includes('REVOKED')) {
      return 'bg-orange-500/10 text-orange-400 border-orange-400/30';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-400/30';
  };

  const getStatusIcon = (success: boolean): string => {
    return success ? '✓' : '✗';
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400">Loading audit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-red-400/20 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">Audit Logs</h3>
        <p className="text-gray-400 text-sm">
          {filterUserId ? `Logs for user: ${filterUserId}` : 'All system audit logs'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <div className="space-y-4">
          {/* Action Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Filter by Action</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActionFilter(null)}
                className={`px-3 py-2 rounded-lg transition text-sm ${
                  actionFilter === null
                    ? 'bg-yellow-400 text-black font-semibold'
                    : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                }`}
              >
                All
              </button>
              {actions.map(action => (
                <button
                  key={action}
                  onClick={() => setActionFilter(action)}
                  className={`px-3 py-2 rounded-lg transition text-sm ${
                    actionFilter === action
                      ? 'bg-yellow-400 text-black font-semibold'
                      : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                  }`}
                >
                  {action.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Filter by Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSuccessFilter(null)}
                className={`px-3 py-2 rounded-lg transition text-sm ${
                  successFilter === null
                    ? 'bg-yellow-400 text-black font-semibold'
                    : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSuccessFilter(true)}
                className={`px-3 py-2 rounded-lg transition text-sm ${
                  successFilter === true
                    ? 'bg-green-400 text-black font-semibold'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setSuccessFilter(false)}
                className={`px-3 py-2 rounded-lg transition text-sm ${
                  successFilter === false
                    ? 'bg-red-400 text-black font-semibold'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                Failed
              </button>
            </div>
          </div>

          {/* Results */}
          <p className="text-gray-400 text-xs pt-2">
            Showing {filteredLogs.length} of {logs.length} audit logs
          </p>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No audit logs found</p>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id}>
                {/* Log Item */}
                <div
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className="flex items-center justify-between bg-black/20 rounded-lg p-4 hover:bg-black/30 transition cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          log.success
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {getStatusIcon(log.success)}
                      </span>
                      <span className={`border rounded-lg px-2 py-1 text-xs ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <p className="text-gray-500 text-xs ml-auto">{formatDuration(log.timestamp)}</p>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      Actor: <span className="text-yellow-400">{log.actorId}</span> ({log.actorRole})
                    </p>
                    {log.targetUserId && (
                      <p className="text-gray-400 text-xs">
                        Target: {log.targetUserId} ({log.targetRole})
                      </p>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {expandedLogId === log.id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLogId === log.id && (
                  <div className="bg-black/40 rounded-b-lg p-4 space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span className="text-gray-300">{formatDate(log.timestamp)}</span>
                    </div>
                    {log.targetPermission && (
                      <div className="flex justify-between">
                        <span>Permission:</span>
                        <span className="text-gray-300">{log.targetPermission}</span>
                      </div>
                    )}
                    {log.previousValue && (
                      <div className="flex justify-between">
                        <span>Previous Value:</span>
                        <span className="text-gray-300">{log.previousValue}</span>
                      </div>
                    )}
                    {log.newValue && (
                      <div className="flex justify-between">
                        <span>New Value:</span>
                        <span className="text-gray-300">{log.newValue}</span>
                      </div>
                    )}
                    {log.errorMessage && (
                      <div className="flex justify-between">
                        <span>Error:</span>
                        <span className="text-red-400">{log.errorMessage}</span>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span className="text-gray-300">{log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Logs</p>
          <p className="text-2xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-green-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Successful</p>
          <p className="text-2xl font-bold text-green-400">{logs.filter(l => l.success).length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-red-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{logs.filter(l => !l.success).length}</p>
        </div>
      </div>
    </div>
  );
}

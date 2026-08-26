'use client';

import { useState, useEffect } from 'react';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, getRoleLevel } from '@/lib/rbac-utils';

interface PermissionManagerProps {
  targetUserId: string;
  targetRole: string;
  currentUserRole: string;
  onPermissionChange?: () => void;
}

interface UserPermissions {
  effective: string[];
  default: string[];
  granted: string[];
  available: string[];
  permissionDetails: Array<{
    permission: string;
    name: string;
    category: string;
    isDefault: boolean;
    isGranted: boolean;
  }>;
}

export default function PermissionManager({
  targetUserId,
  targetRole,
  currentUserRole,
  onPermissionChange
}: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${targetUserId}/permissions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        setPermissions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [targetUserId]);

  // Handle grant permission
  const handleGrantPermission = async (permission: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch('/api/permissions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'grant',
          targetUserId,
          permission
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({
          type: 'error',
          message: data.error || 'Failed to grant permission'
        });
        return;
      }

      setActionMessage({
        type: 'success',
        message: data.message || 'Permission granted successfully'
      });

      // Refresh permissions
      if (onPermissionChange) {
        onPermissionChange();
      }

      // Refetch permissions
      const permResponse = await fetch(`/api/users/${targetUserId}/permissions`);
      if (permResponse.ok) {
        const permData = await permResponse.json();
        setPermissions(permData);
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to grant permission'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle revoke permission
  const handleRevokePermission = async (permission: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);

      const response = await fetch('/api/permissions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'revoke',
          targetUserId,
          permission
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({
          type: 'error',
          message: data.error || 'Failed to revoke permission'
        });
        return;
      }

      setActionMessage({
        type: 'success',
        message: data.message || 'Permission revoked successfully'
      });

      // Refresh permissions
      if (onPermissionChange) {
        onPermissionChange();
      }

      // Refetch permissions
      const permResponse = await fetch(`/api/users/${targetUserId}/permissions`);
      if (permResponse.ok) {
        const permData = await permResponse.json();
        setPermissions(permData);
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to revoke permission'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400">Loading permissions...</p>
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

  if (!permissions) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400">No permissions data</p>
      </div>
    );
  }

  // Filter permissions by category if selected
  const filteredPermissions = selectedCategory
    ? permissions.permissionDetails.filter(p => p.category === selectedCategory)
    : permissions.permissionDetails;

  // Group permissions by category
  const groupedPermissions = permissions.permissionDetails.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissions.permissionDetails>
  );

  const categories = Object.keys(groupedPermissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">Permission Manager</h3>
        <p className="text-gray-400 text-sm mb-4">
          User: <span className="text-yellow-400 font-semibold">{targetUserId}</span> | Role: <span className="text-yellow-400 font-semibold">{targetRole}</span>
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Effective Permissions</p>
            <p className="text-2xl font-bold text-white">{permissions.effective.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Default</p>
            <p className="text-2xl font-bold text-yellow-400">{permissions.default.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Granted</p>
            <p className="text-2xl font-bold text-green-400">{permissions.granted.length}</p>
          </div>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div
          className={`border rounded-lg p-4 ${
            actionMessage.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {actionMessage.message}
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-3">Filter by Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-2 rounded-lg transition text-sm ${
              selectedCategory === null
                ? 'bg-yellow-400 text-black font-semibold'
                : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
            }`}
          >
            All ({permissions.effective.length})
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 rounded-lg transition text-sm ${
                selectedCategory === category
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
              }`}
            >
              {category} ({groupedPermissions[category].length})
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-4">
          {selectedCategory ? `${selectedCategory} Permissions` : 'All Permissions'}
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPermissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No permissions in this category</p>
          ) : (
            filteredPermissions.map(perm => (
              <div
                key={perm.permission}
                className="flex items-center justify-between bg-black/20 rounded-lg p-4 hover:bg-black/30 transition"
              >
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{perm.name}</p>
                  <p className="text-gray-500 text-xs">{perm.permission}</p>
                  {perm.isDefault && <p className="text-yellow-400 text-xs mt-1">Default Permission</p>}
                  {perm.isGranted && <p className="text-green-400 text-xs mt-1">Individually Granted</p>}
                </div>
                <div className="flex gap-2">
                  {!perm.isDefault && perm.isGranted && (
                    <button
                      onClick={() => handleRevokePermission(perm.permission)}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                  {!perm.isGranted && permissions.available.includes(perm.permission) && (
                    <button
                      onClick={() => handleGrantPermission(perm.permission)}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition text-sm disabled:opacity-50"
                    >
                      Grant
                    </button>
                  )}
                  {!perm.isGranted && !permissions.available.includes(perm.permission) && (
                    <span className="text-gray-500 text-xs px-3 py-1">Cannot Grant</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

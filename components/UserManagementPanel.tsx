'use client';

import { useState, useEffect } from 'react';
import { getRoleLevel } from '@/lib/rbac-utils';
import PermissionManager from './PermissionManager';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  permissions?: string[];
  createdAt: number;
}

interface UserManagementPanelProps {
  currentUserRole: string;
}

export default function UserManagementPanel({ currentUserRole }: UserManagementPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const roles = ['backend_developer', 'super_admin', 'admin', 'manager', 'team_lead', 'team_member'];

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Check if current user can manage selected user
  const canManageSelected = selectedUser && getRoleLevel(currentUserRole) > getRoleLevel(selectedUser.role);

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      backend_developer: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
      super_admin: 'bg-red-500/20 text-red-400 border-red-400/30',
      admin: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
      manager: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      team_lead: 'bg-green-500/20 text-green-400 border-green-400/30',
      team_member: 'bg-gray-500/20 text-gray-400 border-gray-400/30'
    };
    return roleColors[role] || 'bg-gray-500/20 text-gray-400 border-gray-400/30';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <p className="text-gray-400">Loading users...</p>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedUser && canManageSelected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedUserId(null);
          }}
          className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg hover:bg-yellow-400/20 transition"
        >
          Back to Users
        </button>
        <PermissionManager
          targetUserId={selectedUser.id}
          targetRole={selectedUser.role}
          currentUserRole={currentUserRole}
          onPermissionChange={() => {
            // Refresh users list
            const fetchUsers = async () => {
              try {
                const response = await fetch('/api/users');
                if (response.ok) {
                  const data = await response.json();
                  setUsers(data.users || []);
                }
              } catch (err) {
                console.error('Failed to refresh users:', err);
              }
            };
            fetchUsers();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">User Management</h3>
        <p className="text-gray-400 text-sm">
          Manage users and assign permissions
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Search Users</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-yellow-400/20 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Filter by Role</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter(null)}
                className={`px-3 py-2 rounded-lg transition text-sm ${
                  roleFilter === null
                    ? 'bg-yellow-400 text-black font-semibold'
                    : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                }`}
              >
                All
              </button>
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-2 rounded-lg transition text-sm capitalize ${
                    roleFilter === role
                      ? 'bg-yellow-400 text-black font-semibold'
                      : 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <p className="text-gray-400 text-xs pt-2">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Users Grid */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No users found</p>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-black/20 rounded-lg p-4 hover:bg-black/30 transition"
              >
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{user.displayName || user.email}</p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`border rounded-lg px-2 py-1 text-xs capitalize ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                    {user.isActive && (
                      <span className="border border-green-400/30 bg-green-500/10 text-green-400 rounded-lg px-2 py-1 text-xs">
                        Active
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="border border-red-400/30 bg-red-500/10 text-red-400 rounded-lg px-2 py-1 text-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                  {user.permissions && user.permissions.length > 0 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      +{user.permissions.length} granted permissions
                    </p>
                  )}
                </div>

                {canManageSelected === undefined || getRoleLevel(currentUserRole) > getRoleLevel(user.role) ? (
                  <button
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setViewMode('detail');
                    }}
                    className="px-4 py-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition text-sm font-semibold"
                  >
                    Manage
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm px-4 py-2">Cannot Manage</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-green-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-red-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-400">{users.filter(u => !u.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">With Permissions</p>
          <p className="text-2xl font-bold text-yellow-400">{users.filter(u => (u.permissions?.length || 0) > 0).length}</p>
        </div>
      </div>
    </div>
  );
}

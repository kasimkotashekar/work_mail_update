'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PermissionManager from '@/components/PermissionManager';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export default function PermissionsPage() {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !userRole)) {
      router.push('/login');
    }
  }, [user, userRole, loading, router]);

  // Fetch users
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user]);

  if (loading || !user || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e]">
      <Sidebar user={user} />
      <div className="flex-1 ml-64">
        <Header user={user} userRole={userRole} />
        <main className="p-8 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Permissions</h1>
              <p className="text-gray-400">Manage user permissions and access control</p>
            </div>

            {selectedUser ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg hover:bg-yellow-400/20 transition"
                >
                  Back to Users
                </button>
                <PermissionManager
                  targetUserId={selectedUser.id}
                  targetRole={selectedUser.role}
                  currentUserRole={userRole}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Select a User</h3>
                {loadingUsers ? (
                  <p className="text-gray-400">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-400">No users found</p>
                ) : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="w-full text-left p-4 bg-black/20 rounded-lg hover:bg-black/40 transition border border-yellow-400/10 hover:border-yellow-400/30"
                      >
                        <p className="text-white font-semibold">{u.displayName || u.email}</p>
                        <p className="text-gray-400 text-sm">{u.email}</p>
                        <p className="text-yellow-400 text-xs mt-1 capitalize">{u.role.replace('_', ' ')}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

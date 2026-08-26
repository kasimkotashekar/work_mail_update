'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UserManagementPanel from '@/components/UserManagementPanel';

export default function UsersPage() {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !userRole)) {
      router.push('/login');
    }
  }, [user, userRole, loading, router]);

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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-gray-400">View and manage users, roles, and permissions</p>
              </div>
              {['backend_developer', 'super_admin', 'admin'].includes(userRole) && (
                <button
                  onClick={() => alert('Create user form - coming soon! For now, add users via Firebase Console')}
                  className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition"
                >
                  Create User
                </button>
              )}
            </div>

            <UserManagementPanel currentUserRole={userRole} />
          </div>
        </main>
      </div>
    </div>
  );
}

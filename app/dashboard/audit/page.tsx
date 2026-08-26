'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AuditLogViewer from '@/components/AuditLogViewer';

export default function AuditPage() {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !userRole)) {
      router.push('/login');
    }
  }, [user, userRole, loading, router]);

  // Check if user has permission to view audit logs
  useEffect(() => {
    if (!loading && userRole && !['backend_developer', 'super_admin', 'admin'].includes(userRole)) {
      router.push('/dashboard');
    }
  }, [userRole, loading, router]);

  if (loading || !user || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!['backend_developer', 'super_admin', 'admin'].includes(userRole)) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e]">
        <Sidebar user={user} />
        <div className="flex-1 ml-64">
          <Header user={user} userRole={userRole} />
          <main className="p-8 mt-20">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                You do not have permission to access this page
              </div>
            </div>
          </main>
        </div>
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
              <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
              <p className="text-gray-400">View system audit logs and security events</p>
            </div>

            <AuditLogViewer maxLogs={100} />
          </div>
        </main>
      </div>
    </div>
  );
}

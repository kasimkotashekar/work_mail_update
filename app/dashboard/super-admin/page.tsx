'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import RecentUsers from '@/components/RecentUsers';
import QuickActions from '@/components/QuickActions';
import { ROLES } from '@/lib/roles';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  createdAt?: any;
  metadata?: {
    creationTime: string;
  };
}

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        const role = idTokenResult.claims.role || ROLES.TEAM_MEMBER;

        // Check if user is Super Admin
        if (role !== ROLES.SUPER_ADMIN) {
          router.push('/dashboard');
          return;
        }

        setUser({
          ...currentUser,
          role
        });

        // Fetch users from backend (you'll need to implement this API)
        try {
          const response = await fetch('/api/users');
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
            setStats({
              totalUsers: data.users?.length || 0,
              activeUsers: data.activeUsers || 0,
              adminUsers: data.users?.filter((u: any) =>
                u.role === ROLES.SUPER_ADMIN || u.role === ROLES.ADMIN
              ).length || 0
            });
          }
        } catch (error) {
          console.log('Could not fetch users, using mock data');
          // Mock data for demo
          setUsers([]);
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            adminUsers: 0
          });
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B1A] to-[#0B1026] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B1A] to-[#0B1026]">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <Header user={user} />

        {/* Content */}
        <div className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              subtitle="Updated in real-time"
              icon="users"
              trend={`↑ ${Math.max(0, stats.totalUsers - 1)} new users`}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              subtitle="Users logged in this month"
              icon="check"
              trend={`${Math.round((stats.activeUsers / Math.max(1, stats.totalUsers)) * 100)}% active`}
            />
            <StatCard
              title="Admin Users"
              value={stats.adminUsers}
              subtitle="Management tier users"
              icon="lock"
              trend={`${stats.adminUsers} management roles`}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Users - Takes 2 columns */}
            <div className="lg:col-span-2">
              <RecentUsers users={users} />
            </div>

            {/* Quick Actions - Takes 1 column */}
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_COLORS, hasPermission, PERMISSIONS } from '@/lib/roles';

interface NavItem {
  icon: string;
  label: string;
  id: string;
  permission?: string;
}

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

const getNavItems = (role: string): NavItem[] => [
  { icon: '📧', label: 'Inbox', id: 'inbox', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: '✍️', label: 'Compose', id: 'compose', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: '⭐', label: 'Starred', id: 'starred', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: '📤', label: 'Sent', id: 'sent', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: '📋', label: 'Drafts', id: 'drafts', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: '🗑️', label: 'Trash', id: 'trash', permission: PERMISSIONS.VIEW_DASHBOARD },
  ...(hasPermission(role, PERMISSIONS.MANAGE_TEAM) ? [{ icon: '👥', label: 'Team', id: 'team', permission: PERMISSIONS.MANAGE_TEAM }] : []),
  ...(hasPermission(role, PERMISSIONS.VIEW_REPORTS) ? [{ icon: '📊', label: 'Reports', id: 'reports', permission: PERMISSIONS.VIEW_REPORTS }] : []),
  ...(hasPermission(role, PERMISSIONS.MANAGE_USERS) ? [{ icon: '👤', label: 'Users', id: 'users', permission: PERMISSIONS.MANAGE_USERS }] : []),
  ...(hasPermission(role, PERMISSIONS.SYSTEM_SETTINGS) ? [{ icon: '⚙️', label: 'System', id: 'system', permission: PERMISSIONS.SYSTEM_SETTINGS }] : []),
  { icon: '⚙️', label: 'Settings', id: 'settings', permission: PERMISSIONS.VIEW_DASHBOARD },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('inbox');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
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
        // Get user role from custom claims
        const idTokenResult = await currentUser.getIdTokenResult();
        const role = idTokenResult.claims.role || ROLES.TEAM_MEMBER;

        // Redirect Super Admin to new dashboard
        if (role === ROLES.SUPER_ADMIN) {
          router.push('/dashboard/super-admin');
          return;
        }

        setUser({
          ...currentUser,
          role
        });

        // Set navigation items based on role
        setNavItems(getNavItems(role));
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

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

  const userInitial = user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B1A] to-[#0B1026] flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-black/40 backdrop-blur-md border-r border-yellow-400/10 fixed h-screen overflow-y-auto transition-all duration-300 z-40`}
      >
        {sidebarOpen && (
          <div className="p-6 flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 6l10 8 10-8"></path>
                </svg>
              </div>
              <div className="flex gap-1">
                <span className="font-bold text-white">Work</span>
                <span className="font-bold text-yellow-400">Mail</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeNav === item.id
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-semibold'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                    }`}
                    title={item.label}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* User Profile */}
            <div className="border-t border-yellow-400/10 pt-6">
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${ROLE_COLORS[user?.role] || 'from-yellow-400 to-yellow-300'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{ROLE_DISPLAY_NAMES[user?.role] || user?.role}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition font-semibold text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-md border-b border-yellow-400/10 sticky top-0 z-30">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Work Mail Dashboard</h1>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Welcome back</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-xs font-semibold px-3 py-1 bg-gradient-to-r ${ROLE_COLORS[user?.role] || 'from-gray-600 to-gray-400'} text-white rounded-full`}>
                  {ROLE_DISPLAY_NAMES[user?.role] || user?.role}
                </span>
                <p className="text-white font-semibold">{user?.displayName || user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Unread Emails</p>
                  <p className="text-4xl font-bold text-white">12</p>
                </div>
                <div className="text-4xl">📧</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Sent Today</p>
                  <p className="text-4xl font-bold text-white">5</p>
                </div>
                <div className="text-4xl">✈️</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Storage Used</p>
                  <p className="text-4xl font-bold text-white">2.4 GB</p>
                </div>
                <div className="text-4xl">💾</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Contacts</p>
                  <p className="text-4xl font-bold text-white">48</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inbox */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-300/10 border-b border-yellow-400/20 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Recent Emails</h2>
                </div>

                <div className="divide-y divide-yellow-400/10">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 hover:bg-yellow-400/5 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-white">Sender {i}</p>
                        <p className="text-gray-500 text-sm">2 hours ago</p>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">Email subject line goes here...</p>
                      <p className="text-gray-500 text-xs">This is a preview of the email content that will be displayed...</p>
                    </div>
                  ))}
                </div>

                <div className="bg-black/20 px-6 py-3 text-center">
                  <button className="text-yellow-400 hover:text-yellow-300 transition font-semibold text-sm">
                    View All Emails →
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Compose Button */}
              <button
                onClick={() => setActiveNav('compose')}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black rounded-lg font-bold hover:shadow-lg hover:shadow-yellow-400/50 transition hover:-translate-y-0.5"
              >
                + Compose Email
              </button>

              {/* Folders */}
              <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-300/10 border-b border-yellow-400/20 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Folders</h2>
                </div>

                <div className="divide-y divide-yellow-400/10">
                  {['Inbox (12)', 'Starred (3)', 'Sent (15)', 'Drafts (2)', 'Trash (1)'].map((folder, i) => (
                    <div key={i} className="px-6 py-3 hover:bg-yellow-400/5 transition cursor-pointer flex justify-between items-center">
                      <p className="text-gray-400 hover:text-yellow-400">{folder}</p>
                      <span className="text-yellow-400">›</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="bg-black/40 backdrop-blur-md border border-yellow-400/20 rounded-lg p-6">
                <h2 className="text-lg font-bold text-white mb-4">Storage</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400 text-sm">Used</span>
                      <span className="text-yellow-400 font-semibold">2.4 GB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">6 GB available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
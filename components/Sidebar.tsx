'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/roles';

interface SidebarProps {
  user: any;
}

const navItems = [
  { icon: 'overview', label: 'Overview', id: 'overview', href: '/dashboard' },
  { icon: 'users', label: 'Users', id: 'users', href: '/dashboard/users' },
  { icon: 'roles', label: 'Roles', id: 'roles', href: '/dashboard/roles' },
  { icon: 'permissions', label: 'Permissions', id: 'permissions', href: '/dashboard/permissions' },
  { icon: 'audit', label: 'Audit Logs', id: 'audit', href: '/dashboard/audit' },
  { icon: 'reports', label: 'Reports', id: 'reports', href: '/dashboard/reports' },
  { icon: 'settings', label: 'Settings', id: 'settings', href: '/dashboard/settings' },
];

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const userInitial = user?.email?.[0].toUpperCase() || 'U';

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-r border-yellow-400/10 h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-yellow-400/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M2 6l10 8 10-8"></path>
            </svg>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-white text-lg">Work</span>
            <span className="font-bold text-yellow-400 text-lg">Mail</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.href)
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {item.icon === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 20H15a6 6 0 016-6H3a6 6 0 016 6z" />}
                {item.icon === 'roles' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {item.icon === 'permissions' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                {item.icon === 'audit' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2-5a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {item.icon === 'reports' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                {item.icon === 'settings' && (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </>
                )}
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-yellow-400/10 p-4">
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-r ${ROLE_COLORS[user?.role] || 'from-yellow-400 to-yellow-300'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.displayName || 'Admin User'}
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
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
  );
}

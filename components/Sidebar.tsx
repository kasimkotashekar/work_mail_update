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
  { icon: '📊', label: 'Overview', id: 'overview', href: '/dashboard' },
  { icon: '👥', label: 'Users', id: 'users', href: '/dashboard/users' },
  { icon: '🔐', label: 'Roles', id: 'roles', href: '/dashboard/roles' },
  { icon: '✅', label: 'Permissions', id: 'permissions', href: '/dashboard/permissions' },
  { icon: '📈', label: 'Reports', id: 'reports', href: '/dashboard/reports' },
  { icon: '⚙️', label: 'Settings', id: 'settings', href: '/dashboard/settings' },
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
              <span className="text-xl">{item.icon}</span>
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

'use client';

import { ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/roles';

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  return (
    <div className="bg-black/30 backdrop-blur-md border-b border-yellow-400/10 sticky top-0 z-30">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome, {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <span>You're signed in as</span>
            <span className={`text-xs font-bold px-3 py-1 bg-gradient-to-r ${ROLE_COLORS[user?.role] || 'from-yellow-400 to-yellow-300'} text-white rounded-full`}>
              {ROLE_DISPLAY_NAMES[user?.role] || user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything"
              className="bg-black/40 border border-yellow-400/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/50 transition w-64"
            />
          </div>
          <button className="text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-lg transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

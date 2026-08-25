'use client';

import Link from 'next/link';
import { ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/roles';

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

interface RecentUsersProps {
  users: User[];
}

function formatDate(timestamp: any) {
  if (!timestamp) return 'N/A';

  try {
    let date;

    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const recentUsers = users.slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-300/10 border-b border-yellow-400/20 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Recently Added Users</h2>
      </div>

      <div className="divide-y divide-yellow-400/10">
        {recentUsers.map((user) => {
          const userInitial = user.email?.[0].toUpperCase() || 'U';
          const createdDate = formatDate(user.metadata?.creationTime || user.createdAt);

          return (
            <div key={user.uid} className="p-6 hover:bg-yellow-400/5 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${ROLE_COLORS[user.role] || 'from-gray-600 to-gray-400'} rounded-full flex items-center justify-center text-white font-bold`}>
                    {userInitial}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full">
                    {ROLE_DISPLAY_NAMES[user.role || 'team_member'] || user.role}
                  </span>
                  <p className="text-gray-500 text-xs mt-2">{createdDate}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-black/20 px-6 py-4 text-center">
        <Link href="/dashboard/users" className="text-yellow-400 hover:text-yellow-300 transition font-semibold text-sm">
          View All Members →
        </Link>
      </div>
    </div>
  );
}

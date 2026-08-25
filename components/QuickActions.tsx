'use client';

import Link from 'next/link';

const actions = [
  {
    icon: '➕',
    title: 'Create User',
    description: 'Add a new user to the system',
    href: '/dashboard/users/create',
    bgColor: 'from-purple-600/20 to-purple-400/10'
  },
  {
    icon: '🔐',
    title: 'Manage Roles',
    description: 'Edit roles and permissions',
    href: '/dashboard/roles',
    bgColor: 'from-blue-600/20 to-blue-400/10'
  },
  {
    icon: '✅',
    title: 'Permissions',
    description: 'Configure permissions',
    href: '/dashboard/permissions',
    bgColor: 'from-green-600/20 to-green-400/10'
  },
  {
    icon: '📋',
    title: 'Audit Logs',
    description: 'View system audit trail',
    href: '/dashboard/audit',
    bgColor: 'from-orange-600/20 to-orange-400/10'
  },
];

export default function QuickActions() {
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⚡</span>
        <h2 className="text-xl font-bold text-white">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`bg-gradient-to-br ${action.bgColor} border border-yellow-400/10 hover:border-yellow-400/50 rounded-lg p-4 transition group`}
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition">{action.icon}</div>
            <h3 className="text-white font-semibold mb-1">{action.title}</h3>
            <p className="text-gray-400 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

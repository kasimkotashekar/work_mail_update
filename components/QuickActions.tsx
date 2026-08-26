'use client';

import Link from 'next/link';

const actions = [
  {
    icon: 'plus',
    title: 'Manage Users',
    description: 'Add and manage users in the system',
    href: '/dashboard/users',
    bgColor: 'from-purple-600/20 to-purple-400/10'
  },
  {
    icon: 'lock',
    title: 'Permissions',
    description: 'Grant and revoke permissions',
    href: '/dashboard/permissions',
    bgColor: 'from-blue-600/20 to-blue-400/10'
  },
  {
    icon: 'check',
    title: 'User Permissions',
    description: 'Configure user permissions',
    href: '/dashboard/users',
    bgColor: 'from-green-600/20 to-green-400/10'
  },
  {
    icon: 'clipboard',
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
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-xl font-bold text-white">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const iconColors = ['text-purple-500', 'text-blue-500', 'text-green-500', 'text-orange-500'];
          return (
            <Link
              key={index}
              href={action.href}
              className={`bg-gradient-to-br ${action.bgColor} border border-yellow-400/10 hover:border-yellow-400/50 rounded-lg p-4 transition group`}
            >
              <svg className={`w-8 h-8 mb-3 group-hover:scale-110 transition ${iconColors[index]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {action.icon === 'plus' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />}
                {action.icon === 'lock' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                {action.icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {action.icon === 'clipboard' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2-5a9 9 0 11-18 0 9 9 0 0118 0zM9 3.5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V5.5a2 2 0 00-2-2h-2m0 0V2m0 3.5V2" />}
              </svg>
              <h3 className="text-white font-semibold mb-1">{action.title}</h3>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

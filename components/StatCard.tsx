'use client';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  trend?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-400/20 rounded-xl p-6 hover:border-yellow-400/50 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-4xl font-bold text-white">{value}</p>
          <p className="text-yellow-400 text-xs mt-2">{subtitle}</p>
        </div>
        <div className="bg-yellow-400 rounded-lg p-3 flex items-center justify-center">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 20H15a6 6 0 016-6H3a6 6 0 016 6z" />}
            {icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            {icon === 'lock' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
          </svg>
        </div>
      </div>
      {trend && (
        <div className="text-xs text-gray-500 mt-4">
          {trend}
        </div>
      )}
    </div>
  );
}

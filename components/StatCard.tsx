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
        <div className="text-4xl">{icon}</div>
      </div>
      {trend && (
        <div className="text-xs text-gray-500 mt-4">
          {trend}
        </div>
      )}
    </div>
  );
}

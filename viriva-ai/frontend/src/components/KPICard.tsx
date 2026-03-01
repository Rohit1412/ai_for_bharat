import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  unit?: string;
  changePercent: number;
  status: 'good' | 'warning' | 'critical';
  targetValue?: string;
}

export function KPICard({ title, value, unit, changePercent, status, targetValue }: KPICardProps) {
  const statusColors = {
    good: 'from-[#22c55e]/20 to-[#22c55e]/5 border-[#22c55e]/30',
    warning: 'from-[#f59e0b]/20 to-[#f59e0b]/5 border-[#f59e0b]/30',
    critical: 'from-[#ef4444]/20 to-[#ef4444]/5 border-[#ef4444]/30',
  };

  const statusIndicators = {
    good: 'bg-[#22c55e]',
    warning: 'bg-[#f59e0b]',
    critical: 'bg-[#ef4444]',
  };

  const trendColor = changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';

  return (
    <div className={`bg-gradient-to-br ${statusColors[status]} border rounded-lg p-6 hover:shadow-lg transition-all smooth-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-[#94a3b8] text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">
            {value}
            {unit && <span className="text-lg text-[#cbd5e1] ml-2">{unit}</span>}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusIndicators[status]} pulse-animation`}></div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#22c55e]/10">
        {targetValue && (
          <p className="text-[#94a3b8] text-xs">
            Target: <span className="text-white font-semibold">{targetValue}</span>
          </p>
        )}
        <div className={`flex items-center space-x-1 ${trendColor} font-semibold text-sm`}>
          {changePercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(changePercent).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

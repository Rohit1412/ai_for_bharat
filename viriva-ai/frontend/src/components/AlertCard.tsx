import { AlertTriangle, AlertCircle, Zap } from 'lucide-react';

interface AlertCardProps {
  region: string;
  type: 'methane_spike' | 'water_stress' | 'residue_burning';
  severity: 'high' | 'critical' | 'medium';
  message: string;
  current: number;
  threshold: number;
  unit: string;
  recommendedAction: string;
  onTakeAction?: () => void;
}

export function AlertCard({
  region,
  type,
  severity,
  message,
  current,
  threshold,
  unit,
  recommendedAction,
  onTakeAction,
}: AlertCardProps) {
  const severityConfig = {
    critical: {
      bg: 'from-[#ef4444]/20 to-[#ef4444]/5 border-[#ef4444]/30',
      badge: 'bg-[#ef4444] text-white',
      icon: AlertTriangle,
    },
    high: {
      bg: 'from-[#f59e0b]/20 to-[#f59e0b]/5 border-[#f59e0b]/30',
      badge: 'bg-[#f59e0b] text-[#0f172a]',
      icon: AlertCircle,
    },
    medium: {
      bg: 'from-[#3b82f6]/20 to-[#3b82f6]/5 border-[#3b82f6]/30',
      badge: 'bg-[#3b82f6] text-white',
      icon: Zap,
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-br ${config.bg} border rounded-lg p-4 hover:shadow-lg transition-all smooth-fade-in`}>
      <div className="flex items-start space-x-3 mb-3">
        <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${config.badge}`}>
              {severity.toUpperCase()}
            </span>
            <span className="text-[#94a3b8] text-xs font-medium">{region}</span>
          </div>
          <p className="text-white font-semibold text-sm">{message}</p>
        </div>
      </div>

      {/* Threshold Info */}
      <div className="bg-[#0f172a]/40 rounded-lg p-3 mb-3 space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#94a3b8]">Current Level:</span>
          <span className="text-white font-bold">
            {current.toFixed(1)} {unit}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#94a3b8]">Threshold:</span>
          <span className="text-[#f59e0b] font-bold">
            {threshold.toFixed(1)} {unit}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#1e2937] h-2 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#ef4444] transition-all"
            style={{ width: `${Math.min((current / threshold) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Recommended Action */}
      <p className="text-[#cbd5e1] text-sm mb-4 bg-[#1e2937]/50 rounded-lg p-3">
        <span className="font-semibold text-[#22c55e]">Recommended Action: </span>
        {recommendedAction}
      </p>

      <button
        onClick={onTakeAction}
        className="w-full bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-semibold py-2 rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/50 transition-all"
      >
        View Action Plan
      </button>
    </div>
  );
}

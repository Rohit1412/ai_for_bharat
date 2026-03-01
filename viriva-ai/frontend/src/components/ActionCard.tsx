import { ArrowRight, Leaf, Zap, Droplet, TrendingDown } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  impact: number;
  costRange: string;
  timeline: number;
  equityScore: number;
  priority: number;
  onClick?: () => void;
}

export function ActionCard({
  title,
  description,
  impact,
  costRange,
  timeline,
  equityScore,
  priority,
  onClick,
}: ActionCardProps) {
  const priorityColors = {
    1: 'from-[#22c55e] to-[#86efac]',
    2: 'from-[#3b82f6] to-[#0ea5e9]',
    3: 'from-[#f59e0b] to-[#fbbf24]',
  };

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/20 rounded-lg p-6 hover:border-[#22c55e] cursor-pointer transition-all hover:shadow-lg hover:shadow-[#22c55e]/20 smooth-fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex-1">{title}</h3>
        <div
          className={`bg-gradient-to-r ${
            priorityColors[priority as keyof typeof priorityColors]
          } text-[#0f172a] px-3 py-1 rounded-full text-xs font-semibold`}
        >
          P{priority}
        </div>
      </div>

      {/* Description */}
      <p className="text-[#cbd5e1] text-sm mb-4">{description}</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0f172a]/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingDown size={14} className="text-[#22c55e]" />
            <span className="text-[#94a3b8] text-xs">Carbon Impact</span>
          </div>
          <p className="text-white font-bold text-sm">{impact} tCO₂e</p>
        </div>
        <div className="bg-[#0f172a]/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Zap size={14} className="text-[#3b82f6]" />
            <span className="text-[#94a3b8] text-xs">Cost Range</span>
          </div>
          <p className="text-white font-bold text-sm">{costRange}</p>
        </div>
        <div className="bg-[#0f172a]/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Droplet size={14} className="text-[#0ea5e9]" />
            <span className="text-[#94a3b8] text-xs">Timeline</span>
          </div>
          <p className="text-white font-bold text-sm">{timeline} months</p>
        </div>
        <div className="bg-[#0f172a]/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Leaf size={14} className="text-[#f59e0b]" />
            <span className="text-[#94a3b8] text-xs">Equity Score</span>
          </div>
          <p className="text-white font-bold text-sm">{equityScore}/100</p>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full bg-gradient-to-r from-[#22c55e]/20 to-[#86efac]/20 border border-[#22c55e]/50 text-[#22c55e] py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-gradient-to-r hover:from-[#22c55e]/40 hover:to-[#86efac]/40 transition-all group">
        <span>View Details</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

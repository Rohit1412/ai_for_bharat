import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "info";
  delay?: number;
  lastUpdated?: string;
  source?: string;
}

function getConfidence(lastUpdated?: string): { label: string; color: string } {
  if (!lastUpdated) return { label: "No data", color: "text-muted-foreground" };
  const hoursAgo = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return { label: "High", color: "text-success" };
  if (hoursAgo < 168) return { label: "Medium", color: "text-warning" };
  return { label: "Low", color: "text-destructive" };
}

const MetricCard = ({ title, value, unit, change, changeLabel, icon: Icon, variant = "default", delay = 0, lastUpdated, source }: MetricCardProps) => {
    const isPositive = change > 0;
    const glowClass = variant === "warning" ? "glow-warning" : variant === "info" ? "glow-info" : "glow-primary";
    const iconBgClass = variant === "warning" 
      ? "bg-warning/10 text-warning" 
      : variant === "info" 
      ? "bg-info/10 text-info" 
      : "bg-primary/10 text-primary";

    return (
      <div 
        className={`glass-card rounded-xl p-5 ${glowClass} opacity-0 animate-fade-in-up`}
        style={{ animationDelay: `${delay * 0.1}s` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium font-mono ${
            isPositive ? "text-destructive" : "text-success"
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold font-mono-data tracking-tight text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
        {lastUpdated && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
            <span className={`text-xs ${getConfidence(lastUpdated).color}`}>●  {getConfidence(lastUpdated).label} confidence</span>
            {source && <span className="text-xs text-muted-foreground/60">{source}</span>}
          </div>
        )}
      </div>
    );
};

export default MetricCard;

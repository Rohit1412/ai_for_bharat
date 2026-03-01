import { AlertTriangle, Info, TrendingUp } from "lucide-react";
import { useAlerts } from "@/hooks/useClimateData";
import { useNavigate } from "react-router-dom";

const levelStyles: Record<string, string> = {
  critical: "border-l-destructive bg-destructive/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-info bg-info/5",
};
const iconStyles: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-warning",
  info: "text-info",
};
const levelIcons: Record<string, any> = { critical: TrendingUp, warning: AlertTriangle, info: Info };

const AlertsPanel = () => {
  const { data: alerts, isLoading } = useAlerts(false);
  const navigate = useNavigate();
  const display = alerts?.slice(0, 4) || [];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in-up animate-delay-3">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Early Warnings</h3>
          {display.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
              {display.length} active
            </span>
          )}
        </div>
        <button onClick={() => navigate("/alerts")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {display.map((alert) => {
            const Icon = levelIcons[alert.level] || Info;
            return (
              <div key={alert.id} className={`border-l-2 rounded-r-lg p-3 ${levelStyles[alert.level]} transition-all duration-200 hover:translate-x-1`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles[alert.level]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(alert.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {display.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No active alerts</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;

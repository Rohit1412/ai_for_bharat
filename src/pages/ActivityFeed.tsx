import { Activity, Clock, User, Zap, AlertTriangle, Users, FileText, Shield } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = {
  action_plans: Zap,
  alerts: AlertTriangle,
  stakeholders: Users,
  stakeholder_plans: Users,
  reports: FileText,
  user_roles: Shield,
};

const actionColors: Record<string, string> = {
  create: "bg-success/15 text-success",
  update: "bg-info/15 text-info",
  delete: "bg-destructive/15 text-destructive",
  resolve: "bg-warning/15 text-warning",
  role_change: "bg-primary/15 text-primary",
};

const ActivityFeed = () => {
  const { data: logs } = useAuditLogs(20);
  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const getName = (userId: string) => profiles?.find((p) => p.user_id === userId)?.full_name || "Someone";

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const describe = (log: any) => {
    const name = getName(log.user_id);
    const target = log.new_data?.name || log.old_data?.name || log.table_name;
    switch (log.action) {
      case "create": return `${name} created ${target}`;
      case "update": return `${name} updated ${target}`;
      case "delete": return `${name} deleted ${target}`;
      case "resolve": return `${name} resolved an alert`;
      case "role_change": return `${name} changed a user role`;
      default: return `${name} performed ${log.action} on ${log.table_name}`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" /> Activity Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time team activity across the platform</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        {(!logs || logs.length === 0) ? (
          <p className="text-center text-muted-foreground py-8">No activity yet</p>
        ) : (
          <div className="space-y-0">
            {logs.map((log, i) => {
              const Icon = iconMap[log.table_name] || Activity;
              return (
                <div key={log.id} className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{describe(log)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                        {log.action}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {timeAgo(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

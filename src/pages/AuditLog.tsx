import { FileText, Clock } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLog";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AuditLog = () => {
  const { isAdmin } = useUserRole();
  const { data: logs, isLoading } = useAuditLogs(100);

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const getName = (userId: string) => profiles?.find((p) => p.user_id === userId)?.full_name || "Unknown";

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const actionColors: Record<string, string> = {
    create: "bg-success/15 text-success",
    update: "bg-info/15 text-info",
    delete: "bg-destructive/15 text-destructive",
    resolve: "bg-warning/15 text-warning",
    role_change: "bg-primary/15 text-primary",
  };

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground">Admin access required to view audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track all administrative actions</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left p-4 font-medium">Time</th>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Action</th>
                  <th className="text-left p-4 font-medium">Table</th>
                  <th className="text-left p-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {timeAgo(log.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-foreground text-xs font-medium">{getName(log.user_id)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs font-mono">{log.table_name}</td>
                    <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                      {log.new_data ? JSON.stringify(log.new_data).slice(0, 80) : "—"}
                    </td>
                  </tr>
                ))}
                {(!logs || logs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No audit logs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;

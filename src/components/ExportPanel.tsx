import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Table2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExportType = "actions" | "alerts" | "metrics";

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const exportActions = async () => {
    setExporting("actions");
    const { data, error } = await supabase
      .from("tracked_actions")
      .select("title, owner, sector, status, progress, impact_gt, deadline, assigned_team, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error || !data) {
      toast.error("Failed to export actions.");
      setExporting(null);
      return;
    }
    const csv = toCsv(
      ["title", "owner", "sector", "status", "progress", "impact_gt", "deadline", "assigned_team", "created_at", "updated_at"],
      data.map((d) => ({ ...d, assigned_team: (d.assigned_team || []).join("; ") }))
    );
    downloadFile(csv, `climate-actions-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("Actions exported!");
    setExporting(null);
  };

  const exportAlerts = async () => {
    setExporting("alerts");
    const { data, error } = await supabase
      .from("action_alerts")
      .select("type, severity, message, recommendation, created_at, tracked_actions(title)")
      .order("created_at", { ascending: false });
    if (error || !data) {
      toast.error("Failed to export alerts.");
      setExporting(null);
      return;
    }
    const csv = toCsv(
      ["action_title", "type", "severity", "message", "recommendation", "created_at"],
      data.map((d: any) => ({ action_title: d.tracked_actions?.title || "", type: d.type, severity: d.severity, message: d.message, recommendation: d.recommendation, created_at: d.created_at }))
    );
    downloadFile(csv, `climate-alerts-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("Alerts exported!");
    setExporting(null);
  };

  const exportMetrics = async () => {
    setExporting("metrics");
    const { data, error } = await supabase
      .from("climate_metrics")
      .select("country, metric_type, value, unit, recorded_at, source")
      .order("recorded_at", { ascending: true });
    if (error || !data) {
      toast.error("Failed to export metrics.");
      setExporting(null);
      return;
    }
    const csv = toCsv(
      ["country", "metric_type", "value", "unit", "recorded_at", "source"],
      data
    );
    downloadFile(csv, `climate-metrics-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("Metrics exported!");
    setExporting(null);
  };

  const exports = [
    { id: "actions" as ExportType, label: "ACTION PLANS", desc: "All tracked interventions with progress & status", icon: FileText, fn: exportActions },
    { id: "alerts" as ExportType, label: "ALERT REPORTS", desc: "Generated alerts with recommendations", icon: Table2, fn: exportAlerts },
    { id: "metrics" as ExportType, label: "CLIMATE METRICS", desc: "Historical time-series data", icon: Table2, fn: exportMetrics },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-accent" />
        <h3 className="font-display text-xs tracking-widest text-accent font-bold">EXPORT & REPORTING</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {exports.map((e) => (
          <button
            key={e.id}
            onClick={e.fn}
            disabled={exporting !== null}
            className="glass-panel p-4 text-left hover:border-accent/40 transition-colors group disabled:opacity-40"
          >
            <div className="flex items-center gap-2 mb-2">
              {exporting === e.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <e.icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              )}
              <span className="text-xs font-display tracking-wider text-foreground">{e.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{e.desc}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-accent/60">
              <Download className="w-3 h-3" />
              CSV
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

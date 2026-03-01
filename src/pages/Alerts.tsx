import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, TrendingUp, Brain, Loader2, Shield, X, Link2 } from "lucide-react";
import { useAlerts, useResolveAlert } from "@/hooks/useClimateData";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ExportMenu from "@/components/ExportMenu";
import { supabase } from "@/integrations/supabase/client";

const levelIcons: Record<string, any> = { critical: TrendingUp, warning: AlertTriangle, info: Info };
const levelStyles: Record<string, string> = {
  critical: "border-l-destructive bg-destructive/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-info bg-info/5",
};
const iconStyles: Record<string, string> = { critical: "text-destructive", warning: "text-warning", info: "text-info" };
const badgeStyles: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  warning: "bg-warning/20 text-warning",
  info: "bg-info/20 text-info",
};

const riskColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-success/15", text: "text-success" },
  moderate: { bg: "bg-warning/15", text: "text-warning" },
  high: { bg: "bg-destructive/15", text: "text-destructive" },
  critical: { bg: "bg-destructive/25", text: "text-destructive" },
};

const urgencyStyles: Record<string, string> = {
  immediate: "bg-destructive/20 text-destructive",
  "24h": "bg-warning/20 text-warning",
  this_week: "bg-info/20 text-info",
  monitor: "bg-muted text-muted-foreground",
};

const Alerts = () => {
  const [levelFilter, setLevelFilter] = useState("all");
  const [showResolved, setShowResolved] = useState(false);
  const { data: alerts } = useAlerts();
  const resolveAlert = useResolveAlert();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  // AI Triage state
  const [triageData, setTriageData] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  const displayAlerts = alerts || [];
  const filtered = displayAlerts.filter((a) => {
    if (levelFilter !== "all" && a.level !== levelFilter) return false;
    if (!showResolved && a.resolved) return false;
    return true;
  });

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert.mutateAsync(id);
      toast({ title: "Alert resolved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleTriage = async () => {
    setTriageLoading(true);
    setTriageError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ai-alert-triage", {
        body: {},
      });
      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);
      setTriageData(result);
    } catch (e: any) {
      setTriageError(e.message || "Failed to triage alerts");
    } finally {
      setTriageLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getTriageRec = (alertId: string) => {
    if (!triageData?.priority_ranking) return null;
    return triageData.priority_ranking.find((r: any) => r.alert_id === alertId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" /> Alert Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.filter((a) => !a.resolved).length} active alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={showResolved ? "secondary" : "outline"} size="sm" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? "Hide Resolved" : "Show Resolved"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={handleTriage}
            disabled={triageLoading || filtered.filter(a => !a.resolved).length === 0}
          >
            {triageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {triageLoading ? "Analyzing..." : "AI Triage"}
          </Button>
          {displayAlerts.length > 0 && <ExportMenu data={displayAlerts} filename="alerts" />}
        </div>
      </div>

      {/* AI Triage Error */}
      {triageError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-destructive">{triageError}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTriageError(null)}><X className="w-3 h-3" /></Button>
        </div>
      )}

      {/* AI Triage Results Panel */}
      {triageData && (
        <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">AI Triage Analysis</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[triageData.overall_risk]?.bg || "bg-muted"} ${riskColors[triageData.overall_risk]?.text || "text-muted-foreground"}`}>
                    {triageData.overall_risk?.toUpperCase()} RISK
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Gemini</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{triageData.risk_summary}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setTriageData(null)}><X className="w-3 h-3" /></Button>
          </div>

          {/* Correlation Groups */}
          {triageData.correlation_groups?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Correlated Alert Groups</p>
              <div className="space-y-2">
                {triageData.correlation_groups.map((g: any, i: number) => (
                  <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/50">
                    <p className="text-xs font-medium text-foreground">{g.group_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.pattern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Systemic Risks */}
          {triageData.systemic_risks?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Shield className="w-3 h-3" /> Systemic Risks</p>
              <ul className="space-y-1">
                {triageData.systemic_risks.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-warning mt-0.5">&#x2022;</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((alert) => {
          const Icon = levelIcons[alert.level] || Info;
          const rec = getTriageRec(alert.id);
          return (
            <div key={alert.id} className={`glass-card rounded-xl border-l-4 p-5 ${levelStyles[alert.level]} ${alert.resolved ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyles[alert.level]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[alert.level]}`}>{alert.level}</span>
                        {alert.resolved && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">Resolved</span>}
                        {rec && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">#{rec.priority}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(alert.created_at)}</span>
                  </div>

                  {/* AI Triage Recommendation per alert */}
                  {rec && !alert.resolved && (
                    <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Recommendation</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${urgencyStyles[rec.urgency] || "bg-muted text-muted-foreground"}`}>{rec.urgency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.recommended_action}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">{rec.reasoning}</p>
                    </div>
                  )}

                  {!alert.resolved && isAdmin && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => handleResolve(alert.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;

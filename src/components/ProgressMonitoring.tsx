import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Users,
  TrendingUp, RefreshCw, Loader2, Zap, Target,
  ArrowUpRight, ArrowDownRight, Shield, Link2,
  Bell, BarChart3, Plus, Trash2, Edit2, Save, X,
  MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ActionComments from "@/components/ActionComments";
import TeamAssignment from "@/components/TeamAssignment";

type TrackedAction = Tables<"tracked_actions">;
type ActionAlert = Tables<"action_alerts"> & { tracked_actions?: { title: string } | null };

type SubTab = "dashboard" | "actions" | "alerts" | "add";

export default function ProgressMonitoring() {
  const [tab, setTab] = useState<SubTab>("dashboard");
  const [actions, setActions] = useState<TrackedAction[]>([]);
  const [alerts, setAlerts] = useState<ActionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState("");

  // ── Form state for adding new action ──
  const [form, setForm] = useState({
    title: "", owner: "", sector: "Policy", deadline: "",
    impact_gt: "", description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [actRes, alertRes] = await Promise.all([
      supabase.from("tracked_actions").select("*").order("created_at", { ascending: false }),
      supabase.from("action_alerts").select("*, tracked_actions(title)").order("created_at", { ascending: false }),
    ]);
    if (actRes.data) setActions(actRes.data);
    if (alertRes.data) setAlerts(alertRes.data as ActionAlert[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase
      .channel("progress-monitoring")
      .on("postgres_changes", { event: "*", schema: "public", table: "tracked_actions" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "action_alerts" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ── Add action ──
  const handleAdd = async () => {
    if (!form.title.trim() || !form.owner.trim() || !form.deadline) {
      toast.error("Title, Owner, and Deadline are required.");
      return;
    }
    setSubmitting(true);
    const insert: TablesInsert<"tracked_actions"> = {
      title: form.title.trim(),
      owner: form.owner.trim(),
      sector: form.sector,
      deadline: form.deadline,
      impact_gt: parseFloat(form.impact_gt) || 0,
      description: form.description.trim() || null,
    };
    const { error } = await supabase.from("tracked_actions").insert(insert);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Action added successfully!");
      setForm({ title: "", owner: "", sector: "Policy", deadline: "", impact_gt: "", description: "" });
      setTab("actions");
    }
    setSubmitting(false);
  };

  // ── Update progress/status ──
  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("tracked_actions")
      .update({ progress: editProgress, status: editStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Action updated!");
    setEditingId(null);
  };

  // ── Delete action ──
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tracked_actions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Action deleted.");
  };

  // ── AI corrective recommendation ──
  const getCorrectiveRecommendation = async (action: TrackedAction) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiRecommendation("");
    try {
      const prompt = `The climate intervention "${action.title}" owned by ${action.owner} in sector ${action.sector} is ${action.status.toLowerCase()} with ${action.progress}% progress and a deadline of ${action.deadline}. It targets ${action.impact_gt} GtCO₂e reduction. Generate 3-4 specific corrective recommendations to get this back on track. Be concise and actionable.`;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/climate-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setAiRecommendation(accumulated);
            }
          } catch {}
        }

        if (done) break;
      }

      if (!accumulated) setAiRecommendation("No recommendation generated.");
    } catch (err) {
      console.error("AI recommendation error:", err);
      setAiRecommendation("Failed to generate AI recommendation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Add alert for an action ──
  const generateAlert = async (action: TrackedAction) => {
    const alertInsert: TablesInsert<"action_alerts"> = {
      action_id: action.id,
      type: action.status === "Behind" ? "delay" : "delay",
      severity: action.status === "Behind" ? "critical" : "warning",
      message: `${action.title} is ${action.status.toLowerCase()} at ${action.progress}% progress.`,
      recommendation: `Review milestones for ${action.title} and allocate additional resources.`,
    };
    const { error } = await supabase.from("action_alerts").insert(alertInsert);
    if (error) toast.error(error.message);
    else toast.success("Alert generated.");
  };

  // ── Auto-scan: call edge function to run DB alert generation ──
  const [scanning, setScanning] = useState(false);
  const runAlertScan = async () => {
    setScanning(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-alerts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Scan failed");
      const count = data.result?.alerts_generated ?? 0;
      if (count > 0) {
        toast.success(`${count} new alert(s) generated!`);
        fetchData();
      } else {
        toast.info("No new alerts detected. All actions are within thresholds.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run alert scan.");
    } finally {
      setScanning(false);
    }
  };

  // ── Computed stats ──
  const totalActions = actions.length;
  const onTrack = actions.filter((a) => a.status === "On Track").length;
  const atRisk = actions.filter((a) => a.status === "At Risk").length;
  const behind = actions.filter((a) => a.status === "Behind").length;
  const completed = actions.filter((a) => a.status === "Completed").length;
  const totalImpact = actions.reduce((s, a) => s + Number(a.impact_gt), 0);

  const statusColor = (s: string) => {
    if (s === "Completed") return "text-primary";
    if (s === "On Track") return "text-accent";
    if (s === "At Risk") return "text-glow-warning";
    return "text-glow-danger";
  };

  const statusIcon = (s: string) => {
    if (s === "Completed") return <CheckCircle2 className="w-4 h-4 text-primary" />;
    if (s === "On Track") return <TrendingUp className="w-4 h-4 text-accent" />;
    if (s === "At Risk") return <Clock className="w-4 h-4 text-glow-warning" />;
    return <AlertTriangle className="w-4 h-4 text-glow-danger" />;
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "border-glow-danger/40 bg-glow-danger/5";
    if (s === "warning") return "border-glow-warning/40 bg-glow-warning/5";
    if (s === "info") return "border-primary/40 bg-primary/5";
    return "border-accent/40 bg-accent/5";
  };

  const progressBar = (val: number, large?: boolean) => (
    <div className={`w-full ${large ? "h-3" : "h-2"} bg-muted/40 rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${val}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${
          val >= 80 ? "bg-primary" : val >= 50 ? "bg-accent" : val >= 30 ? "bg-glow-warning" : "bg-glow-danger"
        }`}
      />
    </div>
  );

  const criticalAlerts = alerts.filter((a) => a.severity === "critical" || a.severity === "warning");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading actions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-display text-sm tracking-widest text-primary font-bold">PROGRESS MONITORING & COORDINATION</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/30">
        {([
          { id: "dashboard" as SubTab, label: "DASHBOARD", icon: BarChart3 },
          { id: "actions" as SubTab, label: `ACTIONS (${totalActions})`, icon: Target },
          { id: "alerts" as SubTab, label: `ALERTS (${criticalAlerts.length})`, icon: Bell },
          { id: "add" as SubTab, label: "ADD ACTION", icon: Plus },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-display tracking-wider transition-colors ${
              tab === t.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === "dashboard" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {totalActions === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No actions tracked yet.</p>
              <button onClick={() => setTab("add")} className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20 transition-colors">
                Add Your First Action
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Actions", value: totalActions, icon: Target, color: "text-foreground" },
                  { label: "On Track", value: onTrack, icon: CheckCircle2, color: "text-accent" },
                  { label: "At Risk", value: atRisk, icon: Clock, color: "text-glow-warning" },
                  { label: "Behind Schedule", value: behind, icon: AlertTriangle, color: "text-glow-danger" },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 text-center">
                    <kpi.icon className={`w-5 h-5 mx-auto mb-1.5 ${kpi.color}`} />
                    <div className={`text-2xl font-display font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="glass-panel p-4">
                  <div className="text-xs font-display tracking-wider text-muted-foreground mb-2">TOTAL PROJECTED IMPACT</div>
                  <div className="text-3xl font-display font-bold text-primary">{totalImpact.toFixed(1)} GtCO₂e</div>
                  <div className="text-xs text-muted-foreground mt-1">Combined reduction from all active interventions</div>
                </div>
                <div className="glass-panel p-4">
                  <div className="text-xs font-display tracking-wider text-muted-foreground mb-2">COMPLETION RATE</div>
                  <div className="text-3xl font-display font-bold text-accent">
                    {totalActions > 0 ? ((completed / totalActions) * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{completed} of {totalActions} actions completed</div>
                  {progressBar(totalActions > 0 ? (completed / totalActions) * 100 : 0, true)}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="glass-panel p-4">
                <div className="text-xs font-display tracking-wider text-muted-foreground mb-3">ACTION STATUS BREAKDOWN</div>
                <div className="space-y-2">
                  {[
                    { label: "Completed", count: completed, color: "bg-primary" },
                    { label: "On Track", count: onTrack, color: "bg-accent" },
                    { label: "At Risk", count: atRisk, color: "bg-glow-warning" },
                    { label: "Behind", count: behind, color: "bg-glow-danger" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">{row.label}</span>
                      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: totalActions > 0 ? `${(row.count / totalActions) * 100}%` : "0%" }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${row.color}`}
                        />
                      </div>
                      <span className="text-xs font-mono text-foreground w-8 text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── TRACKED ACTIONS TAB ── */}
      {tab === "actions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {actions.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No actions yet. Add one to get started.</p>
              <button onClick={() => setTab("add")} className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20">
                Add Action
              </button>
            </div>
          ) : (
            actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {statusIcon(action.status)}
                      <span className="text-sm font-semibold text-foreground">{action.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{action.owner}</span>
                      <span className="px-1.5 py-0.5 rounded bg-muted/30 text-[10px]">{action.sector}</span>
                    </div>
                    {action.description && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{action.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-display tracking-wider ${statusColor(action.status)}`}>
                      {action.status.toUpperCase()}
                    </span>
                    <button onClick={() => { setEditingId(action.id); setEditProgress(action.progress); setEditStatus(action.status); }} className="p-1 hover:bg-muted/30 rounded transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(action.id)} className="p-1 hover:bg-destructive/20 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Inline edit */}
                {editingId === action.id && (
                  <div className="bg-muted/20 rounded p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground w-16">Progress</label>
                      <input
                        type="range" min={0} max={100} value={editProgress}
                        onChange={(e) => setEditProgress(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-foreground w-10 text-right">{editProgress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground w-16">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="flex-1 bg-background border border-border/50 rounded px-2 py-1 text-xs text-foreground"
                      >
                        {["On Track", "At Risk", "Behind", "Completed"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                      <button onClick={() => handleUpdate(action.id)} className="px-3 py-1 text-xs text-primary bg-primary/10 rounded hover:bg-primary/20"><Save className="w-3 h-3 inline mr-1" />Save</button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {progressBar(action.progress)}
                  <span className="text-xs font-mono text-foreground w-10 text-right">{action.progress}%</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/20 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="float-right font-semibold text-foreground">{new Date(action.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="bg-muted/20 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground">Impact</span>
                    <span className="float-right font-semibold text-primary">{action.impact_gt} Gt</span>
                  </div>
                  <div className="bg-muted/20 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="float-right font-semibold text-foreground">{new Date(action.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* AI + Alert + Expand buttons */}
                <div className="flex gap-2">
                  {(action.status === "Behind" || action.status === "At Risk") && (
                    <>
                      <button
                        onClick={() => getCorrectiveRecommendation(action)}
                        disabled={aiLoading}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-glow-warning/10 border border-glow-warning/30 text-xs font-display tracking-wider text-glow-warning hover:bg-glow-warning/20 transition-colors disabled:opacity-40"
                      >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        AI RECOMMENDATION
                      </button>
                      <button
                        onClick={() => generateAlert(action)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded bg-glow-danger/10 border border-glow-danger/30 text-xs text-glow-danger hover:bg-glow-danger/20 transition-colors"
                      >
                        <Bell className="w-3 h-3" />
                        ALERT
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-accent/10 border border-accent/30 text-xs text-accent hover:bg-accent/20 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {expandedId === action.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Collaboration panel */}
                <AnimatePresence>
                  {expandedId === action.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 border-t border-border/30"
                    >
                      <TeamAssignment
                        actionId={action.id}
                        currentTeam={(action as any).assigned_team || []}
                        onUpdate={fetchData}
                      />
                      <ActionComments actionId={action.id} actionTitle={action.title} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}

          {/* AI Recommendation panel */}
          <AnimatePresence>
            {(aiRecommendation !== null) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-panel p-4 border-accent/30 glow-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-sm font-display tracking-wider text-accent font-bold">AI CORRECTIVE RECOMMENDATION</span>
                  {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />}
                  <button onClick={() => setAiRecommendation(null)} className="ml-auto text-muted-foreground hover:text-foreground text-xs">✕</button>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{aiRecommendation || (aiLoading ? "Generating recommendations..." : "")}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── ALERTS TAB ── */}
      {tab === "alerts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Scan button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Automated alerts for overdue deadlines, stalled progress, risk flags, and synergies.</p>
            <button
              onClick={runAlertScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-xs font-display tracking-wider text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              SCAN FOR ALERTS
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">No alerts yet.</p>
              <p className="text-xs text-muted-foreground/60">Click "Scan for Alerts" to check for overdue deadlines, stalled actions, and synergies.</p>
            </div>
          ) : (
            alerts.map((alert, i) => {
              const typeIcon = alert.type === "delay"
                ? <Clock className="w-4 h-4 text-glow-danger" />
                : alert.type === "conflict"
                ? <AlertTriangle className="w-4 h-4 text-glow-warning" />
                : alert.type === "synergy"
                ? <Link2 className="w-4 h-4 text-primary" />
                : <CheckCircle2 className="w-4 h-4 text-accent" />;

              const typeBadgeClass = alert.type === "delay"
                ? "bg-glow-danger/20 text-glow-danger"
                : alert.type === "conflict"
                ? "bg-glow-warning/20 text-glow-warning"
                : alert.type === "synergy"
                ? "bg-primary/20 text-primary"
                : "bg-accent/20 text-accent";

              const typeLabel = alert.type.toUpperCase();

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-panel p-4 space-y-2 border ${severityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcon}
                      <div>
                        <span className="text-sm font-semibold text-foreground">{alert.tracked_actions?.title || "Action"}</span>
                        <span className={`ml-2 text-[10px] font-display tracking-wider px-1.5 py-0.5 rounded ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                  {alert.recommendation && (
                    <div className="bg-muted/20 rounded p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-display tracking-wider text-accent">RECOMMENDATION</span>
                      </div>
                      <p className="text-xs text-foreground/80">{alert.recommendation}</p>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* ── ADD ACTION TAB ── */}
      {tab === "add" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-sm font-display tracking-wider text-foreground font-bold">REGISTER NEW CLIMATE ACTION</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-display tracking-wider text-muted-foreground">ACTION TITLE *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. EU Carbon Border Adjustment"
                  className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-display tracking-wider text-muted-foreground">OWNER / ORGANIZATION *</label>
                <input
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="e.g. European Commission"
                  className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-display tracking-wider text-muted-foreground">SECTOR *</label>
                <select
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="Policy">Policy</option>
                  <option value="Technology">Technology</option>
                  <option value="Conservation">Conservation</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-display tracking-wider text-muted-foreground">DEADLINE *</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-display tracking-wider text-muted-foreground">IMPACT (GtCO₂e)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.impact_gt}
                  onChange={(e) => setForm((f) => ({ ...f, impact_gt: e.target.value }))}
                  placeholder="e.g. 0.8"
                  className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-display tracking-wider text-muted-foreground">DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the intervention..."
                rows={3}
                className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 p-3 rounded bg-primary/10 border border-primary/30 text-sm font-display tracking-wider text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              REGISTER ACTION
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

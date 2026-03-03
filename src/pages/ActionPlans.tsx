import React, { useState, useEffect, useRef } from "react";
import { Zap, Plus, Trash2, Edit2, Brain, Loader2, Sparkles, CheckCircle2, Target, Clock, ArrowUpDown } from "lucide-react";
import { useActionPlans, useCreateActionPlan, useUpdateActionPlan, useDeleteActionPlan } from "@/hooks/useClimateData";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ExportMenu from "@/components/ExportMenu";
import StakeholderPlanLinker from "@/components/StakeholderPlanLinker";
import PlanComments from "@/components/PlanComments";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { ChevronDown, ChevronRight } from "lucide-react";
import { aiGeneratePlanFromGoal, aiRankActionPlans } from "@/lib/aiService";

const statusStyles: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  review: "bg-warning/15 text-warning",
  draft: "bg-muted text-muted-foreground",
  completed: "bg-success/15 text-success",
};

const feasibilityColors: Record<string, string> = {
  high: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  low: "bg-destructive/15 text-destructive",
};

const urgencyColors: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border border-destructive/30",
  high: "bg-warning/15 text-warning border border-warning/30",
  medium: "bg-primary/15 text-primary border border-primary/30",
  low: "bg-muted text-muted-foreground border border-border",
};

const ActionPlans = () => {
  const { data: plans } = useActionPlans();
  const { isAdmin } = useUserRole();
  const createPlan = useCreateActionPlan();
  const updatePlan = useUpdateActionPlan();
  const deletePlan = useDeleteActionPlan();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sector: "", impact: "", description: "", status: "draft" as "active" | "review" | "draft" | "completed", deadline: "", economic_cost: "", feasibility_score: "" as "" | "high" | "medium" | "low", technical_readiness: "" as "" | "ready" | "prototype" | "research" });
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // AI Generate Plan state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Ranking state
  const [aiRanking, setAiRanking] = useState<{
    loading: boolean;
    summary: string | null;
    rankings: Record<string, { rank: number; urgency: string; reason: string }>;
    rankedIds: string[];
  }>({ loading: false, summary: null, rankings: {}, rankedIds: [] });
  const rankedForRef = useRef<string>("");

  const displayPlans = plans || [];

  // Auto-rank plans when data first loads
  useEffect(() => {
    if (!displayPlans.length) return;
    const key = displayPlans.map((p) => p.id).join(",");
    if (key === rankedForRef.current) return; // already ranked this set
    rankedForRef.current = key;

    setAiRanking((s) => ({ ...s, loading: true }));
    aiRankActionPlans(
      displayPlans.map((p) => ({
        id: p.id,
        name: p.name,
        sector: p.sector,
        status: p.status,
        impact: p.impact,
        deadline: p.deadline,
        feasibility_score: p.feasibility_score,
        progress: p.progress,
      }))
    )
      .then((res) => {
        const map: Record<string, { rank: number; urgency: string; reason: string }> = {};
        (res.rankings as any[])?.forEach((r) => {
          map[r.id] = { rank: r.rank, urgency: r.urgency, reason: r.reason };
        });
        setAiRanking({
          loading: false,
          summary: res.summary as string,
          rankings: map,
          rankedIds: (res.ranked_ids as string[]) || [],
        });
      })
      .catch(() => setAiRanking((s) => ({ ...s, loading: false })));
  }, [displayPlans.length]);

  // Sort plans by AI rank if available, else by original order
  const sortedPlans = aiRanking.rankedIds.length
    ? [...displayPlans].sort((a, b) => {
        const ra = aiRanking.rankings[a.id]?.rank ?? 999;
        const rb = aiRanking.rankings[b.id]?.rank ?? 999;
        return ra - rb;
      })
    : displayPlans;

  const filtered = statusFilter === "all" ? sortedPlans : sortedPlans.filter((p) => p.status === statusFilter);

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...form });
        await logAuditEvent("update", "action_plans", editingPlan.id, editingPlan, form);
        toast({ title: "Plan updated" });
      } else {
        await createPlan.mutateAsync(form);
        await logAuditEvent("create", "action_plans", undefined, null, form);
        toast({ title: "Plan created" });
      }
      setDialogOpen(false);
      setEditingPlan(null);
      setForm({ name: "", sector: "", impact: "", description: "", status: "draft", deadline: "", economic_cost: "", feasibility_score: "", technical_readiness: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({ name: plan.name, sector: plan.sector, impact: plan.impact || "", description: plan.description || "", status: plan.status, deadline: plan.deadline || "", economic_cost: plan.economic_cost || "", feasibility_score: plan.feasibility_score || "", technical_readiness: plan.technical_readiness || "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const planData = plans?.find(p => p.id === id);
      await deletePlan.mutateAsync(id);
      await logAuditEvent("delete", "action_plans", id, planData, null);
      toast({ title: "Plan deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAiGenerate = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await aiGeneratePlanFromGoal(aiGoal);
      setAiResult(result);
    } catch (e: any) {
      setAiError(e.message || "Failed to generate plan");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSave = async () => {
    if (!aiResult) return;
    try {
      await createPlan.mutateAsync({
        name: aiResult.name,
        sector: aiResult.sector,
        impact: aiResult.impact,
        description: aiResult.description,
        status: "draft",
        deadline: aiResult.deadline,
        economic_cost: aiResult.economic_cost,
        feasibility_score: aiResult.feasibility_score,
        technical_readiness: aiResult.technical_readiness,
      });
      await logAuditEvent("create", "action_plans", undefined, null, { ...aiResult, source: "ai-generated" });
      toast({ title: "AI-generated plan saved as draft" });
      setAiDialogOpen(false);
      setAiGoal("");
      setAiResult(null);
    } catch (e: any) {
      toast({ title: "Error saving plan", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> Action Plans
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">Coordinated global climate interventions</p>
            {aiRanking.loading && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> AI ranking…
              </span>
            )}
            {!aiRanking.loading && aiRanking.rankedIds.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                <ArrowUpDown className="w-2.5 h-2.5" /> AI Ranked
              </span>
            )}
          </div>
          {aiRanking.summary && (
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xl">{aiRanking.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {displayPlans.length > 0 && <ExportMenu data={displayPlans} filename="action-plans" />}

          {/* AI Generate Plan Dialog */}
          <Dialog open={aiDialogOpen} onOpenChange={(open) => { setAiDialogOpen(open); if (!open) { setAiResult(null); setAiError(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Brain className="w-4 h-4" /> AI Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" /> AI Action Plan Generator
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Gemini</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Describe your climate goal</Label>
                  <textarea
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    placeholder="e.g., Reduce Delhi's transport emissions by 30% by 2030 through EV adoption and public transit expansion"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
                  />
                </div>

                {!aiResult && !aiLoading && (
                  <Button onClick={handleAiGenerate} className="w-full gap-2" disabled={!aiGoal.trim()}>
                    <Sparkles className="w-4 h-4" /> Generate Plan
                  </Button>
                )}

                {aiLoading && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing climate data & generating plan...</span>
                  </div>
                )}

                {aiError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">{aiError}</p>
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">{aiResult.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${feasibilityColors[aiResult.feasibility_score] || "bg-muted text-muted-foreground"}`}>
                          {aiResult.feasibility_score} feasibility
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Target className="w-3 h-3" /> Sector: <span className="text-foreground">{aiResult.sector}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Zap className="w-3 h-3" /> Impact: <span className="text-foreground font-mono">{aiResult.impact}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3" /> Deadline: <span className="text-foreground">{aiResult.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          Cost: <span className="text-foreground">{aiResult.economic_cost}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{aiResult.description}</p>

                      {aiResult.reasoning && (
                        <div className="bg-primary/5 border border-primary/20 rounded p-2.5">
                          <p className="text-xs text-primary font-medium mb-1">AI Reasoning</p>
                          <p className="text-xs text-muted-foreground">{aiResult.reasoning}</p>
                        </div>
                      )}

                      {aiResult.key_milestones?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1.5">Key Milestones</p>
                          <ul className="space-y-1">
                            {aiResult.key_milestones.map((m: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAiSave} className="flex-1 gap-1">
                        <Plus className="w-4 h-4" /> Save as Draft
                      </Button>
                      <Button variant="outline" onClick={handleAiGenerate} className="gap-1">
                        <Sparkles className="w-4 h-4" /> Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingPlan(null); setForm({ name: "", sector: "", impact: "", description: "", status: "draft", deadline: "", economic_cost: "", feasibility_score: "", technical_readiness: "" }); } }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Plan</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>{editingPlan ? "Edit Plan" : "Create Action Plan"}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Sector</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="bg-muted border-border" /></div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={form.status} onValueChange={(v: "active" | "review" | "draft" | "completed") => setForm({ ...form, status: v })}>
                        <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Expected Impact</Label><Input value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} placeholder="-X.X GtCO₂/yr" className="bg-muted border-border" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="bg-muted border-border" /></div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Economic Cost</Label><Input value={form.economic_cost} onChange={(e) => setForm({ ...form, economic_cost: e.target.value })} placeholder="$X billion" className="bg-muted border-border" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Feasibility</Label>
                      <Select value={form.feasibility_score || "none"} onValueChange={(v) => setForm({ ...form, feasibility_score: v === "none" ? "" : v as "high" | "medium" | "low" })}>
                        <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent><SelectItem value="none">Not set</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Technical Readiness</Label>
                      <Select value={form.technical_readiness || "none"} onValueChange={(v) => setForm({ ...form, technical_readiness: v === "none" ? "" : v as "ready" | "prototype" | "research" })}>
                        <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent><SelectItem value="none">Not set</SelectItem><SelectItem value="ready">Ready</SelectItem><SelectItem value="prototype">Prototype</SelectItem><SelectItem value="research">Research</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={!form.name || !form.sector}>{editingPlan ? "Update Plan" : "Create Plan"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                {aiRanking.rankedIds.length > 0 && <th className="text-left p-4 font-medium w-8">#</th>}
                <th className="text-left p-4 font-medium">Plan</th>
                <th className="text-left p-4 font-medium">Sector</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Impact</th>
                <th className="text-left p-4 font-medium">Deadline</th>
                <th className="text-left p-4 font-medium">Feasibility</th>
                <th className="text-left p-4 font-medium">Progress</th>
                {isAdmin && <th className="text-right p-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((plan) => (
                <React.Fragment key={plan.id}>
                  <tr className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                    {aiRanking.rankedIds.length > 0 && (
                      <td className="p-4 text-center">
                        <span className="text-xs font-mono text-muted-foreground/60">
                          {aiRanking.rankings[plan.id]?.rank ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {expandedPlan === plan.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{plan.name}</p>
                            {aiRanking.rankings[plan.id] && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${urgencyColors[aiRanking.rankings[plan.id].urgency] || ""}`}
                                title={aiRanking.rankings[plan.id].reason}
                              >
                                {aiRanking.rankings[plan.id].urgency}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {plan.stakeholders_count} stakeholders
                            {aiRanking.rankings[plan.id] && (
                              <span className="ml-2 text-muted-foreground/60">· {aiRanking.rankings[plan.id].reason}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{plan.sector}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[plan.status] || statusStyles.draft}`}>{plan.status}</span></td>
                    <td className="p-4 font-mono-data text-xs text-foreground">{plan.impact || "—"}</td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">{plan.deadline ? new Date(plan.deadline).toLocaleDateString() : "—"}</td>
                    <td className="p-4"><span className={`text-xs px-1.5 py-0.5 rounded ${feasibilityColors[plan.feasibility_score] || "text-muted-foreground"}`}>{plan.feasibility_score || "—"}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${plan.progress}%` }} /></div>
                        <span className="text-xs text-muted-foreground font-mono">{plan.progress}%</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(plan)}><Edit2 className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedPlan === plan.id && (
                    <tr>
                      <td colSpan={(isAdmin ? 8 : 7) + (aiRanking.rankedIds.length > 0 ? 1 : 0)} className="px-4 pb-4 pt-0">
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-4">
                          {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
                          <StakeholderPlanLinker actionPlanId={plan.id} actionPlanName={plan.name} />
                          <PlanComments actionPlanId={plan.id} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && <tr><td colSpan={(isAdmin ? 8 : 7) + (aiRanking.rankedIds.length > 0 ? 1 : 0)} className="p-8 text-center text-muted-foreground">No action plans found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionPlans;

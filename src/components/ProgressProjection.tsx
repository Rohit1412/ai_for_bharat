import { useMemo } from "react";
import { TrendingDown, TrendingUp, Target } from "lucide-react";
import { useActionPlans } from "@/hooks/useClimateData";

const ProgressProjection = () => {
  const { data: plans } = useActionPlans();

  const projection = useMemo(() => {
    if (!plans?.length) return null;

    const activePlans = plans.filter(p => p.status === "active" || p.status === "review");
    const avgProgress = activePlans.length > 0
      ? activePlans.reduce((s, p) => s + (p.progress || 0), 0) / activePlans.length
      : 0;

    // Calculate projected emission reduction based on plan impacts and progress
    let totalProjectedReduction = 0;
    let totalActualReduction = 0;
    activePlans.forEach(p => {
      const impact = parseFloat(p.impact?.replace(/[^0-9.-]/g, "") || "0");
      if (impact) {
        totalProjectedReduction += Math.abs(impact);
        totalActualReduction += Math.abs(impact) * ((p.progress || 0) / 100);
      }
    });

    const onTrack = avgProgress >= 50; // Simple heuristic: >= 50% avg is on track
    const behindSchedule = activePlans.filter(p => (p.progress || 0) < 30);

    return {
      activePlans: activePlans.length,
      avgProgress: Math.round(avgProgress),
      totalProjectedReduction: totalProjectedReduction.toFixed(2),
      totalActualReduction: totalActualReduction.toFixed(2),
      completionRate: plans.filter(p => p.status === "completed").length,
      totalPlans: plans.length,
      onTrack,
      behindSchedule: behindSchedule.length,
    };
  }, [plans]);

  if (!projection) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Global Impact Projection</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${projection.onTrack ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
          {projection.onTrack ? "On Track" : "Needs Attention"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Active Plans</p>
          <p className="text-xl font-bold font-mono text-foreground">{projection.activePlans}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Progress</p>
          <p className={`text-xl font-bold font-mono ${projection.avgProgress >= 50 ? "text-success" : "text-warning"}`}>{projection.avgProgress}%</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Projected Cut</p>
          <p className="text-xl font-bold font-mono text-primary flex items-center justify-center gap-1">
            <TrendingDown className="w-4 h-4" />{projection.totalProjectedReduction}
          </p>
          <p className="text-xs text-muted-foreground">GtCO₂/yr</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Realized Cut</p>
          <p className="text-xl font-bold font-mono text-success flex items-center justify-center gap-1">
            <TrendingDown className="w-4 h-4" />{projection.totalActualReduction}
          </p>
          <p className="text-xs text-muted-foreground">GtCO₂/yr</p>
        </div>
      </div>

      {projection.behindSchedule > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-warning bg-warning/5 rounded-lg p-2">
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
          {projection.behindSchedule} plan{projection.behindSchedule > 1 ? "s" : ""} behind schedule (&lt;30% progress) — projected impact reduced
        </div>
      )}

      <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${projection.avgProgress >= 70 ? "bg-success" : projection.avgProgress >= 40 ? "bg-warning" : "bg-destructive"}`}
          style={{ width: `${projection.avgProgress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-center">{projection.completionRate}/{projection.totalPlans} plans completed</p>
    </div>
  );
};

export default ProgressProjection;

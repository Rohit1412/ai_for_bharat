import { ArrowRight } from "lucide-react";
import { useActionPlans } from "@/hooks/useClimateData";
import { useNavigate } from "react-router-dom";

const statusStyles: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  review: "bg-warning/15 text-warning",
  draft: "bg-muted text-muted-foreground",
  completed: "bg-success/15 text-success",
};

const ActionPlansTable = () => {
  const { data: plans, isLoading } = useActionPlans();
  const navigate = useNavigate();
  const display = plans?.slice(0, 4) || [];

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in-up animate-delay-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Active Action Plans</h3>
          <p className="text-xs text-muted-foreground mt-1">Coordinated global interventions</p>
        </div>
        <button onClick={() => navigate("/action-plans")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          All plans <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Plan</th>
                <th className="text-left pb-3 font-medium">Sector</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Impact</th>
                <th className="text-left pb-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {display.map((plan) => (
                <tr key={plan.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{plan.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{plan.stakeholders_count} stakeholders</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground text-xs">{plan.sector}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[plan.status] || statusStyles.draft}`}>{plan.status}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono-data text-xs text-foreground">{plan.impact || "—"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${plan.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{plan.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {display.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No action plans yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActionPlansTable;

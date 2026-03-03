import { AlertTriangle, Leaf, Droplets, Sun, TrendingDown, ChevronRight, Activity } from "lucide-react";
import { useKarnatakaAlerts, useKarnatakaInterventions, KARNATAKA_MOCK } from "@/hooks/useKarnatakaData";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const severityColors: Record<string, string> = {
  critical: "text-destructive bg-destructive/10 border-destructive/20",
  high: "text-warning bg-warning/10 border-warning/20",
  medium: "text-info bg-info/10 border-info/20",
  low: "text-success bg-success/10 border-success/20",
};

const KarnatakaPanel = () => {
  const { data: alerts } = useKarnatakaAlerts();
  const { data: interventions } = useKarnatakaInterventions();
  const navigate = useNavigate();

  const displayAlerts = alerts || KARNATAKA_MOCK.alerts;
  const displayInterventions = interventions || KARNATAKA_MOCK.interventions;
  const kpis = KARNATAKA_MOCK.kpis;

  const totalCO2Reduction = displayInterventions.reduce((s, i) => s + i.carbon_reduction_tco2e, 0);

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Karnataka Rural Climate</h3>
            <p className="text-[10px] text-muted-foreground">Raichur + Chikkaballapur Districts · Viriva AI</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400">INDIA FOCUS</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
          <p className="text-xs font-mono font-bold text-foreground">{kpis.emissions_trend.current} Mt</p>
          <p className="text-[10px] text-muted-foreground">CO₂e Emissions</p>
          <p className="text-[10px] text-success mt-0.5">↓ {Math.abs(kpis.emissions_trend.change_percent)}%</p>
        </div>
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
          <p className="text-xs font-mono font-bold text-foreground">450K ha</p>
          <p className="text-[10px] text-muted-foreground">Paddy Area</p>
          <p className="text-[10px] text-warning mt-0.5">20.1M tCO₂e/yr</p>
        </div>
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
          <p className="text-xs font-mono font-bold text-foreground">{kpis.temp_rise_2030.projection}°C</p>
          <p className="text-[10px] text-muted-foreground">Proj. Temp 2030</p>
          <p className="text-[10px] text-destructive mt-0.5">↑ {kpis.temp_rise_2030.change_percent}%</p>
        </div>
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
          <p className="text-xs font-mono font-bold text-primary">{totalCO2Reduction.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">tCO₂e Potential</p>
          <p className="text-[10px] text-primary mt-0.5">5 interventions</p>
        </div>
      </div>

      {/* Active alerts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            Live Alerts ({displayAlerts.length})
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse inline-block" />
          </p>
        </div>
        <div className="space-y-2">
          {displayAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 text-xs ${severityColors[alert.severity] || severityColors.medium}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold capitalize">{alert.region}</span>
                <Badge variant="outline" className="text-[9px] capitalize px-1 py-0">
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{alert.message}</p>
              <p className="mt-1.5 font-medium">→ {alert.recommended_action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top interventions */}
      <div>
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <TrendingDown className="w-3.5 h-3.5 text-primary" />
          Recommended Interventions
        </p>
        <div className="space-y-1.5">
          {displayInterventions.slice(0, 3).map((intv) => (
            <div key={intv.id} className="flex items-center gap-3 rounded-lg bg-muted/10 border border-border/20 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{intv.name}</p>
                <p className="text-[10px] text-muted-foreground">{intv.cost_range}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono font-bold text-primary">-{intv.carbon_reduction_tco2e}</p>
                <p className="text-[9px] text-muted-foreground">tCO₂e</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => navigate("/action-plans")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-colors"
      >
        <Activity className="w-3.5 h-3.5" />
        Generate AI Action Plan
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default KarnatakaPanel;

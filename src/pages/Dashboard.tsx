import { Thermometer, Wind, Droplets, Waves } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import EmissionsChart from "@/components/EmissionsChart";
import AlertsPanel from "@/components/AlertsPanel";
import ActionPlansTable from "@/components/ActionPlansTable";
import RegionalOverview from "@/components/RegionalOverview";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import AirQualitySummary from "@/components/AirQualitySummary";
import DataUpload from "@/components/DataUpload";
import ProgressProjection from "@/components/ProgressProjection";
import ClimateNewsFeed from "@/components/ClimateNewsFeed";
import AIDailyBrief from "@/components/AIDailyBrief";
import KarnatakaPanel from "@/components/KarnatakaPanel";
import AWSStatusPanel from "@/components/AWSStatusPanel";
import { useClimateMetrics } from "@/hooks/useClimateData";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useMemo } from "react";

const metricConfig: { key: string; icon: any; variant: "default" | "warning" | "info"; title: string; prefix: string; suffix: string }[] = [
  { key: "atmospheric_co2", icon: Wind, variant: "warning", title: "Atmospheric CO₂", prefix: "", suffix: "" },
  { key: "global_temp_anomaly", icon: Thermometer, variant: "warning", title: "Global Temp Anomaly", prefix: "+", suffix: "" },
  { key: "methane_levels", icon: Droplets, variant: "info", title: "Methane Levels", prefix: "", suffix: "" },
  { key: "sea_level_rise", icon: Waves, variant: "default", title: "Sea Level Rise", prefix: "+", suffix: "" },
];

const Dashboard = () => {
  const { data: metrics, isLoading } = useClimateMetrics();
  const { isAdmin, isAnalyst } = useUserRole();
  useRealtimeSubscription("climate_metrics", ["climate-metrics"]);
  useRealtimeSubscription("alerts", ["alerts"]);

  // Get latest metric per type
  const latestByType = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;
    return metrics.reduce((acc, m) => {
      if (!acc[m.metric_type] || new Date(m.recorded_at) > new Date(acc[m.metric_type].recorded_at)) {
        acc[m.metric_type] = m;
      }
      return acc;
    }, {} as Record<string, typeof metrics[0]>);
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Climate Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time climate monitoring powered by NOAA, Climate TRACE & Open-Meteo</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isAdmin ? "bg-primary/15 text-primary" : isAnalyst ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>
          {isAdmin ? "Admin View" : isAnalyst ? "Analyst View" : "Viewer"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !latestByType ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-36 animate-pulse bg-muted/30" />
          ))
        ) : (
          metricConfig.map((config, i) => {
            const m = latestByType[config.key];
            if (!m) return (
              <div key={config.key} className="glass-card rounded-xl p-5 h-36 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No data</p>
              </div>
            );
            const displayValue = config.key === "global_temp_anomaly"
              ? `${config.prefix}${m.value}`
              : config.key === "methane_levels"
              ? Number(m.value).toLocaleString()
              : String(m.value);
            return (
              <MetricCard
                key={config.key}
                title={config.title}
                value={displayValue}
                unit={m.unit}
                change={Number(m.change_value) || 0}
                changeLabel={m.change_label || ""}
                icon={config.icon}
                variant={config.variant}
                delay={i + 1}
                lastUpdated={m.recorded_at}
                source={m.source || "Supabase DB"}
              />
            );
          })
        )}
      </div>

      <AIDailyBrief />
      <ProgressProjection />
      <AirQualitySummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><EmissionsChart /></div>
        <div><RegionalOverview /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AIInsightsPanel />
          <ActionPlansTable />
        </div>
        <div className="space-y-6">
          <AlertsPanel />
          <ClimateNewsFeed />
        </div>
      </div>

      {/* India & AWS Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KarnatakaPanel />
        <AWSStatusPanel />
      </div>

      {/* Role-specific: Data Upload for admin/analyst */}
      {(isAdmin || isAnalyst) && <DataUpload />}

      {/* Data Sources Attribution */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">
          Data Sources: <span className="text-foreground/70">Open-Meteo API</span> · <span className="text-foreground/70">Climate TRACE</span> · <span className="text-foreground/70">global-warming.org / NOAA</span> · <span className="text-foreground/70">AWS DynamoDB</span> · <span className="text-foreground/70">AWS Lambda + Bedrock</span> · AI: Gemini 2.0/2.5 Flash
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

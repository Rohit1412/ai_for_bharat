import { useState, useMemo } from "react";
import { BarChart3, Filter, TrendingUp, TrendingDown, Zap } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegionalData, useClimateMetrics } from "@/hooks/useClimateData";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import ExportMenu from "@/components/ExportMenu";
import AIChatPanel from "@/components/AIChatPanel";
import TemperatureAnomalyChart from "@/components/TemperatureAnomalyChart";
import MethaneChart from "@/components/MethaneChart";

const palette = [
  "hsl(160, 60%, 45%)", "hsl(200, 80%, 55%)", "hsl(38, 92%, 55%)",
  "hsl(0, 72%, 55%)", "hsl(270, 60%, 55%)", "hsl(120, 40%, 50%)",
  "hsl(330, 70%, 55%)", "hsl(50, 85%, 50%)", "hsl(180, 60%, 40%)",
  "hsl(15, 80%, 55%)", "hsl(240, 55%, 60%)", "hsl(90, 50%, 45%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label || payload[0]?.payload?.name}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color || entry.fill }}>●</span> {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
};

const TreemapCell = (props: any) => {
  const { x, y, width, height, name, fill } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--background))" strokeWidth={2} rx={4} />
      {width > 50 && height > 25 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={10} fontWeight={600}>
          {name}
        </text>
      )}
    </g>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("all");
  const { data: regionalData, isLoading: regLoading } = useRegionalData();
  const { data: metrics, isLoading: metLoading } = useClimateMetrics();
  useRealtimeSubscription("climate_metrics", ["climate-metrics"]);
  useRealtimeSubscription("regional_data", ["regional-data"]);

  const co2Metrics = useMemo(() =>
    metrics?.filter(m => m.metric_type === "atmospheric_co2")
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(m => ({ date: new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), co2: Number(m.value) })) || [],
    [metrics]
  );

  const metricTypes = useMemo(() => {
    if (!metrics) return [];
    const latest: Record<string, number> = {};
    metrics.forEach(m => {
      if (!latest[m.metric_type] || new Date(m.recorded_at) > new Date(latest[m.metric_type])) {
        latest[m.metric_type] = m.value;
      }
    });
    return Object.entries(latest).map(([key, value]) => ({
      metric: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      value: Number(value),
      fullMark: key === "methane_levels" ? 2000 : key === "atmospheric_co2" ? 500 : 10,
    }));
  }, [metrics]);

  const scatterData = useMemo(() =>
    regionalData?.map((r, i) => ({
      name: r.region_name, emissions: Number(r.emissions), trend: Number(r.trend_percentage), fill: palette[i % palette.length],
    })) || [], [regionalData]
  );

  const treemapData = useMemo(() =>
    regionalData?.map((r, i) => ({
      name: r.region_name.length > 14 ? r.region_name.slice(0, 14) + "…" : r.region_name,
      size: Number(r.emissions), fill: palette[i % palette.length],
    })) || [], [regionalData]
  );

  const totalEmissions = useMemo(() => regionalData?.reduce((s, r) => s + Number(r.emissions), 0) || 0, [regionalData]);
  const avgTrend = useMemo(() => {
    if (!regionalData?.length) return 0;
    return regionalData.reduce((s, r) => s + Number(r.trend_percentage), 0) / regionalData.length;
  }, [regionalData]);

  // AI context string from real data
  const aiContext = useMemo(() =>
    `Climate data context:\n- Total regional emissions: ${totalEmissions.toFixed(2)} GtCO₂\n- Average trend: ${avgTrend.toFixed(1)}%\n- Regions: ${regionalData?.map(r => `${r.region_name}: ${r.emissions} GtCO₂ (${r.trend_percentage}%)`).join(", ") || "N/A"}\n- Latest CO₂: ${co2Metrics[co2Metrics.length - 1]?.co2 || "N/A"} ppm\n- Metric types: ${metricTypes.map(m => m.metric).join(", ") || "N/A"}`,
    [totalEmissions, avgTrend, regionalData, co2Metrics, metricTypes]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-dimensional climate analysis · Sources: Supabase DB, global-warming.org, Climate TRACE</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="5y">Last 5 Years</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          {regionalData && <ExportMenu data={regionalData} filename="analytics-export" />}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Emissions</p>
            <p className="text-xl font-bold font-mono text-foreground">{regLoading ? "—" : totalEmissions.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">GtCO₂</span></p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${avgTrend < 0 ? "bg-success/10" : "bg-destructive/10"}`}>
            {avgTrend < 0 ? <TrendingDown className="w-6 h-6 text-success" /> : <TrendingUp className="w-6 h-6 text-destructive" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Trend</p>
            <p className={`text-xl font-bold font-mono ${avgTrend < 0 ? "text-success" : "text-destructive"}`}>{regLoading ? "—" : `${avgTrend > 0 ? "+" : ""}${avgTrend.toFixed(1)}%`}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Regions Tracked</p>
            <p className="text-xl font-bold font-mono text-foreground">{regLoading ? "—" : regionalData?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Row 1: Area + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">CO₂ Concentration Over Time</h3>
          {metLoading ? <div className="h-[280px] bg-muted/30 rounded animate-pulse" /> : co2Metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={co2Metrics}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="co2" stroke="hsl(160, 60%, 45%)" strokeWidth={2} fill="url(#co2Grad)" name="CO₂ (ppm)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">No CO₂ data available</p>}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Metric Radar Profile</h3>
          {metLoading ? <div className="h-[280px] bg-muted/30 rounded animate-pulse" /> : metricTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={metricTypes}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Current" dataKey="value" stroke="hsl(200, 80%, 55%)" fill="hsl(200, 80%, 55%)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">No metrics available</p>}
        </div>
      </div>

      {/* Row 2: Live API Data — Temperature Anomaly + Methane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TemperatureAnomalyChart />
        <MethaneChart />
      </div>

      {/* Row 3: Scatter + Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Emissions vs Trend (Scatter)</h3>
          {regLoading ? <div className="h-[300px] bg-muted/30 rounded animate-pulse" /> : scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="emissions" name="Emissions" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} />
                <YAxis dataKey="trend" name="Trend %" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={scatterData} name="Regions">
                  {scatterData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">No regional data</p>}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Emissions Treemap</h3>
          {regLoading ? <div className="h-[300px] bg-muted/30 rounded animate-pulse" /> : treemapData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="hsl(var(--background))" content={<TreemapCell />} />
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-12">No regional data</p>}
        </div>
      </div>

      {/* Row 3: Horizontal Bar */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Regional Emissions Ranking</h3>
        {regLoading ? <div className="h-[320px] bg-muted/30 rounded animate-pulse" /> : regionalData && regionalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={[...regionalData].sort((a, b) => Number(b.emissions) - Number(a.emissions)).map((r, i) => ({
                name: r.region_name.length > 15 ? r.region_name.slice(0, 15) + "…" : r.region_name,
                emissions: Number(r.emissions.toFixed(3)),
                fill: palette[i % palette.length],
              }))}
              layout="vertical"
              margin={{ left: 10, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="emissions" name="GtCO₂" radius={[0, 6, 6, 0]}>
                {[...regionalData].sort((a, b) => Number(b.emissions) - Number(a.emissions)).map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-muted-foreground text-sm text-center py-12">No regional data</p>}
      </div>

      {/* Floating AI Chat */}
      <AIChatPanel context={aiContext} />
    </div>
  );
};

export default Analytics;

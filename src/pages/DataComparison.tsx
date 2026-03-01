import { useState, useMemo, useCallback } from "react";
import { GitCompareArrows, Download, Layers, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Brush
} from "recharts";
import { useCO2Levels, useTemperatureAnomaly, useMethaneLevels, useNitrousOxideLevels, useArcticIce } from "@/hooks/useGlobalWarming";
import { useClimateMetrics, useRegionalData } from "@/hooks/useClimateData";

// ─── Color palette for variables ───

const VAR_COLORS: Record<string, string> = {
  co2: "hsl(160, 60%, 45%)",
  temperature: "hsl(0, 72%, 55%)",
  methane: "hsl(38, 92%, 55%)",
  n2o: "hsl(270, 60%, 55%)",
  arctic: "hsl(200, 80%, 55%)",
};

// ─── Available variables ───

const VARIABLES = [
  { id: "co2", label: "CO₂ Concentration", unit: "ppm", yDomain: [350, 440] },
  { id: "temperature", label: "Temperature Anomaly", unit: "°C", yDomain: [-0.5, 1.5] },
  { id: "methane", label: "Methane (CH₄)", unit: "ppb", yDomain: [1800, 1960] },
  { id: "n2o", label: "Nitrous Oxide (N₂O)", unit: "ppb", yDomain: [320, 340] },
  { id: "arctic", label: "Arctic Ice Extent", unit: "M km²", yDomain: [3, 16] },
];

// ─── Custom tooltip ───

const ComparisonTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-border shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-bold text-foreground">{typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Statistics helper ───

function computeStats(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // Linear trend (least squares)
  const n = values.length;
  const xMean = (n - 1) / 2;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - mean);
    den += (x - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;

  return { mean, std, min, max, median, slope, count: n };
}

// ─── Pearson correlation ───

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xSlice = x.slice(0, n), ySlice = y.slice(0, n);
  const xMean = xSlice.reduce((s, v) => s + v, 0) / n;
  const yMean = ySlice.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean, dy = ySlice[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

const DataComparison = () => {
  const [primaryVar, setPrimaryVar] = useState("co2");
  const [secondaryVar, setSecondaryVar] = useState("temperature");
  const [chartType, setChartType] = useState<"overlay" | "scatter" | "normalized">("overlay");

  const { data: co2Data } = useCO2Levels();
  const { data: tempData } = useTemperatureAnomaly();
  const { data: methaneData } = useMethaneLevels();
  const { data: n2oData } = useNitrousOxideLevels();
  const { data: arcticData } = useArcticIce();

  // Build year-indexed datasets
  const buildSeries = useCallback((varId: string): Record<string, number> => {
    const map: Record<string, number> = {};
    switch (varId) {
      case "co2":
        co2Data?.forEach(e => { map[e.year] = parseFloat(e.trend); });
        break;
      case "temperature":
        tempData?.forEach(e => { map[Math.floor(parseFloat(e.time)).toString()] = parseFloat(e.station); });
        break;
      case "methane":
        methaneData?.forEach(e => { map[e.date.slice(0, 4)] = parseFloat(e.trend); });
        break;
      case "n2o":
        n2oData?.forEach(e => { map[e.date.slice(0, 4)] = parseFloat(e.trend); });
        break;
      case "arctic":
        arcticData?.forEach(e => { if (parseFloat(e.extent) > 0) map[e.year] = parseFloat(e.extent); });
        break;
    }
    return map;
  }, [co2Data, tempData, methaneData, n2oData, arcticData]);

  const primarySeries = useMemo(() => buildSeries(primaryVar), [buildSeries, primaryVar]);
  const secondarySeries = useMemo(() => buildSeries(secondaryVar), [buildSeries, secondaryVar]);

  const primaryMeta = VARIABLES.find(v => v.id === primaryVar)!;
  const secondaryMeta = VARIABLES.find(v => v.id === secondaryVar)!;

  // Merged chart data
  const chartData = useMemo(() => {
    const allYears = [...new Set([...Object.keys(primarySeries), ...Object.keys(secondarySeries)])].sort();
    return allYears.map(year => ({
      year,
      [primaryVar]: primarySeries[year] ?? null,
      [secondaryVar]: secondarySeries[year] ?? null,
    })).filter(d => d[primaryVar] !== null || d[secondaryVar] !== null);
  }, [primarySeries, secondarySeries, primaryVar, secondaryVar]);

  // Normalized data (z-scores)
  const normalizedData = useMemo(() => {
    const pVals = chartData.map(d => d[primaryVar] as number).filter(v => v != null);
    const sVals = chartData.map(d => d[secondaryVar] as number).filter(v => v != null);
    const pStats = computeStats(pVals);
    const sStats = computeStats(sVals);
    if (!pStats || !sStats) return chartData;

    return chartData.map(d => ({
      year: d.year,
      [primaryVar]: d[primaryVar] != null ? ((d[primaryVar] as number) - pStats.mean) / (pStats.std || 1) : null,
      [secondaryVar]: d[secondaryVar] != null ? ((d[secondaryVar] as number) - sStats.mean) / (sStats.std || 1) : null,
    }));
  }, [chartData, primaryVar, secondaryVar]);

  // Scatter data
  const scatterData = useMemo(() => {
    return chartData
      .filter(d => d[primaryVar] != null && d[secondaryVar] != null)
      .map(d => ({ x: d[primaryVar] as number, y: d[secondaryVar] as number, year: d.year }));
  }, [chartData, primaryVar, secondaryVar]);

  // Stats
  const primaryStats = useMemo(() => computeStats(Object.values(primarySeries)), [primarySeries]);
  const secondaryStats = useMemo(() => computeStats(Object.values(secondarySeries)), [secondarySeries]);
  const correlation = useMemo(() => {
    const matched = chartData.filter(d => d[primaryVar] != null && d[secondaryVar] != null);
    return pearson(matched.map(d => d[primaryVar] as number), matched.map(d => d[secondaryVar] as number));
  }, [chartData, primaryVar, secondaryVar]);

  // Export
  const handleExport = () => {
    const header = `year,${primaryMeta.label} (${primaryMeta.unit}),${secondaryMeta.label} (${secondaryMeta.unit})`;
    const rows = chartData.map(d => `${d.year},${d[primaryVar] ?? ""},${d[secondaryVar] ?? ""}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climate-comparison-${primaryVar}-vs-${secondaryVar}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-primary" /> Data Comparison
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overlay, correlate, and compare climate variables side-by-side
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Variable Selectors */}
      <div className="glass-card rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Primary Variable</label>
            <Select value={primaryVar} onValueChange={setPrimaryVar}>
              <SelectTrigger className="bg-muted border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: VAR_COLORS[primaryVar] }} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {VARIABLES.map(v => <SelectItem key={v.id} value={v.id}>{v.label} ({v.unit})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Secondary Variable</label>
            <Select value={secondaryVar} onValueChange={setSecondaryVar}>
              <SelectTrigger className="bg-muted border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: VAR_COLORS[secondaryVar] }} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {VARIABLES.filter(v => v.id !== primaryVar).map(v => <SelectItem key={v.id} value={v.id}>{v.label} ({v.unit})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Chart Type</label>
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overlay">Dual-Axis Overlay</SelectItem>
                <SelectItem value="normalized">Normalized (Z-Score)</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Pearson Correlation</label>
            <div className={`flex items-center justify-center rounded-lg bg-muted/40 h-[40px] font-mono text-lg font-bold ${
              Math.abs(correlation) > 0.7 ? (correlation > 0 ? "text-destructive" : "text-success") : "text-warning"
            }`}>
              r = {correlation.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "scatter" ? (
              <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="x" name={primaryMeta.label}
                  tick={{ fill: VAR_COLORS[primaryVar], fontSize: 11 }}
                  label={{ value: `${primaryMeta.label} (${primaryMeta.unit})`, position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  dataKey="y" name={secondaryMeta.label}
                  tick={{ fill: VAR_COLORS[secondaryVar], fontSize: 11 }}
                  label={{ value: `${secondaryMeta.label} (${secondaryMeta.unit})`, angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass-card rounded-lg p-3 text-xs border border-border">
                      <p className="font-semibold text-foreground mb-1">Year: {d.year}</p>
                      <p className="text-muted-foreground">{primaryMeta.label}: <span className="font-mono font-bold text-foreground">{d.x?.toFixed(2)}</span> {primaryMeta.unit}</p>
                      <p className="text-muted-foreground">{secondaryMeta.label}: <span className="font-mono font-bold text-foreground">{d.y?.toFixed(2)}</span> {secondaryMeta.unit}</p>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} fill={VAR_COLORS[primaryVar]} fillOpacity={0.7} />
              </ScatterChart>
            ) : chartType === "normalized" ? (
              <LineChart data={normalizedData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} label={{ value: "Z-Score (σ)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey={primaryVar} stroke={VAR_COLORS[primaryVar]} strokeWidth={2} dot={false} name={`${primaryMeta.label} (σ)`} connectNulls />
                <Line type="monotone" dataKey={secondaryVar} stroke={VAR_COLORS[secondaryVar]} strokeWidth={2} dot={false} name={`${secondaryMeta.label} (σ)`} connectNulls />
                <Brush dataKey="year" height={20} stroke="hsl(var(--border))" fill="hsl(var(--muted))" />
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis yAxisId="primary" tick={{ fill: VAR_COLORS[primaryVar], fontSize: 10 }} domain={primaryMeta.yDomain as [number, number]} />
                <YAxis yAxisId="secondary" orientation="right" tick={{ fill: VAR_COLORS[secondaryVar], fontSize: 10 }} domain={secondaryMeta.yDomain as [number, number]} />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend />
                <Line yAxisId="primary" type="monotone" dataKey={primaryVar} stroke={VAR_COLORS[primaryVar]} strokeWidth={2} dot={false} name={`${primaryMeta.label} (${primaryMeta.unit})`} connectNulls />
                <Line yAxisId="secondary" type="monotone" dataKey={secondaryVar} stroke={VAR_COLORS[secondaryVar]} strokeWidth={2} dot={false} name={`${secondaryMeta.label} (${secondaryMeta.unit})`} connectNulls />
                <Brush dataKey="year" height={20} stroke="hsl(var(--border))" fill="hsl(var(--muted))" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[{ stats: primaryStats, meta: primaryMeta, varId: primaryVar }, { stats: secondaryStats, meta: secondaryMeta, varId: secondaryVar }].map(({ stats, meta, varId }) => (
          <div key={varId} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: VAR_COLORS[varId] }} />
              <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{meta.unit}</span>
            </div>
            {stats ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mean", value: stats.mean.toFixed(2) },
                  { label: "Std Dev", value: stats.std.toFixed(3) },
                  { label: "Min", value: stats.min.toFixed(2) },
                  { label: "Max", value: stats.max.toFixed(2) },
                  { label: "Median", value: stats.median.toFixed(2) },
                  { label: "Trend/yr", value: stats.slope > 0 ? `+${stats.slope.toFixed(4)}` : stats.slope.toFixed(4) },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-muted/30 p-2 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold font-mono text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
            )}
          </div>
        ))}
      </div>

      {/* Interpretation help */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">Pearson r interpretation:</strong> |r| &gt; 0.7 = strong, 0.4–0.7 = moderate, &lt; 0.4 = weak. Positive r = variables move together; negative r = inverse relationship.</p>
          <p><strong className="text-foreground">Normalized view:</strong> Z-score standardization lets you compare variables with different scales on the same axis. A value of +2σ means 2 standard deviations above the mean.</p>
          <p><strong className="text-foreground">Brush:</strong> Drag the range selector at the bottom of the chart to zoom into specific time periods.</p>
        </div>
      </div>
    </div>
  );
};

export default DataComparison;

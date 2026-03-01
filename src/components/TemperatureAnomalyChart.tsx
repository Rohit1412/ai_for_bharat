import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTemperatureAnomaly } from "@/hooks/useGlobalWarming";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color }}>●</span> {entry.name}: {Number(entry.value).toFixed(3)}°C
        </p>
      ))}
    </div>
  );
};

const TemperatureAnomalyChart = () => {
  const { data: rawData, isLoading } = useTemperatureAnomaly();

  const chartData = useMemo(() => {
    if (!rawData?.length) return [];
    // Sample every 12th entry (yearly) to keep chart readable
    return rawData
      .filter((_, i) => i % 12 === 0)
      .map((d) => ({
        year: d.time.slice(0, 4),
        anomaly: parseFloat(d.station) || parseFloat(d.land) || 0,
      }));
  }, [rawData]);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Global Temperature Anomaly</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Source: global-warming.org · Since 1880 · Relative to 1951-1980 avg
          </p>
        </div>
        {chartData.length > 0 && (
          <span className="text-xs font-mono px-2 py-1 rounded bg-destructive/10 text-destructive">
            Latest: +{chartData[chartData.length - 1]?.anomaly.toFixed(2)}°C
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-[280px] bg-muted/30 rounded animate-pulse" />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempAnomalyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
            <XAxis dataKey="year" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} interval={10} />
            <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={1.5} stroke="hsl(38, 92%, 55%)" strokeDasharray="6 3" label={{ value: "1.5°C limit", fill: "hsl(38, 92%, 55%)", fontSize: 10, position: "right" }} />
            <Area type="monotone" dataKey="anomaly" stroke="hsl(0, 72%, 55%)" fill="url(#tempAnomalyGrad)" strokeWidth={2} name="Anomaly" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-12">Temperature data unavailable</p>
      )}
    </div>
  );
};

export default TemperatureAnomalyChart;

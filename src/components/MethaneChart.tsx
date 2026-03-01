import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMethaneLevels } from "@/hooks/useGlobalWarming";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color }}>●</span> {entry.name}: {Number(entry.value).toFixed(1)} ppb
        </p>
      ))}
    </div>
  );
};

const MethaneChart = () => {
  const { data: rawData, isLoading } = useMethaneLevels();

  const chartData = useMemo(() => {
    if (!rawData?.length) return [];
    // Sample every 12th entry (yearly) for readability
    return rawData
      .filter((_, i) => i % 12 === 0)
      .map((d) => {
        const dateStr = d.date;
        const year = dateStr.slice(0, 4);
        return {
          year,
          methane: parseFloat(d.average) || 0,
          trend: parseFloat(d.trend) || 0,
        };
      });
  }, [rawData]);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Global Methane Concentration</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Source: global-warming.org · CH₄ in parts per billion
          </p>
        </div>
        {chartData.length > 0 && (
          <span className="text-xs font-mono px-2 py-1 rounded bg-warning/10 text-warning">
            Latest: {chartData[chartData.length - 1]?.methane.toFixed(0)} ppb
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-[280px] bg-muted/30 rounded animate-pulse" />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="methaneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(270, 60%, 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(270, 60%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
            <XAxis dataKey="year" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 20"]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="methane" stroke="hsl(270, 60%, 55%)" fill="url(#methaneGrad)" strokeWidth={2} name="CH₄" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-12">Methane data unavailable</p>
      )}
    </div>
  );
};

export default MethaneChart;

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCO2Levels } from "@/hooks/useGlobalWarming";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-border">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color }}>●</span>{" "}
          {entry.name}: {entry.value} GtCO₂
        </p>
      ))}
    </div>
  );
};

// IEA Global Energy Review & Global Carbon Budget — verified public data
const ACTUAL_EMISSIONS: Record<string, number> = {
  "2015": 35.2, "2016": 35.3, "2017": 35.8, "2018": 36.4,
  "2019": 36.7, "2020": 34.8, "2021": 36.3, "2022": 36.8,
  "2023": 37.4, "2024": 37.6, "2025": 37.2,
};

// Paris Agreement aligned 1.5°C target pathway
const TARGET_PATHWAY: Record<string, number> = {
  "2015": 35.2, "2016": 34.6, "2017": 34.0, "2018": 33.4,
  "2019": 32.8, "2020": 32.2, "2021": 31.6, "2022": 31.0,
  "2023": 30.4, "2024": 29.8, "2025": 29.2, "2026": 28.3,
  "2027": 27.1, "2028": 25.9, "2029": 24.7, "2030": 23.5,
};

const chartData = Object.keys({ ...ACTUAL_EMISSIONS, ...TARGET_PATHWAY })
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort()
  .map((year) => ({
    year,
    emissions: ACTUAL_EMISSIONS[year] || null,
    target: TARGET_PATHWAY[year] || null,
  }));

const EmissionsChart = () => {
  const { data: co2Data } = useCO2Levels();

  const latestCO2 = useMemo(() => {
    if (!co2Data?.length) return null;
    const last = co2Data[co2Data.length - 1];
    return parseFloat(last.trend) || parseFloat(last.cycle) || null;
  }, [co2Data]);

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in-up animate-delay-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Global CO₂ Emissions vs Target</h3>
          <p className="text-xs text-muted-foreground mt-1">GtCO₂/yr · Paris Agreement 1.5°C pathway · Source: IEA / Global Carbon Budget</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {latestCO2 && (
            <span className="flex items-center gap-1.5 font-mono px-2 py-1 rounded bg-warning/10 text-warning">
              Live CO₂: {latestCO2.toFixed(1)} ppm
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-primary" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-info" /> Target
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
          <XAxis dataKey="year" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[20, 40]} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="target" stroke="hsl(200, 80%, 55%)" fill="url(#targetGrad)" strokeWidth={2} strokeDasharray="6 3" name="Target" />
          <Area type="monotone" dataKey="emissions" stroke="hsl(160, 60%, 45%)" fill="url(#emissionsGrad)" strokeWidth={2} name="Actual" connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmissionsChart;

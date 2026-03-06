import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Thermometer, Wind, Droplets, Zap, TrendingUp, Loader2, RefreshCw, Flame } from "lucide-react";
import { toast } from "sonner";

interface RealClimateData {
  co2: { current: number; trend: string; year: string; month: string };
  temperature: { current: string; trend: string; year: string };
  methane: { current: number; trend: string };
  no2: { current: number; trend: string };
  lastFetched: string;
  sources: string[];
}

const statusColors = {
  good: "text-primary",
  warning: "text-glow-warning",
  danger: "text-glow-danger",
};

export default function ClimateMetrics() {
  const [data, setData] = useState<RealClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/climate-realdata`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch real climate data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build metrics array from real data or fallback
  const metrics = data
    ? [
        { icon: Thermometer, label: "Global Temp Δ", value: `${data.temperature.current}°C`, trend: data.temperature.trend, status: "danger" as const, real: true },
        { icon: Wind, label: "CO₂ Level", value: `${data.co2.current.toFixed(1)} ppm`, trend: `+${data.co2.trend}`, status: "danger" as const, real: true },
        { icon: Flame, label: "Methane (CH₄)", value: `${data.methane.current} ppb`, trend: data.methane.trend, status: "warning" as const, real: true },
        { icon: Droplets, label: "N₂O Level", value: `${data.no2.current} ppb`, trend: data.no2.trend, status: "warning" as const, real: true },
        { icon: Zap, label: "Renewable %", value: "32.4%", trend: "+1.8", status: "good" as const, real: false },
        { icon: TrendingUp, label: "Actions Active", value: "2,847", trend: "+156", status: "good" as const, real: false },
      ]
    : [
        { icon: Thermometer, label: "Global Temp Δ", value: "+1.48°C", trend: "+0.03", status: "warning" as const, real: false },
        { icon: Droplets, label: "Sea Level Rise", value: "+3.6mm/yr", trend: "+0.2", status: "danger" as const, real: false },
        { icon: Wind, label: "CO₂ Level", value: "421 ppm", trend: "+2.1", status: "danger" as const, real: false },
        { icon: Zap, label: "Renewable %", value: "32.4%", trend: "+1.8", status: "good" as const, real: false },
        { icon: Activity, label: "Carbon Budget", value: "380 GT", trend: "-12", status: "warning" as const, real: false },
        { icon: TrendingUp, label: "Actions Active", value: "2,847", trend: "+156", status: "good" as const, real: false },
      ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[10px] font-mono text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              LIVE DATA
            </span>
          )}
          {error && (
            <span className="text-[10px] font-mono text-glow-warning">USING FALLBACK DATA</span>
          )}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          REFRESH
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel p-3 group hover:border-primary/30 transition-colors relative"
          >
            {m.real && (
              <span className="absolute top-1 right-1.5 text-[8px] font-mono text-primary/60">REAL</span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <m.icon className={`w-4 h-4 ${statusColors[m.status]}`} />
              <span className="text-xs font-display tracking-wider text-muted-foreground uppercase">
                {m.label}
              </span>
            </div>
            <div className={`text-xl font-display font-bold ${statusColors[m.status]}`}>
              {loading && !data ? "..." : m.value}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {m.trend.startsWith("+") || m.trend.startsWith("-") ? m.trend : `+${m.trend}`}/yr
            </div>
          </motion.div>
        ))}
      </div>

      {data && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
          <span>Sources: {data.sources.join(" · ")}</span>
          <span className="ml-auto">Updated: {new Date(data.lastFetched).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

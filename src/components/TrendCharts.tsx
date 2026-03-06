import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Loader2, RefreshCw, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MetricRow {
  country: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

const METRIC_COLORS: Record<string, string> = {
  temperature: "hsl(0 70% 50%)",
  co2: "hsl(38 90% 55%)",
  methane: "hsl(190 90% 50%)",
  renewable_pct: "hsl(165 80% 45%)",
};

const METRIC_LABELS: Record<string, string> = {
  temperature: "Temperature Anomaly (°C)",
  co2: "CO₂ (ppm)",
  methane: "Methane (ppb)",
  renewable_pct: "Renewables (%)",
};

const customTooltipStyle = {
  backgroundColor: "hsl(220 20% 10% / 0.95)",
  border: "1px solid hsl(200 20% 18%)",
  borderRadius: "6px",
  fontFamily: "Rajdhani, sans-serif",
  fontSize: "12px",
  color: "hsl(180 20% 90%)",
};

export default function TrendCharts() {
  const [data, setData] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>("co2");
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("climate_metrics")
      .select("*")
      .eq("country", "Global")
      .order("recorded_at", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setData(rows || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Seed historical data if empty
  const seedData = async () => {
    setSeeding(true);
    const historicalData = [
      // CO2 data (ppm)
      ...[ 
        { year: 1990, value: 354 }, { year: 1995, value: 360 }, { year: 2000, value: 369 },
        { year: 2005, value: 380 }, { year: 2010, value: 390 }, { year: 2015, value: 401 },
        { year: 2020, value: 414 }, { year: 2025, value: 421 },
      ].map(d => ({ country: "Global", metric_type: "co2", value: d.value, unit: "ppm", recorded_at: `${d.year}-01-01`, source: "NOAA Mauna Loa" })),
      // Temperature anomaly (°C)
      ...[
        { year: 1990, value: 0.45 }, { year: 1995, value: 0.52 }, { year: 2000, value: 0.61 },
        { year: 2005, value: 0.74 }, { year: 2010, value: 0.82 }, { year: 2015, value: 1.04 },
        { year: 2020, value: 1.29 }, { year: 2025, value: 1.48 },
      ].map(d => ({ country: "Global", metric_type: "temperature", value: d.value, unit: "°C", recorded_at: `${d.year}-01-01`, source: "NASA GISTEMP" })),
      // Methane (ppb)
      ...[
        { year: 1990, value: 1714 }, { year: 1995, value: 1732 }, { year: 2000, value: 1751 },
        { year: 2005, value: 1774 }, { year: 2010, value: 1799 }, { year: 2015, value: 1834 },
        { year: 2020, value: 1879 }, { year: 2025, value: 1923 },
      ].map(d => ({ country: "Global", metric_type: "methane", value: d.value, unit: "ppb", recorded_at: `${d.year}-01-01`, source: "NOAA" })),
      // Renewables %
      ...[
        { year: 1990, value: 6 }, { year: 1995, value: 8 }, { year: 2000, value: 10 },
        { year: 2005, value: 14 }, { year: 2010, value: 18 }, { year: 2015, value: 24 },
        { year: 2020, value: 29 }, { year: 2025, value: 33 },
      ].map(d => ({ country: "Global", metric_type: "renewable_pct", value: d.value, unit: "%", recorded_at: `${d.year}-01-01`, source: "IRENA" })),
    ];

    const { error } = await supabase.from("climate_metrics").insert(historicalData);
    if (error) toast.error(error.message);
    else {
      toast.success("Historical data seeded!");
      fetchData();
    }
    setSeeding(false);
  };

  const filteredData = data.filter(d => d.metric_type === selectedMetric);
  const chartData = filteredData.map(d => ({
    year: new Date(d.recorded_at).getFullYear().toString(),
    value: Number(d.value),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-display text-xs tracking-widest text-primary font-bold">HISTORICAL TRENDS</h3>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            <Database className="w-3 h-3 inline mr-0.5" />STORED
          </span>
        </div>
        <button onClick={fetchData} disabled={loading} className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          REFRESH
        </button>
      </div>

      {/* Metric selector */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(key)}
            className={`px-3 py-1.5 rounded text-[10px] font-display tracking-wider transition-colors ${
              selectedMetric === key
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-muted/20 text-muted-foreground border border-border/30 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {data.length === 0 && !loading ? (
        <div className="text-center py-10">
          <Database className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No historical data stored yet.</p>
          <button
            onClick={seedData}
            disabled={seeding}
            className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20 transition-colors"
          >
            {seeding ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
            Seed Historical Data
          </button>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 20% 18%)" />
            <XAxis dataKey="year" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <YAxis stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <Tooltip contentStyle={customTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Rajdhani" }} />
            <Line
              type="monotone"
              dataKey="value"
              name={METRIC_LABELS[selectedMetric]}
              stroke={METRIC_COLORS[selectedMetric]}
              strokeWidth={2}
              dot={{ r: 3 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

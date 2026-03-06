import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const tempData = [
  { year: "1990", anomaly: 0.45 },
  { year: "1995", anomaly: 0.52 },
  { year: "2000", anomaly: 0.61 },
  { year: "2005", anomaly: 0.74 },
  { year: "2010", anomaly: 0.82 },
  { year: "2015", anomaly: 1.04 },
  { year: "2020", anomaly: 1.29 },
  { year: "2025", anomaly: 1.48 },
];

const co2Data = [
  { year: "1990", level: 354 },
  { year: "1995", level: 360 },
  { year: "2000", level: 369 },
  { year: "2005", level: 380 },
  { year: "2010", level: 390 },
  { year: "2015", level: 401 },
  { year: "2020", level: 414 },
  { year: "2025", level: 421 },
];

const countryData = [
  { country: "China", co2: 11400, renewables: 31, tempDelta: 1.6 },
  { country: "USA", co2: 4800, renewables: 22, tempDelta: 1.9 },
  { country: "India", co2: 2900, renewables: 18, tempDelta: 3.1 },
  { country: "EU", co2: 2800, renewables: 38, tempDelta: 1.7 },
  { country: "Russia", co2: 1800, renewables: 8, tempDelta: 2.8 },
  { country: "Japan", co2: 1100, renewables: 22, tempDelta: 1.9 },
  { country: "Brazil", co2: 480, renewables: 45, tempDelta: 2.3 },
  { country: "S. Africa", co2: 440, renewables: 15, tempDelta: 2.5 },
];

const predictionData = [
  { year: "2025", optimistic: 1.5, baseline: 1.5, pessimistic: 1.5 },
  { year: "2030", optimistic: 1.5, baseline: 1.7, pessimistic: 1.9 },
  { year: "2040", optimistic: 1.4, baseline: 2.1, pessimistic: 2.8 },
  { year: "2050", optimistic: 1.3, baseline: 2.5, pessimistic: 3.6 },
  { year: "2060", optimistic: 1.2, baseline: 2.8, pessimistic: 4.2 },
  { year: "2070", optimistic: 1.1, baseline: 3.0, pessimistic: 4.6 },
];

const customTooltipStyle = {
  backgroundColor: "hsl(220 20% 10% / 0.95)",
  border: "1px solid hsl(200 20% 18%)",
  borderRadius: "6px",
  fontFamily: "Rajdhani, sans-serif",
  fontSize: "12px",
  color: "hsl(180 20% 90%)",
};

export default function ClimateCharts() {
  return (
    <div className="space-y-6">
      {/* Temperature Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4"
      >
        <h3 className="font-display text-[10px] tracking-widest text-glow-warning mb-4">
          GLOBAL TEMPERATURE ANOMALY (°C)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={tempData}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38 90% 55%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(38 90% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 20% 18%)" />
            <XAxis dataKey="year" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <YAxis stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" domain={[0, 2]} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Area
              type="monotone" dataKey="anomaly" stroke="hsl(38 90% 55%)"
              fill="url(#tempGrad)" strokeWidth={2}
              animationDuration={2000} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* CO2 Levels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4"
      >
        <h3 className="font-display text-[10px] tracking-widest text-glow-danger mb-4">
          ATMOSPHERIC CO₂ (PPM)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={co2Data}>
            <defs>
              <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0 70% 50%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(0 70% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 20% 18%)" />
            <XAxis dataKey="year" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <YAxis stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" domain={[340, 440]} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Area
              type="monotone" dataKey="level" stroke="hsl(0 70% 50%)"
              fill="url(#co2Grad)" strokeWidth={2}
              animationDuration={2000} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Country-wise CO2 & Renewables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-4"
      >
        <h3 className="font-display text-[10px] tracking-widest text-primary mb-4">
          COUNTRY-WISE CO₂ EMISSIONS (MT) & RENEWABLE ADOPTION (%)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={countryData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 20% 18%)" />
            <XAxis dataKey="country" stroke="hsl(200 10% 55%)" fontSize={9} fontFamily="Space Mono" />
            <YAxis yAxisId="left" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" domain={[0, 60]} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Rajdhani" }} />
            <Bar yAxisId="left" dataKey="co2" name="CO₂ (MT)" fill="hsl(0 70% 50% / 0.7)" radius={[3, 3, 0, 0]} animationDuration={1500} />
            <Bar yAxisId="right" dataKey="renewables" name="Renewables %" fill="hsl(165 80% 45% / 0.7)" radius={[3, 3, 0, 0]} animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Climate Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-4"
      >
        <h3 className="font-display text-[10px] tracking-widest text-accent mb-4">
          TEMPERATURE PROJECTIONS BY SCENARIO (°C)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 20% 18%)" />
            <XAxis dataKey="year" stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" />
            <YAxis stroke="hsl(200 10% 55%)" fontSize={10} fontFamily="Space Mono" domain={[0, 5]} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Rajdhani" }} />
            <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke="hsl(165 80% 45%)" strokeWidth={2} dot={{ r: 3 }} animationDuration={2000} />
            <Line type="monotone" dataKey="baseline" name="Baseline" stroke="hsl(38 90% 55%)" strokeWidth={2} dot={{ r: 3 }} animationDuration={2000} />
            <Line type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="hsl(0 70% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} animationDuration={2000} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

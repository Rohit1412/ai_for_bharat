import { motion } from "framer-motion";
import { BarChart3, Globe2, Clock } from "lucide-react";
import { useState } from "react";

const scenarios = [
  { name: "Business As Usual", temp2050: "+2.7°C", probability: "78%", color: "text-glow-danger" },
  { name: "Paris Agreement Path", temp2050: "+1.8°C", probability: "34%", color: "text-glow-warning" },
  { name: "Aggressive Action", temp2050: "+1.4°C", probability: "12%", color: "text-primary" },
  { name: "AI-Optimized Path", temp2050: "+1.5°C", probability: "52%", color: "text-accent" },
];

export default function ScenarioPanel() {
  const [selected, setSelected] = useState(3);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-accent" />
        <h3 className="font-display text-xs tracking-widest text-accent">SCENARIOS</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      {scenarios.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => setSelected(i)}
          className={`glass-panel p-3 cursor-pointer transition-all ${
            selected === i ? "border-accent/50 bg-accent/5" : "hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{s.name}</span>
            <span className={`text-sm font-display font-bold ${s.color}`}>{s.temp2050}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Globe2 className="w-3 h-3" /> Probability: {s.probability}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" /> Horizon: 2050
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

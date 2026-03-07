import { motion } from "framer-motion";
import { Leaf, Factory, Zap, TreePine, Waves, Building } from "lucide-react";

const plans = [
  { icon: Zap, title: "Renewable Grid Transition", region: "EU + North America", progress: 64, target: "2028", impact: "-2.1 GT CO₂/yr" },
  { icon: TreePine, title: "Global Reforestation", region: "Amazon + Congo Basin", progress: 38, target: "2030", impact: "-1.4 GT CO₂/yr" },
  { icon: Factory, title: "Industrial Decarbonization", region: "China + India", progress: 22, target: "2032", impact: "-3.8 GT CO₂/yr" },
  { icon: Waves, title: "Ocean Carbon Capture", region: "Pacific + Atlantic", progress: 11, target: "2035", impact: "-0.9 GT CO₂/yr" },
  { icon: Building, title: "Smart Cities Initiative", region: "Global (Top 200 Cities)", progress: 45, target: "2029", impact: "-1.2 GT CO₂/yr" },
];

export default function ActionPlansPanel() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="w-4 h-4 text-primary" />
        <h3 className="font-display text-xs tracking-widest text-primary">ACTION PLANS</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      {plans.map((plan, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-panel p-3 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <plan.icon className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-semibold text-foreground">{plan.title}</span>
            </div>
            <span className="text-[10px] font-mono text-primary">{plan.target}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">{plan.region} · Impact: {plan.impact}</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${plan.progress}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, hsl(165 80% 45%), hsl(190 90% 50%))`,
              }}
            />
          </div>
          <div className="text-right text-[10px] font-mono text-muted-foreground mt-1">{plan.progress}%</div>
        </motion.div>
      ))}
    </div>
  );
}

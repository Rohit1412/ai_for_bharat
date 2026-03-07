import { motion } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, Target, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { queryGemini } from "@/lib/gemini";

const staticInsights = [
  {
    icon: AlertTriangle,
    type: "ALERT",
    title: "Arctic Ice Anomaly Detected",
    body: "AI models project 23% faster melt rate in Q3 2026. Recommend immediate stakeholder briefing for Nordic nations.",
    priority: "critical" as const,
  },
  {
    icon: Target,
    type: "ACTION",
    title: "Optimal Solar Farm Locations",
    body: "Analysis of 14,000 sites identifies 340 high-yield locations across Sub-Saharan Africa with 94% ROI confidence.",
    priority: "high" as const,
  },
  {
    icon: Sparkles,
    type: "INSIGHT",
    title: "Carbon Capture Breakthrough",
    body: "New DAC technology reduces cost by 40%. AI recommends fast-tracking deployment in 12 industrial zones.",
    priority: "medium" as const,
  },
];

const priorityStyles = {
  critical: "border-l-glow-danger text-glow-danger",
  high: "border-l-glow-warning text-glow-warning",
  medium: "border-l-primary text-primary",
};

export default function AIInsightsPanel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const generateInsight = async () => {
    setAiLoading(true);
    try {
      const result = await queryGemini(
        "You are a climate AI. Generate one new urgent climate insight in 2-3 sentences. Be specific with data points and regions. Focus on actionable intelligence."
      );
      setAiInsight(result);
    } catch {
      setAiInsight("Failed to generate insight.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="font-display text-xs tracking-widest text-primary">AI INSIGHTS</h3>
        <div className="flex-1 h-px bg-border" />
        <button onClick={generateInsight} disabled={aiLoading} className="p-1 hover:bg-muted/30 rounded transition-colors">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin text-accent" /> : <RefreshCw className="w-3 h-3 text-accent" />}
        </button>
        <span className="text-[10px] font-mono text-muted-foreground animate-pulse">AI LIVE</span>
      </div>

      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 border-l-2 border-l-accent bg-accent/5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-display tracking-wider text-accent">GEMINI AI — LIVE</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{aiInsight}</p>
        </motion.div>
      )}

      {staticInsights.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => setActiveIndex(activeIndex === i ? null : i)}
          className={`glass-panel p-3 border-l-2 cursor-pointer transition-all hover:bg-muted/30 ${
            priorityStyles[item.priority]
          } ${activeIndex === i ? "bg-muted/20" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-display tracking-wider">{item.type}</span>
          </div>
          <div className="text-sm font-semibold text-foreground">{item.title}</div>
          {activeIndex === i && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-muted-foreground mt-2 leading-relaxed"
            >
              {item.body}
            </motion.p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Loader2, Zap, Plus, X, Sparkles, ShieldCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const GOAL_PRESETS = [
  "Net zero emissions by 2050",
  "1.5°C temperature limit compliance",
  "50% emissions reduction by 2030",
  "100% renewable energy by 2040",
  "Carbon negative by 2060",
];

const CONSTRAINT_PRESETS = [
  "GDP growth must remain above 2%",
  "Annual budget cap: $500B globally",
  "No nuclear energy expansion",
  "Protect existing employment levels",
  "Developing nations exempted first 5 years",
  "Technology readiness level ≥ 7 required",
];

const SECTORS = ["Energy", "Transportation", "Industry", "Agriculture", "Forestry", "Carbon Removal"];

export default function StrategyGenerator() {
  const [goals, setGoals] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [customConstraint, setCustomConstraint] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>(SECTORS);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSector = (s: string) => {
    setSelectedSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addGoal = (g: string) => { if (!goals.includes(g)) setGoals((prev) => [...prev, g]); };
  const addConstraint = (c: string) => { if (!constraints.includes(c)) setConstraints((prev) => [...prev, c]); };

  const addCustomGoal = () => {
    if (customGoal.trim()) { addGoal(customGoal.trim()); setCustomGoal(""); }
  };
  const addCustomConstraint = () => {
    if (customConstraint.trim()) { addConstraint(customConstraint.trim()); setCustomConstraint(""); }
  };

  const generatePlan = async () => {
    if (goals.length === 0 || loading) return;
    setLoading(true);
    setActionPlan("");

    const prompt = `You are a climate strategy optimizer. Generate a comprehensive, ranked Action Plan.

**Climate Goals:**
${goals.map((g) => `- ${g}`).join("\n")}

**Constraints:**
${constraints.length > 0 ? constraints.map((c) => `- ${c}`).join("\n") : "- No specific constraints"}

**Sectors to optimize across:**
${selectedSectors.join(", ")}

Provide a structured Action Plan including:
1. **Executive Summary** — Overall strategy direction and key priorities
2. **Ranked Interventions** — Ordered by impact-to-cost ratio. For each:
   - Quantified impact estimate (GtCO₂e reduction)
   - Implementation timeline (start date, milestones, completion)
   - Cost estimate and ROI
   - Political feasibility score (1-10)
   - Technical readiness level (1-9)
3. **Cross-Sector Synergies** — How actions in one sector amplify another
4. **Trade-Off Analysis** — Key trade-offs and how the plan handles them
5. **Risk Assessment** — Implementation risks and mitigation strategies
6. **Monitoring Framework** — KPIs and checkpoints for measuring progress

Use tables for the ranked interventions. Provide clear reasoning for each recommendation. Be specific and actionable.`;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/climate-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Strategy generation failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullText += content; setActionPlan(fullText); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (err: any) {
      setActionPlan(`⚠️ ${err.message || "Strategy generation failed."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-primary" />
        <span className="font-display text-sm tracking-widest text-primary">OPTIMAL STRATEGY GENERATION</span>
      </div>

      {/* Goals */}
      <div className="space-y-2">
        <div className="text-xs font-display tracking-wider text-accent">CLIMATE GOALS</div>
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((g) => {
            const active = goals.includes(g);
            return (
              <button
                key={g}
                onClick={() => active ? setGoals((prev) => prev.filter((x) => x !== g)) : addGoal(g)}
                className={`px-3 py-1.5 rounded text-xs border transition-all ${
                  active ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400" : "border-border/50 text-muted-foreground hover:border-emerald-400/30 hover:text-foreground"
                }`}
              >
                {active && "✓ "}{g}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomGoal()}
            placeholder="Add custom goal..."
            maxLength={100}
            className="flex-1 bg-muted/20 border border-border/50 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
          />
          <button onClick={addCustomGoal} disabled={!customGoal.trim()} className="px-3 rounded bg-accent/20 text-accent text-xs disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {goals.filter((g) => !GOAL_PRESETS.includes(g)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {goals.filter((g) => !GOAL_PRESETS.includes(g)).map((g) => (
              <span key={g} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-400/10 border border-emerald-400/30 text-xs text-emerald-400">
                {g} <button onClick={() => setGoals((prev) => prev.filter((x) => x !== g))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <div className="text-xs font-display tracking-wider text-amber-400">CONSTRAINTS</div>
        <div className="flex flex-wrap gap-2">
          {CONSTRAINT_PRESETS.map((c) => {
            const active = constraints.includes(c);
            return (
              <button
                key={c}
                onClick={() => active ? setConstraints((prev) => prev.filter((x) => x !== c)) : addConstraint(c)}
                className={`px-3 py-1.5 rounded text-xs border transition-all ${
                  active ? "border-amber-400/50 bg-amber-400/10 text-amber-400" : "border-border/50 text-muted-foreground hover:border-amber-400/30 hover:text-foreground"
                }`}
              >
                {active && "✓ "}{c}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={customConstraint}
            onChange={(e) => setCustomConstraint(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomConstraint()}
            placeholder="Add custom constraint..."
            maxLength={100}
            className="flex-1 bg-muted/20 border border-border/50 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
          />
          <button onClick={addCustomConstraint} disabled={!customConstraint.trim()} className="px-3 rounded bg-amber-400/20 text-amber-400 text-xs disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sectors */}
      <div className="space-y-2">
        <div className="text-xs font-display tracking-wider text-muted-foreground">OPTIMIZATION SECTORS</div>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSector(s)}
              className={`px-3 py-1.5 rounded text-xs border transition-all ${
                selectedSectors.includes(s) ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={generatePlan}
        disabled={loading || goals.length === 0}
        className="w-full glass-panel p-3.5 flex items-center justify-center gap-2 text-sm font-display tracking-wider text-primary hover:border-primary/50 transition-all disabled:opacity-40"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING STRATEGY...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> GENERATE OPTIMAL ACTION PLAN</>
        )}
      </button>

      {/* Results */}
      <AnimatePresence mode="wait">
        {actionPlan !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-4 max-h-[500px] overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-wider text-primary">ACTION PLAN</span>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
            </div>
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_table]:text-sm text-sm">
              <ReactMarkdown>{actionPlan}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
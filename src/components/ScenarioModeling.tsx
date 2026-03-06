import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker, Plus, X, Play, Loader2, Layers, TrendingDown,
  DollarSign, Leaf, Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Intervention {
  id: string;
  name: string;
  sector: string;
  magnitude: string;
}

const PRESET_INTERVENTIONS: Omit<Intervention, "id">[] = [
  { name: "Carbon tax ($50/ton)", sector: "Economic", magnitude: "High" },
  { name: "50% renewable energy by 2030", sector: "Energy", magnitude: "High" },
  { name: "EV mandate (80% by 2035)", sector: "Transport", magnitude: "Medium" },
  { name: "Reforestation (500M hectares)", sector: "Forestry", magnitude: "High" },
  { name: "Methane capture in agriculture", sector: "Agriculture", magnitude: "Medium" },
  { name: "Carbon capture & storage scale-up", sector: "Industry", magnitude: "High" },
];

const SECTORS = ["Energy", "Transport", "Industry", "Agriculture", "Forestry", "Economic", "Carbon Removal"];

export default function ScenarioModeling() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSector, setCustomSector] = useState(SECTORS[0]);
  const [customMagnitude, setCustomMagnitude] = useState("Medium");
  const [projection, setProjection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const addPreset = (preset: Omit<Intervention, "id">) => {
    setInterventions((prev) => [...prev, { ...preset, id: `int-${Date.now()}-${Math.random()}` }]);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    setInterventions((prev) => [...prev, { id: `int-${Date.now()}`, name: customName, sector: customSector, magnitude: customMagnitude }]);
    setCustomName("");
    setShowAdd(false);
  };

  const removeIntervention = (id: string) => {
    setInterventions((prev) => prev.filter((i) => i.id !== id));
  };

  const runSimulation = async () => {
    if (interventions.length === 0 || loading) return;
    setLoading(true);
    setProjection("");

    const interventionList = interventions
      .map((i) => `- ${i.name} (Sector: ${i.sector}, Magnitude: ${i.magnitude})`)
      .join("\n");

    const prompt = `You are a climate scenario modeler. Simulate the combined impact of these proposed interventions:

${interventionList}

${scenarioName ? `Scenario name: "${scenarioName}"` : ""}

Provide a structured projection report including:
1. **Temperature Impact** — Projected temperature change reduction by 2030, 2040, 2050 (with uncertainty ranges ±)
2. **Emission Reductions** — Estimated GtCO₂e reduction per intervention and combined total
3. **Economic Analysis** — Implementation costs, GDP impact, job creation/loss
4. **Co-Benefits** — Air quality, biodiversity, public health improvements
5. **Interaction Effects** — How these interventions amplify or conflict with each other
6. **Confidence Assessment** — Overall confidence level and key uncertainties

Use tables where helpful. Provide uncertainty ranges for all projections. Be data-driven.`;

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

      if (!resp.ok || !resp.body) throw new Error("Simulation failed");

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
            if (content) { fullText += content; setProjection(fullText); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (err: any) {
      setProjection(`⚠️ ${err.message || "Simulation failed."}`);
    } finally {
      setLoading(false);
    }
  };

  const sectorColor: Record<string, string> = {
    Energy: "text-amber-400", Transport: "text-blue-400", Industry: "text-muted-foreground",
    Agriculture: "text-emerald-400", Forestry: "text-green-400", Economic: "text-purple-400",
    "Carbon Removal": "text-cyan-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Beaker className="w-5 h-5 text-accent" />
        <span className="font-display text-sm tracking-widest text-accent">CLIMATE SCENARIO MODELING</span>
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {interventions.length} interventions selected
        </span>
      </div>

      {/* Scenario Name */}
      <input
        type="text"
        value={scenarioName}
        onChange={(e) => setScenarioName(e.target.value)}
        placeholder="Name your scenario (e.g. 'Net Zero 2050 Pathway')"
        maxLength={60}
        className="w-full bg-muted/20 border border-border/50 rounded px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
      />

      {/* Preset Interventions */}
      <div>
        <div className="text-xs font-display tracking-wider text-muted-foreground mb-2">QUICK ADD INTERVENTIONS</div>
        <div className="flex flex-wrap gap-2">
          {PRESET_INTERVENTIONS.map((p) => {
            const alreadyAdded = interventions.some((i) => i.name === p.name);
            return (
              <button
                key={p.name}
                onClick={() => !alreadyAdded && addPreset(p)}
                disabled={alreadyAdded}
                className={`px-3 py-1.5 rounded text-xs border transition-all ${
                  alreadyAdded
                    ? "border-accent/30 bg-accent/10 text-accent cursor-default"
                    : "border-border/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                }`}
              >
                <span className={sectorColor[p.sector] || ""}>{p.sector}</span> · {p.name}
              </button>
            );
          })}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded text-xs border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Custom
          </button>
        </div>
      </div>

      {/* Custom Intervention Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-display tracking-widest text-primary">CUSTOM INTERVENTION</span>
              <button onClick={() => setShowAdd(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Describe the intervention..."
              maxLength={100}
              className="w-full bg-muted/30 border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <div className="flex gap-2">
              <select
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value)}
                className="bg-muted/30 border border-border/50 rounded px-3 py-2 text-xs text-foreground focus:outline-none"
              >
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={customMagnitude}
                onChange={(e) => setCustomMagnitude(e.target.value)}
                className="bg-muted/30 border border-border/50 rounded px-3 py-2 text-xs text-foreground focus:outline-none"
              >
                {["Low", "Medium", "High"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                onClick={addCustom}
                disabled={!customName.trim()}
                className="px-4 py-2 rounded bg-primary/20 text-primary text-xs font-display tracking-wider hover:bg-primary/30 disabled:opacity-40"
              >
                ADD
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Interventions */}
      {interventions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-display tracking-wider text-muted-foreground">ACTIVE INTERVENTIONS</div>
          <div className="flex flex-wrap gap-2">
            {interventions.map((int) => (
              <motion.div
                key={int.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent/10 border border-accent/30 text-xs"
              >
                <Layers className="w-3 h-3 text-accent" />
                <span className="text-foreground">{int.name}</span>
                <span className={`text-[10px] ${sectorColor[int.sector] || "text-muted-foreground"}`}>({int.sector})</span>
                <button onClick={() => removeIntervention(int.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Run Simulation */}
          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full glass-panel p-3 flex items-center justify-center gap-2 text-sm font-display tracking-wider text-accent hover:border-accent/50 transition-all disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> SIMULATING...</>
            ) : (
              <><Play className="w-4 h-4" /> RUN SCENARIO SIMULATION</>
            )}
          </button>
        </div>
      )}

      {/* Projection Results */}
      <AnimatePresence mode="wait">
        {projection !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-4 max-h-[500px] overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-display text-xs tracking-wider text-accent">
                PROJECTION: {scenarioName || "Unnamed Scenario"}
              </span>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-accent ml-auto" />}
            </div>
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_table]:text-sm text-sm">
              <ReactMarkdown>{projection}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
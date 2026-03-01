import { useState, useMemo } from "react";
import { Brain, Sparkles, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Loader2, RotateCcw, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClimateScenario, type ScenarioResult, type ClimateBaseline } from "@/hooks/useClimateScenario";
import { useCO2Levels, useMethaneLevels, useTemperatureAnomaly } from "@/hooks/useGlobalWarming";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const presets = [
  { label: "Global Carbon Tax ($150/ton)", prompt: "Implement a global carbon tax of $150 per ton of CO₂, applied across all sectors including energy, transport, and industry, starting 2027." },
  { label: "100% Renewable Energy by 2040", prompt: "All nations transition to 100% renewable energy for electricity generation by 2040, phasing out coal by 2030 and natural gas by 2038." },
  { label: "Massive Reforestation", prompt: "Global reforestation initiative planting 1 trillion trees over 10 years, restoring 350 million hectares of degraded forest land." },
  { label: "Methane Elimination Pledge", prompt: "All major economies eliminate 80% of methane emissions from agriculture and fossil fuels by 2035 through technology mandates and regulation." },
];

const confidenceColors = { high: "text-success", medium: "text-warning", low: "text-destructive" };
const magnitudeStyles = { high: "bg-destructive/15 text-destructive", medium: "bg-warning/15 text-warning", low: "bg-info/15 text-info" };

const ScenarioModeling = () => {
  const [prompt, setPrompt] = useState("");
  const [interventions, setInterventions] = useState<string[]>([]);
  const { result, isLoading, error, runScenario, reset } = useClimateScenario();
  const { toast } = useToast();

  // Pull live baseline data from free APIs
  const { data: co2Data } = useCO2Levels();
  const { data: methaneData } = useMethaneLevels();
  const { data: tempData } = useTemperatureAnomaly();

  const liveBaseline = useMemo<Partial<ClimateBaseline>>(() => {
    const baseline: Partial<ClimateBaseline> = {};
    if (co2Data?.length) {
      const last = co2Data[co2Data.length - 1];
      const val = parseFloat(last.trend) || parseFloat(last.cycle);
      if (val) baseline.co2_ppm = val;
    }
    if (methaneData?.length) {
      const last = methaneData[methaneData.length - 1];
      const val = parseFloat(last.average);
      if (val) baseline.methane_ppb = val;
    }
    if (tempData?.length) {
      const last = tempData[tempData.length - 1];
      const val = parseFloat(last.station) || parseFloat(last.land);
      if (val) baseline.temp_anomaly_c = val;
    }
    return baseline;
  }, [co2Data, methaneData, tempData]);

  const combinedPrompt = useMemo(() => {
    if (interventions.length === 0) return prompt;
    const all = [...interventions, ...(prompt.trim() ? [prompt] : [])];
    return `Combined multi-intervention scenario with ${all.length} simultaneous policies:\n${all.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nAnalyze these interventions TOGETHER, including interaction effects between them.`;
  }, [interventions, prompt]);

  const handleRun = async () => {
    if (!combinedPrompt.trim()) return;
    await runScenario(combinedPrompt, liveBaseline);
  };

  const handlePreset = (p: string) => {
    setPrompt(p);
  };

  const addIntervention = () => {
    if (!prompt.trim()) return;
    setInterventions([...interventions, prompt.trim()]);
    setPrompt("");
  };

  const removeIntervention = (idx: number) => {
    setInterventions(interventions.filter((_, i) => i !== idx));
  };

  const handleReset = () => {
    reset();
    setPrompt("");
    setInterventions([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> AI Scenario Modeling
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Model climate interventions and project their 30-year impact</p>
      </div>

      {/* Input Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="w-4 h-4 text-primary" /> Describe your intervention scenario
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., What if all nations implement a $200/ton carbon tax and invest 2% GDP in renewable energy research?"
          className="min-h-[100px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
        />
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Multi-intervention composer */}
        {interventions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Stacked Interventions ({interventions.length}):</p>
            <div className="flex flex-wrap gap-2">
              {interventions.map((inv, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                  <span className="font-medium">{i + 1}.</span> {inv.length > 60 ? inv.slice(0, 60) + "…" : inv}
                  <button onClick={() => removeIntervention(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addIntervention} disabled={!prompt.trim()} className="gap-2" size="sm">
            <Plus className="w-3.5 h-3.5" /> Add to Stack
          </Button>
          <span className="text-xs text-muted-foreground self-center">Add multiple interventions to model them together</span>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={isLoading || (!prompt.trim() && interventions.length === 0)} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {isLoading ? "Analyzing..." : "Run Scenario"}
          </Button>
          {result && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="glass-card rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">AI is modeling your scenario across 30 years of climate projections...</p>
        </div>
      )}

      {/* Results */}
      {result && <ScenarioResults data={result} />}
    </div>
  );
};

const ScenarioResults = ({ data }: { data: ScenarioResult }) => {
  const chartData = data.projections.map((p, i) => ({
    year: p.year,
    "CO₂ (Intervention)": p.co2_ppm,
    "CO₂ (Baseline)": data.baseline_projections[i]?.co2_ppm,
    "Temp (Intervention)": p.temp_anomaly_c,
    "Temp (Baseline)": data.baseline_projections[i]?.temp_anomaly_c,
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary */}
      <div className="glass-card rounded-xl p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{data.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{data.summary}</p>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${confidenceColors[data.confidence]}`}>
            <CheckCircle2 className="w-3.5 h-3.5" /> {data.confidence} confidence
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">CO₂ Concentration (ppm)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Legend />
              <Line type="monotone" dataKey="CO₂ (Baseline)" stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="CO₂ (Intervention)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Temperature Anomaly (°C)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Legend />
              <Line type="monotone" dataKey="Temp (Baseline)" stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Temp (Intervention)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Impacts */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Key Impacts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.key_impacts.map((impact, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{impact.area}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${magnitudeStyles[impact.magnitude]}`}>{impact.magnitude}</span>
              </div>
              <p className="text-xs text-muted-foreground">{impact.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Analysis + Uncertainty + Feasibility */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.economic_analysis && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Economic Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Cost (30yr)</span><span className="font-mono text-foreground">${data.economic_analysis.estimated_cost_trillion_usd}T</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">GDP Impact</span><span className={`font-mono ${data.economic_analysis.gdp_impact_percent < 0 ? "text-destructive" : "text-success"}`}>{data.economic_analysis.gdp_impact_percent > 0 ? "+" : ""}{data.economic_analysis.gdp_impact_percent}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Jobs Impact</span><span className={`font-mono ${data.economic_analysis.jobs_created_millions >= 0 ? "text-success" : "text-destructive"}`}>{data.economic_analysis.jobs_created_millions > 0 ? "+" : ""}{data.economic_analysis.jobs_created_millions}M</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Annual Investment</span><span className="font-mono text-foreground">${data.economic_analysis.investment_needed_billion_usd_per_year}B/yr</span></div>
            </div>
          </div>
        )}

        {data.uncertainty_ranges && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Uncertainty Ranges (2056)</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Temperature Anomaly</p>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-success">{data.uncertainty_ranges.temp_low_c}°C</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-success via-warning to-destructive" style={{ width: "100%" }} />
                  </div>
                  <span className="text-destructive">{data.uncertainty_ranges.temp_high_c}°C</span>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1">Mid: {data.uncertainty_ranges.temp_mid_c}°C</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CO₂ Concentration</p>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-success">{data.uncertainty_ranges.co2_low_ppm}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-success via-warning to-destructive" style={{ width: "100%" }} />
                  </div>
                  <span className="text-destructive">{data.uncertainty_ranges.co2_high_ppm}</span>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1">Mid: {data.uncertainty_ranges.co2_mid_ppm} ppm</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-6 space-y-4">
          {data.political_feasibility && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Political Feasibility</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${magnitudeStyles[data.political_feasibility]}`}>{data.political_feasibility}</span>
            </div>
          )}
          {data.co_benefits && data.co_benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Co-Benefits</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.co_benefits.map((b, i) => (
                  <span key={i} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{b}</span>
                ))}
              </div>
            </div>
          )}
          {data.interaction_effects && data.interaction_effects !== "N/A" && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Interaction Effects</h3>
              <p className="text-xs text-muted-foreground">{data.interaction_effects}</p>
            </div>
          )}
        </div>
      </div>

      {/* Trade-Off Comparison */}
      {data.projections.length > 0 && data.baseline_projections.length > 0 && (() => {
        const lastIdx = data.projections.length - 1;
        const interv = data.projections[lastIdx];
        const base = data.baseline_projections[lastIdx];
        if (!interv || !base) return null;
        const rows = [
          { metric: "CO₂ (ppm)", baseline: base.co2_ppm, intervention: interv.co2_ppm, lower: true },
          { metric: "Temp Anomaly (°C)", baseline: base.temp_anomaly_c, intervention: interv.temp_anomaly_c, lower: true },
          { metric: "Sea Level (mm/yr)", baseline: base.sea_level_rise_mm_yr, intervention: interv.sea_level_rise_mm_yr, lower: true },
          { metric: "Methane (ppb)", baseline: base.methane_ppb, intervention: interv.methane_ppb, lower: true },
        ];
        return (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Trade-Off Comparison — Year {interv.year}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-2 font-medium">Metric</th>
                    <th className="text-right p-2 font-medium">Baseline (No Action)</th>
                    <th className="text-right p-2 font-medium">With Intervention</th>
                    <th className="text-right p-2 font-medium">Difference</th>
                    <th className="text-center p-2 font-medium">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map(r => {
                    const diff = r.intervention - r.baseline;
                    const better = r.lower ? diff < 0 : diff > 0;
                    return (
                      <tr key={r.metric}>
                        <td className="p-2 text-foreground font-medium">{r.metric}</td>
                        <td className="p-2 text-right font-mono text-muted-foreground">{r.baseline.toFixed(1)}</td>
                        <td className="p-2 text-right font-mono text-foreground">{r.intervention.toFixed(1)}</td>
                        <td className={`p-2 text-right font-mono ${better ? "text-success" : "text-destructive"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${better ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {better ? "Improved" : "Worsened"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Recommendations */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Recommendations</h3>
        <div className="space-y-2">
          {data.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-medium mt-0.5">{i + 1}</span>
              <p className="text-muted-foreground">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioModeling;

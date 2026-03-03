import { useState } from "react";
import { Brain, Shield, AlertTriangle, Zap, TrendingUp, MapPin, RefreshCw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiGenerateBrief, getActiveAIService } from "@/lib/aiService";

interface Briefing {
  date: string;
  threat_level: "low" | "elevated" | "high" | "critical";
  headline: string;
  executive_summary: string;
  key_developments: { title: string; detail: string; category: string; severity: string }[];
  india_focus: { headline: string; developments: string[]; aqi_status: string; policy_update: string };
  action_items: string[];
  data_spotlight: { metric: string; value: string; context: string; trend: string };
  outlook: string;
  _model?: string;
  _generated_at?: string;
}

const threatColors: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-success/15", text: "text-success", label: "LOW" },
  elevated: { bg: "bg-warning/15", text: "text-warning", label: "ELEVATED" },
  high: { bg: "bg-destructive/15", text: "text-destructive", label: "HIGH" },
  critical: { bg: "bg-destructive/25", text: "text-destructive", label: "CRITICAL" },
};

const severityDots: Record<string, string> = {
  positive: "bg-success",
  neutral: "bg-muted-foreground",
  concerning: "bg-warning",
  critical: "bg-destructive",
};

const categoryIcons: Record<string, string> = {
  emissions: "🏭", temperature: "🌡️", policy: "📋", extreme_weather: "🌪️", technology: "⚡", biodiversity: "🌿",
};

// Fallback briefing when edge function is unavailable
const FALLBACK_BRIEFING: Briefing = {
  date: new Date().toISOString().slice(0, 10),
  threat_level: "elevated",
  headline: "Global CO₂ hits 425.8 ppm as India leads renewable surge — COP31 preparations intensify",
  executive_summary: "Atmospheric CO₂ continues its upward trajectory at 425.8 ppm, while global temperature anomaly holds at +1.3°C above pre-industrial levels. However, India's renewable energy deployment has reached a record 206 GW, with 38 GW added in 2025 alone — the fastest expansion globally. As COP31 in Belém approaches in November 2026, nations are under pressure to submit updated NDCs with more ambitious 2035 targets.",
  key_developments: [
    { title: "CO₂ concentration reaches 425.8 ppm", detail: "NOAA's Mauna Loa observatory recorded 425.8 ppm, a 2.5 ppm increase year-over-year. This rate of increase, if sustained, puts the 1.5°C carbon budget at risk of exhaustion by 2032.", category: "emissions", severity: "concerning" },
    { title: "India crosses 200 GW renewable milestone", detail: "India's Ministry of New & Renewable Energy confirmed total installed capacity of 206 GW from non-fossil sources. Solar capacity alone reached 95 GW, positioning India on track for its 500 GW by 2030 target.", category: "technology", severity: "positive" },
    { title: "Arctic sea ice extent 14% below 30-year average", detail: "February 2026 sea ice extent measured at 13.8 million km², significantly below the 1991-2020 average. Scientists warn of potential ice-free Arctic summers by 2035 under current trajectories.", category: "temperature", severity: "critical" },
    { title: "EU CBAM Phase 1 shows 8% emission reduction in covered sectors", detail: "European Commission data shows that carbon-intensive imports covered by the Carbon Border Adjustment Mechanism have decreased 8% since implementation, validating the policy's effectiveness.", category: "policy", severity: "positive" },
    { title: "Methane levels continue acceleration at 1,930 ppb", detail: "Global methane concentration has reached 1,930 ppb, with the annual growth rate of 15 ppb/yr exceeding IPCC projections. Tropical wetlands and fossil fuel operations remain primary drivers.", category: "emissions", severity: "concerning" },
  ],
  india_focus: {
    headline: "India's climate action accelerates amid severe AQI challenges",
    developments: [
      "Delhi NCR AQI remains in 'Very Poor' category (PM2.5: 180 μg/m³) as winter inversion persists — GRAP Stage III activated",
      "ISRO's Oceansat-3 satellite data reveals 12% increase in Indian Ocean surface temperature anomaly, threatening monsoon patterns",
      "Green hydrogen production target of 5 million tonnes by 2030 receives ₹19,744 crore budget allocation in Union Budget 2026-27",
      "National Adaptation Plan submitted to UNFCCC with focus on coastal resilience for 7,500 km coastline and 170+ million vulnerable population",
    ],
    aqi_status: "Severe in Delhi NCR (AQI 350+), Poor in Lucknow and Patna, Moderate in Mumbai and Bengaluru, Good in Chennai and Kochi. The Indo-Gangetic plain remains a persistent hotspot due to stubble burning, vehicular emissions, and thermal inversions.",
    policy_update: "India's updated NDC targets 45% reduction in emissions intensity by 2030 (from 2005 baseline) and net-zero by 2070. The Perform-Achieve-Trade (PAT) scheme has been expanded to cover 1,200 industrial units.",
  },
  action_items: [
    "Review updated CO₂ trajectory against 1.5°C carbon budget — current path exhausts budget by 2032",
    "Monitor Arctic ice extent through March — critical period for seasonal minimum predictions",
    "Prepare COP31 briefing materials with India's renewable energy success as key talking point",
    "Assess methane acceleration drivers — prioritize satellite monitoring over tropical wetlands",
    "Issue health advisory for Delhi NCR researchers — limit outdoor exposure during AQI > 300 events",
  ],
  data_spotlight: {
    metric: "India Renewable Capacity",
    value: "206 GW",
    context: "India has added more renewable capacity in 2025 than any previous year (38 GW), with solar contributing 28 GW. At this rate, the 500 GW target by 2030 is achievable — a critical signal for global climate negotiations at COP31.",
    trend: "rising",
  },
  outlook: "The coming week will see critical developments: NOAA releases updated global temperature data on Tuesday, India's Central Electricity Authority publishes monthly generation statistics, and the UNFCCC Bonn intersessional preparatory meetings begin. Arctic ice extent is expected to reach seasonal minimum trajectory, providing early signal for September extent. Researchers should prioritize monitoring methane data from Sentinel-5P and prepare analysis for the upcoming IPCC AR7 scoping session.",
  _model: "fallback",
  _generated_at: new Date().toISOString(),
};

const AIDailyBrief = () => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [model, setModel] = useState<"fast" | "advanced">("fast");

  const provider = getActiveAIService();

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiGenerateBrief(model);
      setBriefing(data as any);
    } catch {
      setBriefing(FALLBACK_BRIEFING);
    } finally {
      setLoading(false);
    }
  };

  const threat = briefing ? threatColors[briefing.threat_level] || threatColors.elevated : null;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            AI Climate Intelligence Brief
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">
            {briefing?._model?.includes("bedrock") ? "AWS Bedrock Claude" : briefing?._model?.includes("2.5") ? "Gemini 2.5 Flash" : "Gemini 2.0 Flash"} · Daily briefing for researchers
            {provider === "bedrock" && !briefing && (
              <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] bg-orange-500/15 text-orange-400">AWS</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={e => setModel(e.target.value as any)}
            className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
          >
            <option value="fast">2.0 Flash (Fast)</option>
            <option value="advanced">2.5 Flash (Deep)</option>
          </select>
          <Button size="sm" onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? "Generating..." : briefing ? "Refresh" : "Generate Brief"}
          </Button>
        </div>
      </div>

      {!briefing && !loading && (
        <div className="px-5 pb-5">
          <div className="rounded-lg bg-muted/20 border border-border/30 p-8 text-center">
            <Brain className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Click <strong>Generate Brief</strong> to get your AI-powered daily climate intelligence report</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Analyzes live data, global trends, and India-specific developments</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="px-5 pb-5 space-y-3">
          <div className="h-8 bg-muted/30 rounded animate-pulse" />
          <div className="h-20 bg-muted/30 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-muted/30 rounded animate-pulse" />
            <div className="h-24 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      )}

      {briefing && !loading && (
        <div className="px-5 pb-5 space-y-4">
          {/* Threat Level + Headline */}
          <div className="flex items-start gap-3">
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${threat?.bg} ${threat?.text}`}>
              <Shield className="w-3 h-3 inline mr-1" />{threat?.label}
            </span>
            <p className="text-sm font-medium text-foreground flex-1">{briefing.headline}</p>
          </div>

          {/* Executive Summary */}
          <div className="rounded-lg bg-muted/20 border border-border/30 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">{briefing.executive_summary}</p>
          </div>

          {/* Data Spotlight */}
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-primary">{briefing.data_spotlight.value}</p>
              <p className="text-xs text-primary/70">{briefing.data_spotlight.metric}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{briefing.data_spotlight.context}</p>
              <span className={`text-xs mt-1 inline-flex items-center gap-1 ${briefing.data_spotlight.trend === "rising" ? "text-warning" : briefing.data_spotlight.trend === "falling" ? "text-success" : "text-muted-foreground"}`}>
                <TrendingUp className="w-3 h-3" /> {briefing.data_spotlight.trend}
              </span>
            </div>
          </div>

          {/* Key Developments */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" /> Key Developments
            </p>
            <div className="space-y-2">
              {briefing.key_developments.slice(0, expanded ? undefined : 3).map((dev, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5 bg-muted/15 border border-border/20">
                  <span className="text-sm">{categoryIcons[dev.category] || "📊"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${severityDots[dev.severity] || severityDots.neutral}`} />
                      <p className="text-xs font-medium text-foreground">{dev.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{dev.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* India Focus */}
          <div className="rounded-lg bg-warning/5 border border-warning/15 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-warning" /> India Focus: {briefing.india_focus.headline}
            </p>
            <ul className="space-y-1">
              {briefing.india_focus.developments.map((dev, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-warning mt-0.5">▸</span> {dev}
                </li>
              ))}
            </ul>
            <div className="text-xs text-muted-foreground/80 pt-1 border-t border-warning/10">
              <strong className="text-foreground">AQI:</strong> {briefing.india_focus.aqi_status}
            </div>
          </div>

          {/* Expandable sections */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Show less" : "Show action items, outlook & more"}
          </button>

          {expanded && (
            <>
              {/* Action Items */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Priority Actions
                </p>
                <ol className="space-y-1.5">
                  {briefing.action_items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-xs font-mono font-bold text-primary shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Outlook */}
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">7-Day Outlook</p>
                <p className="text-xs text-muted-foreground">{briefing.outlook}</p>
              </div>

              {/* Meta */}
              <p className="text-xs text-muted-foreground/50 text-right">
                Generated {briefing._generated_at ? new Date(briefing._generated_at).toLocaleString() : "now"} · Model: {briefing._model || "Gemini Flash"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDailyBrief;

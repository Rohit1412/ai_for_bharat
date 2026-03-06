import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Users, Building2, FlaskConical, Globe, TrendingUp, TrendingDown,
  Minus, Loader2, AlertTriangle, Lightbulb, RefreshCw, ChevronDown, ChevronUp,
  DollarSign, Zap, MapPin, Star, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KeyPlayer {
  name: string;
  role: string;
  influence: number;
  region: string;
  recentAction: string;
}

interface Initiative {
  title: string;
  status: "Active" | "Proposed" | "Completed";
  impact: string;
}

interface StakeholderCategory {
  name: string;
  totalEntities: number;
  activeEntities: number;
  engagementScore: number;
  fundingBillions: number;
  trend: "rising" | "stable" | "declining";
  keyPlayers: KeyPlayer[];
  recentInitiatives: Initiative[];
}

interface CollabOpportunity {
  title: string;
  parties: string[];
  potential: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
}

interface StrategyRec {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  category: string;
}

interface RiskFactor {
  risk: string;
  mitigation: string;
  severity: "Low" | "Medium" | "High";
}

interface NetworkData {
  categories: StakeholderCategory[];
  globalInsight: string;
  collaborationOpportunities: CollabOpportunity[];
}

interface StrategyData {
  recommendations: StrategyRec[];
  riskFactors: RiskFactor[];
  summary: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Governments": Building2,
  "NGOs": Users,
  "Research Institutions": FlaskConical,
  "Private Sector": Globe,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Governments": "text-accent",
  "NGOs": "text-primary",
  "Research Institutions": "text-glow-warning",
  "Private Sector": "text-foreground",
};

const DEFAULT_NETWORK_DATA: NetworkData = {
  categories: [
    {
      name: "Governments",
      totalEntities: 195,
      activeEntities: 142,
      engagementScore: 68,
      fundingBillions: 312,
      trend: "rising",
      keyPlayers: [
        { name: "European Union", role: "Policy Leader", influence: 92, region: "Europe", recentAction: "Enacted Carbon Border Adjustment Mechanism (CBAM) phase 2" },
        { name: "United States", role: "Major Funder", influence: 88, region: "North America", recentAction: "Expanded IRA clean energy tax credits to $500B" },
        { name: "China", role: "Largest Emitter", influence: 85, region: "East Asia", recentAction: "Pledged carbon neutrality by 2060, launched national ETS expansion" },
        { name: "India", role: "Emerging Leader", influence: 78, region: "South Asia", recentAction: "Announced 500GW renewable energy target by 2030" },
      ],
      recentInitiatives: [
        { title: "Global Methane Pledge 2.0", status: "Active", impact: "Targeting 40% methane reduction by 2030 across 150 nations" },
        { title: "Loss & Damage Fund Operationalization", status: "Active", impact: "$720M mobilized for climate-vulnerable nations" },
        { title: "Just Energy Transition Partnerships", status: "Active", impact: "South Africa, Indonesia, Vietnam receiving $46B combined" },
      ],
    },
    {
      name: "NGOs",
      totalEntities: 4200,
      activeEntities: 2840,
      engagementScore: 74,
      fundingBillions: 28,
      trend: "rising",
      keyPlayers: [
        { name: "World Wildlife Fund", role: "Conservation Leader", influence: 82, region: "Global", recentAction: "Launched Living Planet Report 2026 with 300+ policy recommendations" },
        { name: "Greenpeace International", role: "Advocacy", influence: 76, region: "Global", recentAction: "Led campaign resulting in Arctic drilling moratorium" },
        { name: "Climate Action Network", role: "Coalition Builder", influence: 71, region: "Global", recentAction: "Coordinated 1,900+ orgs for COP31 unified position" },
        { name: "350.org", role: "Grassroots Mobilizer", influence: 65, region: "Global", recentAction: "Organized fossil fuel divestment worth $40T in commitments" },
      ],
      recentInitiatives: [
        { title: "Race to Zero Campaign", status: "Active", impact: "11,000+ non-state actors committed to net-zero" },
        { title: "Global Climate Litigation Database", status: "Active", impact: "Tracking 2,600+ climate lawsuits across 50 jurisdictions" },
        { title: "Youth Climate Fellowship Program", status: "Proposed", impact: "Training 10,000 young climate leaders annually" },
      ],
    },
    {
      name: "Research Institutions",
      totalEntities: 1850,
      activeEntities: 1120,
      engagementScore: 62,
      fundingBillions: 45,
      trend: "stable",
      keyPlayers: [
        { name: "IPCC", role: "Assessment Authority", influence: 95, region: "Global", recentAction: "Released AR7 Synthesis Report on 1.5°C pathway feasibility" },
        { name: "NASA GISS", role: "Climate Monitoring", influence: 88, region: "North America", recentAction: "Confirmed 2025 as warmest year on record with +1.3°C anomaly" },
        { name: "Max Planck Institute", role: "Earth System Modeling", influence: 80, region: "Europe", recentAction: "Published breakthrough ocean heat absorption model" },
        { name: "Tsinghua University", role: "Clean Energy R&D", influence: 75, region: "East Asia", recentAction: "Developed perovskite solar cells with 33% efficiency" },
      ],
      recentInitiatives: [
        { title: "Global Carbon Budget 2026", status: "Active", impact: "Annual accounting of global CO₂ sources and sinks" },
        { title: "CMIP7 Climate Models", status: "Active", impact: "Next-gen climate projections for 2030-2100 scenarios" },
        { title: "Ocean Acidification Monitoring Network", status: "Completed", impact: "800+ monitoring stations across all major ocean basins" },
      ],
    },
    {
      name: "Private Sector",
      totalEntities: 8500,
      activeEntities: 3200,
      engagementScore: 55,
      fundingBillions: 890,
      trend: "rising",
      keyPlayers: [
        { name: "Tesla / BYD", role: "EV & Battery Leaders", influence: 82, region: "Global", recentAction: "Combined EV sales surpassed 25M units globally in 2025" },
        { name: "Ørsted", role: "Offshore Wind Pioneer", influence: 74, region: "Europe", recentAction: "Commissioned world's largest offshore wind farm at 3.6GW" },
        { name: "BlackRock", role: "ESG Investment", influence: 85, region: "North America", recentAction: "Climate-focused AUM exceeded $800B with new transition fund" },
        { name: "Reliance Industries", role: "Green Hydrogen", influence: 70, region: "South Asia", recentAction: "Broke ground on world's largest green hydrogen plant" },
      ],
      recentInitiatives: [
        { title: "Science Based Targets initiative", status: "Active", impact: "4,000+ companies committed to validated emission reduction targets" },
        { title: "First Movers Coalition 2.0", status: "Active", impact: "$12B in purchase commitments for green steel, cement, shipping" },
        { title: "Voluntary Carbon Market Reform", status: "Proposed", impact: "New integrity standards for $50B/yr carbon credit market" },
      ],
    },
  ],
  globalInsight: "Climate stakeholder engagement is at an all-time high with 142 governments actively participating in coordinated climate action. The private sector has emerged as the largest funding source at $890B, though engagement scores lag behind NGOs. Cross-sector collaboration opportunities are expanding, particularly in green hydrogen and carbon capture technologies.",
  collaborationOpportunities: [
    { title: "Green Hydrogen Alliance", parties: ["EU", "India", "Reliance Industries", "Max Planck Institute"], potential: "Joint R&D and deployment of green hydrogen infrastructure across Indo-European corridor", urgency: "High" },
    { title: "Climate Finance Transparency Initiative", parties: ["BlackRock", "UNFCCC", "Climate Action Network"], potential: "Standardized reporting framework for $1.3T in annual climate finance flows", urgency: "Critical" },
    { title: "Pacific Island Resilience Network", parties: ["Australia", "Japan", "WWF", "IPCC"], potential: "Integrated early warning and adaptation system for 22 Pacific island nations", urgency: "High" },
    { title: "Industrial Decarbonization Consortium", parties: ["First Movers Coalition", "Ørsted", "Tsinghua University"], potential: "Accelerate green steel and cement adoption through shared R&D and procurement", urgency: "Medium" },
  ],
};

const trendIcon = (t: string) => {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-primary" />;
  if (t === "declining") return <TrendingDown className="w-3 h-3 text-destructive" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const urgencyColor = (u: string) => {
  if (u === "Critical") return "bg-destructive/20 text-destructive border-destructive/30";
  if (u === "High") return "bg-glow-warning/20 text-glow-warning border-glow-warning/30";
  if (u === "Medium") return "bg-accent/20 text-accent border-accent/30";
  return "bg-muted text-muted-foreground border-border";
};

const statusColor = (s: string) => {
  if (s === "Active") return "bg-primary/20 text-primary";
  if (s === "Proposed") return "bg-accent/20 text-accent";
  return "bg-muted text-muted-foreground";
};

export default function StakeholderNetwork() {
  const [networkData, setNetworkData] = useState<NetworkData>(DEFAULT_NETWORK_DATA);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"default" | "cached" | "ai">("default");

  // Try loading cached AI data on mount — if found, replace defaults
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("stakeholder-analysis", {
          body: { type: "network_overview" },
        });
        if (!error && data?.data && data.cached) {
          setNetworkData(data.data);
          setDataSource("cached");
        }
      } catch {
        // Silently keep default data
      }
    })();
  }, []);

  // Force AI generation
  const generateWithAI = async () => {
    setAiLoading(true);
    setStrategyData(null);
    try {
      const { data, error } = await supabase.functions.invoke("stakeholder-analysis", {
        body: { type: "network_overview", forceRefresh: true },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setNetworkData(data.data);
      setDataSource("ai");
      toast.success("Stakeholder network updated with fresh AI analysis");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate stakeholder data");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchStrategy = async () => {
    if (!networkData) return;
    setStrategyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stakeholder-analysis", {
        body: { type: "strategic_advice", context: networkData },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setStrategyData(data.data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load strategy");
    } finally {
      setStrategyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="font-display text-xs tracking-widest text-primary">GLOBAL STAKEHOLDER INTELLIGENCE</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
            {dataSource === "default" ? "BASELINE DATA" : dataSource === "cached" ? "AI CACHED" : "AI LIVE"}
          </Badge>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Button size="sm" variant="ghost" onClick={generateWithAI} disabled={aiLoading}
          className="text-muted-foreground hover:text-primary">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          {aiLoading ? "Analyzing..." : "Refresh with AI"}
        </Button>
      </div>

      {/* Global Insight Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 border-l-2 border-l-primary">
        <p className="text-sm text-foreground/90 leading-relaxed">{networkData.globalInsight}</p>
      </motion.div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networkData.categories.map((cat, i) => {
          const Icon = CATEGORY_ICONS[cat.name] || Globe;
          const color = CATEGORY_COLORS[cat.name] || "text-foreground";
          const isExpanded = expandedCategory === cat.name;

          return (
            <motion.div key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <h4 className="font-display text-xs tracking-wider text-foreground">{cat.name.toUpperCase()}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {trendIcon(cat.trend)}
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xl font-display font-bold text-foreground">{cat.activeEntities.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">/{cat.totalEntities.toLocaleString()} Active</div>
                  </div>
                  <div>
                    <div className="text-xl font-display font-bold text-primary">{cat.engagementScore}%</div>
                    <div className="text-[10px] text-muted-foreground">Engagement</div>
                  </div>
                  <div>
                    <div className="text-xl font-display font-bold text-accent">${cat.fundingBillions}B</div>
                    <div className="text-[10px] text-muted-foreground">Funding</div>
                  </div>
                </div>

                {/* Engagement bar */}
                <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cat.engagementScore}%` }}
                    transition={{ duration: 1, delay: i * 0.15 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    className="border-t border-border/50">

                    {/* Key Players */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-glow-warning" />
                        <span className="font-display text-[10px] tracking-widest text-muted-foreground">KEY PLAYERS</span>
                      </div>
                      <div className="space-y-2">
                        {cat.keyPlayers.map((p, j) => (
                          <div key={j} className="flex items-start gap-3 p-2 rounded bg-muted/20">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{p.role}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{p.region}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">{p.recentAction}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-display font-bold text-primary">{p.influence}</div>
                              <div className="text-[9px] text-muted-foreground">Influence</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Initiatives */}
                    <div className="px-4 pb-4 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-accent" />
                        <span className="font-display text-[10px] tracking-widest text-muted-foreground">RECENT INITIATIVES</span>
                      </div>
                      {cat.recentInitiatives.map((ini, j) => (
                        <div key={j} className="flex items-center gap-2 p-2 rounded bg-muted/20">
                          <Badge className={`text-[9px] px-1.5 py-0 ${statusColor(ini.status)}`}>{ini.status}</Badge>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-foreground">{ini.title}</span>
                            <p className="text-[10px] text-muted-foreground truncate">{ini.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Collaboration Opportunities */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-glow-warning" />
          <h4 className="font-display text-xs tracking-widest text-glow-warning">COLLABORATION OPPORTUNITIES</h4>
        </div>
        <div className="space-y-2">
          {networkData.collaborationOpportunities.map((opp, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded bg-muted/20 border border-border/30">
              <Badge className={`text-[9px] px-1.5 py-0 shrink-0 mt-0.5 ${urgencyColor(opp.urgency)}`}>{opp.urgency}</Badge>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{opp.title}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {opp.parties.map((p, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground">{p}</span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{opp.potential}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Strategy Section */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4 text-glow-warning" />
          <h4 className="font-display text-xs tracking-widest text-foreground">AI STRATEGIC ADVISOR</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use AI to generate strategic engagement recommendations, identify cross-sector synergies, funding optimizations, and risk factors based on the current stakeholder network data.
        </p>
        <Button onClick={fetchStrategy} disabled={strategyLoading} size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display tracking-wider text-xs">
          {strategyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
          {strategyLoading ? "GENERATING STRATEGIC ANALYSIS..." : "GENERATE AI STRATEGIC RECOMMENDATIONS"}
        </Button>
      </div>

      {/* Strategy Results */}
      <AnimatePresence>
        {strategyData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="space-y-4">

            {/* Summary */}
            <div className="glass-panel p-4 border-l-2 border-l-accent">
              <p className="text-sm text-foreground/90 leading-relaxed">{strategyData.summary}</p>
            </div>

            {/* Recommendations */}
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <h4 className="font-display text-xs tracking-widest text-primary">STRATEGIC RECOMMENDATIONS</h4>
              </div>
              {strategyData.recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[9px] px-1.5 py-0 ${urgencyColor(rec.priority)}`}>{rec.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground">{rec.category}</span>
                  </div>
                  <h5 className="text-sm font-semibold text-foreground">{rec.title}</h5>
                  <p className="text-[11px] text-muted-foreground mt-1">{rec.description}</p>
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="font-display text-xs tracking-widest text-destructive">RISK FACTORS</h4>
              </div>
              {strategyData.riskFactors.map((rf, i) => (
                <div key={i} className="p-3 rounded bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[9px] px-1.5 py-0 ${urgencyColor(rf.severity)}`}>{rf.severity}</Badge>
                  </div>
                  <p className="text-xs text-foreground">{rf.risk}</p>
                  <p className="text-[11px] text-muted-foreground mt-1"><span className="text-primary">Mitigation:</span> {rf.mitigation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

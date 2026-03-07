import { useEffect, useRef, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import { motion, AnimatePresence } from "framer-motion";
import { classifyRisk, type RiskLevel } from "@/services/ai";
import {
  Brain,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
  Target,
  Beaker,
  FileText,
  ChevronRight,
  Shield,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

export interface HotspotData {
  lat: number;
  lng: number;
  label: string;
  temp: number;
  risk: "critical" | "high" | "medium";
  co2: string;
  renewables: string;
  population: string;
  size: number;
  color: string;
}

export const HOTSPOTS: HotspotData[] = [
  {
    lat: 40.7,
    lng: -74,
    label: "New York",
    temp: 2.1,
    risk: "high",
    co2: "412 MT",
    renewables: "28%",
    population: "20.1M",
    size: 0.6,
    color: "#ff8800",
  },
  {
    lat: 51.5,
    lng: -0.1,
    label: "London",
    temp: 1.8,
    risk: "medium",
    co2: "98 MT",
    renewables: "43%",
    population: "9.5M",
    size: 0.5,
    color: "#00cc88",
  },
  {
    lat: 35.7,
    lng: 139.7,
    label: "Tokyo",
    temp: 1.9,
    risk: "high",
    co2: "320 MT",
    renewables: "22%",
    population: "37.4M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: -33.9,
    lng: 18.4,
    label: "Cape Town",
    temp: 2.5,
    risk: "critical",
    co2: "45 MT",
    renewables: "15%",
    population: "4.7M",
    size: 0.5,
    color: "#ff4444",
  },
  {
    lat: 28.6,
    lng: 77.2,
    label: "Delhi",
    temp: 3.1,
    risk: "critical",
    co2: "580 MT",
    renewables: "18%",
    population: "32.9M",
    size: 0.8,
    color: "#ff4444",
  },
  {
    lat: -22.9,
    lng: -43.2,
    label: "Rio de Janeiro",
    temp: 2.3,
    risk: "high",
    co2: "78 MT",
    renewables: "45%",
    population: "13.6M",
    size: 0.5,
    color: "#ff8800",
  },
  {
    lat: 1.3,
    lng: 103.8,
    label: "Singapore",
    temp: 1.7,
    risk: "medium",
    co2: "52 MT",
    renewables: "12%",
    population: "5.9M",
    size: 0.4,
    color: "#00cc88",
  },
  {
    lat: 55.8,
    lng: 37.6,
    label: "Moscow",
    temp: 2.8,
    risk: "high",
    co2: "490 MT",
    renewables: "8%",
    population: "12.6M",
    size: 0.6,
    color: "#ff8800",
  },
  {
    lat: -1.3,
    lng: 36.8,
    label: "Nairobi",
    temp: 2.0,
    risk: "medium",
    co2: "12 MT",
    renewables: "72%",
    population: "5.1M",
    size: 0.4,
    color: "#00cc88",
  },
  {
    lat: 30.0,
    lng: 31.2,
    label: "Cairo",
    temp: 2.9,
    risk: "critical",
    co2: "210 MT",
    renewables: "11%",
    population: "21.3M",
    size: 0.6,
    color: "#ff4444",
  },
  // New Additions:
  {
    lat: 39.9,
    lng: 116.4,
    label: "Beijing",
    temp: 2.4,
    risk: "high",
    co2: "920 MT",
    renewables: "29%",
    population: "21.5M",
    size: 0.9,
    color: "#ff8800",
  },
  {
    lat: -6.2,
    lng: 106.8,
    label: "Jakarta",
    temp: 1.9,
    risk: "critical",
    co2: "192 MT",
    renewables: "14%",
    population: "10.6M",
    size: 0.7,
    color: "#ff4444",
  },
  {
    lat: 48.8,
    lng: 2.3,
    label: "Paris",
    temp: 1.6,
    risk: "medium",
    co2: "42 MT",
    renewables: "25%",
    population: "11.1M",
    size: 0.5,
    color: "#00cc88",
  },
  {
    lat: 19.4,
    lng: -99.1,
    label: "Mexico City",
    temp: 2.2,
    risk: "high",
    co2: "165 MT",
    renewables: "16%",
    population: "22.1M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: -33.8,
    lng: 151.2,
    label: "Sydney",
    temp: 2.1,
    risk: "high",
    co2: "85 MT",
    renewables: "35%",
    population: "5.3M",
    size: 0.5,
    color: "#ff8800",
  },
  {
    lat: 52.5,
    lng: 13.4,
    label: "Berlin",
    temp: 1.5,
    risk: "medium",
    co2: "58 MT",
    renewables: "52%",
    population: "3.7M",
    size: 0.4,
    color: "#00cc88",
  },
  {
    lat: 19.0,
    lng: 72.8,
    label: "Mumbai",
    temp: 2.8,
    risk: "critical",
    co2: "245 MT",
    renewables: "19%",
    population: "21.3M",
    size: 0.8,
    color: "#ff4444",
  },
  {
    lat: 25.2,
    lng: 55.2,
    label: "Dubai",
    temp: 3.2,
    risk: "high",
    co2: "115 MT",
    renewables: "10%",
    population: "3.5M",
    size: 0.5,
    color: "#ff8800",
  },
  {
    lat: 6.5,
    lng: 3.4,
    label: "Lagos",
    temp: 2.6,
    risk: "critical",
    co2: "38 MT",
    renewables: "24%",
    population: "15.9M",
    size: 0.6,
    color: "#ff4444",
  },
  {
    lat: 43.6,
    lng: -79.3,
    label: "Toronto",
    temp: 1.7,
    risk: "medium",
    co2: "142 MT",
    renewables: "38%",
    population: "6.3M",
    size: 0.5,
    color: "#00cc88",
  },
  // China & East Asia (High Industrial Emissions & Coastal Risk)
  {
    lat: 31.2,
    lng: 121.4,
    label: "Shanghai",
    temp: 2.3,
    risk: "critical",
    co2: "260 MT",
    renewables: "14%",
    population: "28.5M",
    size: 0.9,
    color: "#ff4444",
  },
  {
    lat: 23.1,
    lng: 113.2,
    label: "Guangzhou",
    temp: 2.2,
    risk: "high",
    co2: "180 MT",
    renewables: "12%",
    population: "18.7M",
    size: 0.8,
    color: "#ff8800",
  },
  {
    lat: 37.5,
    lng: 126.9,
    label: "Seoul",
    temp: 1.9,
    risk: "high",
    co2: "195 MT",
    renewables: "9%",
    population: "9.9M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: 22.3,
    lng: 114.1,
    label: "Hong Kong",
    temp: 2.1,
    risk: "high",
    co2: "42 MT",
    renewables: "3%",
    population: "7.4M",
    size: 0.6,
    color: "#ff8800",
  },

  // Middle East (Extreme Heat & Fossil Fuel Intensity)
  {
    lat: 24.7,
    lng: 46.6,
    label: "Riyadh",
    temp: 3.5,
    risk: "high",
    co2: "185 MT",
    renewables: "3%",
    population: "7.5M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: 24.4,
    lng: 54.3,
    label: "Abu Dhabi",
    temp: 3.3,
    risk: "high",
    co2: "140 MT",
    renewables: "8%",
    population: "1.5M",
    size: 0.5,
    color: "#ff8800",
  },
  {
    lat: 35.6,
    lng: 51.3,
    label: "Tehran",
    temp: 2.9,
    risk: "high",
    co2: "175 MT",
    renewables: "7%",
    population: "9.4M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: 29.3,
    lng: 47.9,
    label: "Kuwait City",
    temp: 3.8,
    risk: "critical",
    co2: "95 MT",
    renewables: "2%",
    population: "3.1M",
    size: 0.6,
    color: "#ff4444",
  },

  // South Asia & SE Asia (Critical Sinking & Heat Risk)
  {
    lat: 23.8,
    lng: 90.4,
    label: "Dhaka",
    temp: 2.7,
    risk: "critical",
    co2: "25 MT",
    renewables: "5%",
    population: "23.2M",
    size: 0.9,
    color: "#ff4444",
  },
  {
    lat: 13.7,
    lng: 100.5,
    label: "Bangkok",
    temp: 2.4,
    risk: "critical",
    co2: "110 MT",
    renewables: "15%",
    population: "10.9M",
    size: 0.8,
    color: "#ff4444",
  },
  {
    lat: 24.8,
    lng: 67.0,
    label: "Karachi",
    temp: 3.1,
    risk: "critical",
    co2: "62 MT",
    renewables: "8%",
    population: "17.2M",
    size: 0.8,
    color: "#ff4444",
  },
  {
    lat: 14.5,
    lng: 120.9,
    label: "Manila",
    temp: 2.1,
    risk: "critical",
    co2: "48 MT",
    renewables: "21%",
    population: "14.4M",
    size: 0.7,
    color: "#ff4444",
  },

  // Americas (Industrial Hubs)
  {
    lat: 29.7,
    lng: -95.3,
    label: "Houston",
    temp: 2.4,
    risk: "high",
    co2: "205 MT",
    renewables: "22%",
    population: "7.3M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: 34.0,
    lng: -118.2,
    label: "Los Angeles",
    temp: 2.0,
    risk: "high",
    co2: "160 MT",
    renewables: "35%",
    population: "12.4M",
    size: 0.7,
    color: "#ff8800",
  },
  {
    lat: -23.5,
    lng: -46.6,
    label: "São Paulo",
    temp: 2.2,
    risk: "medium",
    co2: "92 MT",
    renewables: "48%",
    population: "22.6M",
    size: 0.7,
    color: "#00cc88",
  },

  // Additional High-Impact Zones
  {
    lat: 41.0,
    lng: 28.9,
    label: "Istanbul",
    temp: 2.1,
    risk: "medium",
    co2: "125 MT",
    renewables: "20%",
    population: "15.8M",
    size: 0.7,
    color: "#00cc88",
  },
  {
    lat: -26.2,
    lng: 28.0,
    label: "Johannesburg",
    temp: 2.6,
    risk: "high",
    co2: "115 MT",
    renewables: "10%",
    population: "5.9M",
    size: 0.6,
    color: "#ff8800",
  },
];

interface ClimateData {
  region: string;
  temperatureAnomaly: number;
  co2Emissions: number;
  renewableAdoption: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  confidenceScore: number;
  lastUpdated: string;
  dataSources: string[];
}

interface Intervention {
  id: string;
  title: string;
  description: string;
  impact: number;
  cost: number;
  timeline: string;
  type: "Policy" | "Technology" | "Conservation";
  feasibility: { political: number; economic: number; technical: number };
  status: string;
}

interface ActionPlan {
  region: string;
  interventions: Intervention[];
  projectedOutcome: string;
}

interface SimulationResult {
  projectedTemperature: number;
  projectedEmissions: number;
  economicImpact: number;
  analysis: string;
}

const RISK_COLORS: Record<RiskLevel, { base: string; hover: string }> = {
  Critical: { base: "rgba(255, 68, 68, 0.45)", hover: "rgba(255, 68, 68, 0.75)" },
  High: { base: "rgba(255, 136, 0, 0.35)", hover: "rgba(255, 136, 0, 0.65)" },
  Medium: { base: "rgba(0, 204, 136, 0.25)", hover: "rgba(0, 204, 136, 0.55)" },
  Low: { base: "rgba(100, 180, 255, 0.15)", hover: "rgba(100, 180, 255, 0.4)" },
};

const CITY_TO_COUNTRY: Record<string, string> = {
  "New York": "United States of America",
  London: "United Kingdom",
  Tokyo: "Japan",
  "Cape Town": "South Africa",
  Delhi: "India",
  "Rio de Janeiro": "Brazil",
  Singapore: "Singapore",
  Moscow: "Russia",
  Nairobi: "Kenya",
  Cairo: "Egypt",
};

function getCountryRisk(countryName: string): RiskLevel | null {
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
    if (country === countryName) {
      const spot = HOTSPOTS.find((h) => h.label === city);
      if (spot) return spot.risk === "critical" ? "Critical" : spot.risk === "high" ? "High" : "Medium";
    }
  }
  return null;
}

const GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

type PanelTab = "overview" | "action" | "simulation";

async function callAnalysis(region: string, type: string, context?: any) {
  const { data, error } = await supabase.functions.invoke("climate-analysis", {
    body: { region, type, context },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.data;
}

export default function ClimateGlobe() {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<HotspotData | null>(null);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("overview");
  const [countries, setCountries] = useState<any>({ features: [] });
  const [hoverD, setHoverD] = useState<any>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then(setCountries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = true;
      controls.minDistance = 110;
      controls.maxDistance = 450;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, []);

  const analyzeRegion = useCallback(async (regionName: string, spot?: HotspotData) => {
    setSelectedRegion(regionName);
    setSelectedSpot(spot || null);
    setClimateData(null);
    setActionPlan(null);
    setSimulation(null);
    setError(null);
    setActiveTab("overview");

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      if (spot) {
        globeRef.current.pointOfView({ lat: spot.lat, lng: spot.lng, altitude: 1.8 }, 1000);
      }
    }

    setLoading((p) => ({ ...p, climate: true }));
    try {
      const data = await callAnalysis(regionName, "climate_data");
      setClimateData(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze region");
    } finally {
      setLoading((p) => ({ ...p, climate: false }));
    }
  }, []);

  const generateActionPlan = async () => {
    if (!climateData || !selectedRegion) return;
    setLoading((p) => ({ ...p, action: true }));
    try {
      const plan = await callAnalysis(selectedRegion, "action_plan", climateData);
      setActionPlan(plan);
      setActiveTab("action");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading((p) => ({ ...p, action: false }));
    }
  };

  const runSimulation = async () => {
    if (!climateData || !actionPlan || !selectedRegion) return;
    setLoading((p) => ({ ...p, sim: true }));
    try {
      const result = await callAnalysis(selectedRegion, "simulation", {
        currentData: climateData,
        interventions: actionPlan.interventions,
      });
      setSimulation(result);
      setActiveTab("simulation");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading((p) => ({ ...p, sim: false }));
    }
  };

  const closePanel = () => {
    setSelectedRegion(null);
    setSelectedSpot(null);
    setClimateData(null);
    setActionPlan(null);
    setSimulation(null);
    setError(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ altitude: 2.5 }, 1000);
    }
  };

  const handlePointClick = useCallback(
    (point: any) => {
      const spot = point as HotspotData;
      analyzeRegion(spot.label, spot);
    },
    [analyzeRegion],
  );

  const handlePolygonClick = useCallback(
    (polygon: any) => {
      const name = polygon?.properties?.ADMIN;
      if (name) analyzeRegion(name);
    },
    [analyzeRegion],
  );

  const riskBadge = (level: string) => {
    const cls =
      level === "Critical"
        ? "bg-glow-danger/20 text-glow-danger"
        : level === "High"
          ? "bg-glow-warning/20 text-glow-warning"
          : level === "Medium"
            ? "bg-primary/20 text-primary"
            : "bg-accent/20 text-accent";
    return (
      <span className={`inline-block text-[10px] font-display px-2 py-0.5 rounded-full ${cls}`}>
        {level.toUpperCase()} RISK
      </span>
    );
  };

  const feasibilityBar = (label: string, val: number) => (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted-foreground w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${val > 70 ? "bg-emerald-400" : val > 40 ? "bg-amber-400" : "bg-destructive"}`}
          style={{ width: `${val}%` }}
        />
      </div>
      <span className="font-mono text-foreground w-8 text-right">{val}%</span>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={HOTSPOTS}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="size"
        pointRadius={0.4}
        pointColor="color"
        pointLabel={(d: any) => `
          <div style="background:rgba(10,15,20,0.9);border:1px solid rgba(0,204,136,0.3);padding:8px 12px;border-radius:6px;font-family:Rajdhani,sans-serif;">
            <div style="font-family:Orbitron,sans-serif;font-size:11px;color:#00cc88;letter-spacing:2px;margin-bottom:4px;">${d.label}</div>
            <div style="font-size:12px;color:#e0e0e0;">Temp: <span style="color:${d.color}">+${d.temp}°C</span> · Risk: <span style="color:${d.color}">${d.risk}</span></div>
            <div style="font-size:10px;color:#888;margin-top:2px;">Click for full analysis</div>
          </div>
        `}
        onPointClick={handlePointClick}
        polygonsData={countries.features}
        polygonAltitude={(d: any) => (d === hoverD ? 0.04 : 0.01)}
        polygonCapColor={(d: any) => {
          const name = d?.properties?.ADMIN;
          const risk = name ? getCountryRisk(name) : null;
          if (!risk) return d === hoverD ? "rgba(255, 255, 255, 0.08)" : "rgba(200, 200, 200, 0.03)";
          const colors = RISK_COLORS[risk];
          return d === hoverD ? colors.hover : colors.base;
        }}
        polygonSideColor={() => "rgba(0, 0, 0, 0.05)"}
        polygonStrokeColor={() => "rgba(200, 200, 200, 0.15)"}
        polygonLabel={({ properties: p }: any) => {
          const risk = getCountryRisk(p.ADMIN);
          return `
            <div style="background:rgba(10,15,20,0.9);border:1px solid rgba(0,204,136,0.3);padding:6px 10px;border-radius:4px;font-family:Rajdhani,sans-serif;">
              <div style="font-family:Orbitron,sans-serif;font-size:10px;color:#e0e0e0;letter-spacing:1px;">${p.ADMIN}</div>
              <div style="font-size:11px;color:${risk ? (risk === "Critical" ? "#ff4444" : risk === "High" ? "#ff8800" : "#00cc88") : "#666"};margin-top:2px;">
                ${risk ? `Risk: ${risk}` : "Click to analyze"}
              </div>
            </div>
          `;
        }}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={(d: any) => {
          setHoverD(d);
          if (globeRef.current && !selectedRegion) {
            globeRef.current.controls().autoRotate = !d;
          }
        }}
        atmosphereColor="#00cc88"
        atmosphereAltitude={0.18}
        animateIn={true}
      />

      {/* Global Stats Overlay - visible when no panel is open */}
      <AnimatePresence>
        {!selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 left-4 z-30 space-y-2"
          >
            {[
              { label: "Global Temp Anomaly", value: "+1.2°C", color: "text-glow-warning" },
              { label: "Carbon Budget", value: "420 Gt", color: "text-glow-danger" },
              { label: "Active Interventions", value: "1,248", color: "text-primary" },
              { label: "CO₂ Concentration", value: "421 ppm", color: "text-glow-warning" },
              { label: "Renewable Share", value: "32.4%", color: "text-accent" },
              { label: "Sea Level Rise", value: "+3.6mm/yr", color: "text-glow-danger" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="glass-panel px-4 py-2.5 w-56"
              >
                <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">
                  {stat.label}
                </div>
                <div className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Panel */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            key={selectedRegion}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="absolute top-16 right-4 w-96 glass-panel z-30 glow-primary max-h-[calc(100vh-120px)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-border/30">
              <div>
                <h3 className="font-display text-sm tracking-widest text-primary font-bold">{selectedRegion}</h3>
                {climateData && riskBadge(climateData.riskLevel)}
              </div>
              <button onClick={closePanel} className="p-1 hover:bg-muted/30 rounded transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/30">
              {[
                { id: "overview" as PanelTab, label: "OVERVIEW", icon: Brain },
                { id: "action" as PanelTab, label: "ACTION PLAN", icon: Target },
                { id: "simulation" as PanelTab, label: "SIMULATE", icon: Beaker },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-display tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && (
                <div className="flex items-start gap-2 text-xs text-glow-danger bg-glow-danger/10 rounded p-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <>
                  {loading.climate ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span>Generating climate assessment...</span>
                    </div>
                  ) : climateData ? (
                    <div className="space-y-3">
                      {/* Hotspot metrics (if from hotspot click) */}
                      {selectedSpot && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/30 rounded p-2">
                            <span className="text-muted-foreground block text-[10px]">Temp Δ</span>
                            <span className="text-glow-warning font-bold">+{selectedSpot.temp}°C</span>
                          </div>
                          <div className="bg-muted/30 rounded p-2">
                            <span className="text-muted-foreground block text-[10px]">Population</span>
                            <span className="text-foreground font-bold">{selectedSpot.population}</span>
                          </div>
                        </div>
                      )}

                      {/* AI Climate Data */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/30 rounded p-2">
                          <span className="text-muted-foreground block text-[10px]">Temp Anomaly</span>
                          <span className="text-glow-warning font-bold">+{climateData.temperatureAnomaly}°C</span>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <span className="text-muted-foreground block text-[10px]">CO₂ Emissions</span>
                          <span className="text-foreground font-bold">{climateData.co2Emissions} MT</span>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <span className="text-muted-foreground block text-[10px]">Renewables</span>
                          <span className="text-primary font-bold">{climateData.renewableAdoption}%</span>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <span className="text-muted-foreground block text-[10px]">Confidence</span>
                          <span className="text-accent font-bold">{climateData.confidenceScore}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{climateData.summary}</p>

                      {/* Data Sources */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-display tracking-wider text-muted-foreground">
                          DATA SOURCES
                        </span>
                        {climateData.dataSources.map((src, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Shield className="w-3 h-3 text-primary" />
                            {src}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={generateActionPlan}
                        disabled={loading.action}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded bg-accent/10 border border-accent/30 text-xs font-display tracking-wider text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
                      >
                        {loading.action ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                        GENERATE ACTION PLAN
                      </button>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                        <span>Updated: {new Date(climateData.lastUpdated).toLocaleDateString()}</span>
                        <button
                          onClick={() => selectedRegion && analyzeRegion(selectedRegion, selectedSpot || undefined)}
                          className="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Refresh
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* ACTION PLAN TAB */}
              {activeTab === "action" && (
                <>
                  {!actionPlan && !loading.action ? (
                    <div className="text-center py-8">
                      <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Generate a climate assessment first, then create an action plan.
                      </p>
                      {climateData && (
                        <button
                          onClick={generateActionPlan}
                          className="mt-3 px-4 py-2 rounded bg-accent/10 border border-accent/30 text-xs text-accent hover:bg-accent/20"
                        >
                          Generate Action Plan
                        </button>
                      )}
                    </div>
                  ) : loading.action ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span>Generating action plan...</span>
                    </div>
                  ) : actionPlan ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground italic">{actionPlan.projectedOutcome}</p>

                      {actionPlan.interventions.map((int, i) => (
                        <div key={int.id || i} className="bg-muted/20 rounded p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-semibold text-foreground">{int.title}</div>
                              <span
                                className={`text-[10px] ${
                                  int.type === "Policy"
                                    ? "text-purple-400"
                                    : int.type === "Technology"
                                      ? "text-blue-400"
                                      : "text-emerald-400"
                                }`}
                              >
                                {int.type}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-accent">{int.status}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{int.description}</p>

                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div className="bg-muted/30 rounded px-2 py-1 text-center">
                              <TrendingUp className="w-3 h-3 mx-auto text-emerald-400 mb-0.5" />
                              <span className="text-foreground font-bold">{int.impact}</span>
                              <span className="text-muted-foreground block">Impact</span>
                            </div>
                            <div className="bg-muted/30 rounded px-2 py-1 text-center">
                              <DollarSign className="w-3 h-3 mx-auto text-amber-400 mb-0.5" />
                              <span className="text-foreground font-bold">${int.cost}B</span>
                              <span className="text-muted-foreground block">Cost</span>
                            </div>
                            <div className="bg-muted/30 rounded px-2 py-1 text-center">
                              <Clock className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                              <span className="text-foreground font-bold text-[9px]">{int.timeline}</span>
                              <span className="text-muted-foreground block">Timeline</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {feasibilityBar("Political", int.feasibility.political)}
                            {feasibilityBar("Economic", int.feasibility.economic)}
                            {feasibilityBar("Technical", int.feasibility.technical)}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={runSimulation}
                        disabled={loading.sim}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded bg-primary/10 border border-primary/30 text-xs font-display tracking-wider text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                      >
                        {loading.sim ? <Loader2 className="w-3 h-3 animate-spin" /> : <Beaker className="w-3 h-3" />}
                        SIMULATE SCENARIO
                      </button>
                    </div>
                  ) : null}
                </>
              )}

              {/* SIMULATION TAB */}
              {activeTab === "simulation" && (
                <>
                  {!simulation && !loading.sim ? (
                    <div className="text-center py-8">
                      <Beaker className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Generate an action plan first, then run a simulation.
                      </p>
                      {actionPlan && (
                        <button
                          onClick={runSimulation}
                          className="mt-3 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20"
                        >
                          Run Simulation
                        </button>
                      )}
                    </div>
                  ) : loading.sim ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Running simulation...</span>
                    </div>
                  ) : simulation ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/30 rounded p-2.5 text-center">
                          <span className="text-[10px] text-muted-foreground block mb-1">Projected Temp</span>
                          <span className="text-lg font-bold font-mono text-glow-warning">
                            {simulation.projectedTemperature > 0 ? "+" : ""}
                            {simulation.projectedTemperature}°C
                          </span>
                        </div>
                        <div className="bg-muted/30 rounded p-2.5 text-center">
                          <span className="text-[10px] text-muted-foreground block mb-1">Emissions</span>
                          <span className="text-lg font-bold font-mono text-primary">
                            {simulation.projectedEmissions} MT
                          </span>
                        </div>
                        <div className="bg-muted/30 rounded p-2.5 text-center">
                          <span className="text-[10px] text-muted-foreground block mb-1">Economic</span>
                          <span
                            className={`text-lg font-bold font-mono ${simulation.economicImpact >= 0 ? "text-emerald-400" : "text-glow-danger"}`}
                          >
                            ${Math.abs(simulation.economicImpact)}B
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[10px] font-display tracking-wider text-accent">ANALYSIS</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{simulation.analysis}</p>
                      </div>

                      {climateData && (
                        <div className="bg-muted/10 rounded p-2 text-[10px] text-muted-foreground/60">
                          Baseline: +{climateData.temperatureAnomaly}°C → Projected:{" "}
                          {simulation.projectedTemperature > 0 ? "+" : ""}
                          {simulation.projectedTemperature}°C
                          {simulation.projectedTemperature < climateData.temperatureAnomaly && (
                            <span className="text-emerald-400 ml-1">
                              (↓ {(climateData.temperatureAnomaly - simulation.projectedTemperature).toFixed(1)}°C
                              reduction)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

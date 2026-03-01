import { useState, useMemo } from "react";
import {
  Calculator, FlaskConical, ArrowRightLeft, BookOpen, Clock,
  ExternalLink, Thermometer, Beaker, Scale, Gauge,
  Calendar, StickyNote, TrendingUp, ChevronDown, ChevronUp,
  Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClimateMetrics } from "@/hooks/useClimateData";
import { useCO2Levels, useTemperatureAnomaly, useMethaneLevels } from "@/hooks/useGlobalWarming";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════
// 1. CARBON BUDGET CALCULATOR
// ═══════════════════════════════════════════════

const CARBON_BUDGETS = {
  "1.5": { total: 400, label: "1.5°C (50% chance)", color: "text-destructive" },
  "1.7": { total: 700, label: "1.7°C (50% chance)", color: "text-warning" },
  "2.0": { total: 1150, label: "2.0°C (67% chance)", color: "text-success" },
};

const CURRENT_ANNUAL_EMISSIONS = 40.9; // GtCO₂ (2024 estimate)
const BUDGET_START_YEAR = 2024;

function CarbonBudgetCalculator() {
  const [target, setTarget] = useState<"1.5" | "1.7" | "2.0">("1.5");
  const [reductionRate, setReductionRate] = useState("2.5");

  const projection = useMemo(() => {
    const budget = CARBON_BUDGETS[target];
    const rate = parseFloat(reductionRate) / 100;
    const years: { year: number; emissions: number; cumulative: number; remaining: number }[] = [];
    let cumulative = 0;
    let annual = CURRENT_ANNUAL_EMISSIONS;

    for (let y = BUDGET_START_YEAR; y <= 2060; y++) {
      cumulative += annual;
      const remaining = budget.total - cumulative;
      years.push({ year: y, emissions: parseFloat(annual.toFixed(2)), cumulative: parseFloat(cumulative.toFixed(1)), remaining: parseFloat(Math.max(0, remaining).toFixed(1)) });
      if (remaining <= 0) break;
      annual *= (1 - rate);
      if (annual < 0.5) annual = 0.5;
    }
    const exhaustionYear = years.find(y => y.remaining <= 0)?.year || null;
    const yearsLeft = exhaustionYear ? exhaustionYear - BUDGET_START_YEAR : null;

    return { years, exhaustionYear, yearsLeft, budget };
  }, [target, reductionRate]);

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Carbon Budget Calculator</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Remaining global carbon budget from 2024. Based on IPCC AR6 estimates.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Temperature Target</Label>
          <Select value={target} onValueChange={(v: any) => setTarget(v)}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CARBON_BUDGETS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Annual Reduction Rate (%)</Label>
          <Input
            type="number" min="0" max="15" step="0.5"
            value={reductionRate} onChange={e => setReductionRate(e.target.value)}
            className="bg-muted border-border font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="text-lg font-bold font-mono text-foreground">{projection.budget.total}</p>
          <p className="text-xs text-muted-foreground">GtCO₂</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-xs text-muted-foreground">Exhausted By</p>
          <p className={`text-lg font-bold font-mono ${projection.budget.color}`}>
            {projection.exhaustionYear || "2060+"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-xs text-muted-foreground">Years Left</p>
          <p className={`text-lg font-bold font-mono ${projection.yearsLeft && projection.yearsLeft < 15 ? "text-destructive" : "text-success"}`}>
            {projection.yearsLeft ?? "36+"}
          </p>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projection.years} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line type="monotone" dataKey="emissions" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} name="Annual GtCO₂" />
            <Line type="monotone" dataKey="remaining" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} name="Budget Remaining" />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2. UNIT CONVERTER
// ═══════════════════════════════════════════════

const CONVERSIONS: Record<string, { units: string[]; convert: (val: number, from: string, to: string) => number }> = {
  "Carbon Mass": {
    units: ["GtCO₂", "GtC", "MtCO₂", "MtC", "kgCO₂", "kgC"],
    convert: (val, from, to) => {
      const toGtCO2: Record<string, number> = { "GtCO₂": 1, "GtC": 3.664, "MtCO₂": 0.001, "MtC": 0.003664, "kgCO₂": 1e-12, "kgC": 3.664e-12 };
      const fromGtCO2: Record<string, number> = { "GtCO₂": 1, "GtC": 1 / 3.664, "MtCO₂": 1000, "MtC": 1000 / 3.664, "kgCO₂": 1e12, "kgC": 1e12 / 3.664 };
      return val * toGtCO2[from] * fromGtCO2[to];
    }
  },
  "Concentration": {
    units: ["ppm", "ppb", "ppt", "μg/m³ (CO₂)", "mg/m³ (CO₂)"],
    convert: (val, from, to) => {
      const toPpm: Record<string, number> = { "ppm": 1, "ppb": 0.001, "ppt": 0.000001, "μg/m³ (CO₂)": 1 / 1800, "mg/m³ (CO₂)": 1 / 1.8 };
      const fromPpm: Record<string, number> = { "ppm": 1, "ppb": 1000, "ppt": 1e6, "μg/m³ (CO₂)": 1800, "mg/m³ (CO₂)": 1.8 };
      return val * toPpm[from] * fromPpm[to];
    }
  },
  "Temperature": {
    units: ["°C", "°F", "K"],
    convert: (val, from, to) => {
      let celsius = from === "°C" ? val : from === "°F" ? (val - 32) * 5 / 9 : val - 273.15;
      return to === "°C" ? celsius : to === "°F" ? celsius * 9 / 5 + 32 : celsius + 273.15;
    }
  },
  "Energy": {
    units: ["TWh", "GWh", "MWh", "EJ", "PJ", "Mtoe", "Quad BTU"],
    convert: (val, from, to) => {
      const toTWh: Record<string, number> = { "TWh": 1, "GWh": 0.001, "MWh": 1e-6, "EJ": 277.778, "PJ": 0.277778, "Mtoe": 11.63, "Quad BTU": 293.07 };
      const fromTWh: Record<string, number> = { "TWh": 1, "GWh": 1000, "MWh": 1e6, "EJ": 1 / 277.778, "PJ": 1 / 0.277778, "Mtoe": 1 / 11.63, "Quad BTU": 1 / 293.07 };
      return val * toTWh[from] * fromTWh[to];
    }
  },
  "Area": {
    units: ["km²", "ha", "acres", "mi²"],
    convert: (val, from, to) => {
      const toKm2: Record<string, number> = { "km²": 1, "ha": 0.01, "acres": 0.00404686, "mi²": 2.58999 };
      const fromKm2: Record<string, number> = { "km²": 1, "ha": 100, "acres": 247.105, "mi²": 0.386102 };
      return val * toKm2[from] * fromKm2[to];
    }
  },
};

function UnitConverter() {
  const [category, setCategory] = useState("Carbon Mass");
  const [fromUnit, setFromUnit] = useState(CONVERSIONS["Carbon Mass"].units[0]);
  const [toUnit, setToUnit] = useState(CONVERSIONS["Carbon Mass"].units[1]);
  const [inputVal, setInputVal] = useState("1");
  const [copied, setCopied] = useState(false);

  const units = CONVERSIONS[category].units;
  const result = useMemo(() => {
    const num = parseFloat(inputVal);
    if (isNaN(num)) return "—";
    try {
      const r = CONVERSIONS[category].convert(num, fromUnit, toUnit);
      return r < 0.0001 && r > 0 ? r.toExponential(4) : r.toLocaleString("en-US", { maximumFractionDigits: 6 });
    } catch {
      return "—";
    }
  }, [inputVal, fromUnit, toUnit, category]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Climate Unit Converter</h3>
      </div>

      <Select value={category} onValueChange={v => { setCategory(v); setFromUnit(CONVERSIONS[v].units[0]); setToUnit(CONVERSIONS[v].units[1]); }}>
        <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.keys(CONVERSIONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger className="bg-muted border-border text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={inputVal} onChange={e => setInputVal(e.target.value)} className="bg-muted border-border font-mono text-lg" type="number" />
        </div>
        <div className="pb-3">
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger className="bg-muted border-border text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 font-mono text-lg text-primary min-h-[44px] flex items-center">
              {result}
            </div>
            <button onClick={handleCopy} className="p-2 rounded hover:bg-muted transition-colors" title="Copy">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 3. QUICK REFERENCE — THRESHOLDS & CONSTANTS
// ═══════════════════════════════════════════════

const REFERENCE_DATA = [
  { category: "Critical Thresholds", icon: Gauge, items: [
    { label: "Pre-industrial CO₂", value: "280 ppm", note: "Baseline (1750)" },
    { label: "Paris 1.5°C budget left", value: "~400 GtCO₂", note: "From 2024, IPCC AR6" },
    { label: "Paris 2.0°C budget left", value: "~1,150 GtCO₂", note: "From 2024, 67% prob" },
    { label: "Safe CH₄ level", value: "~1,200 ppb", note: "Pre-industrial: 722 ppb" },
    { label: "WHO PM2.5 limit", value: "15 μg/m³", note: "Annual mean guideline" },
    { label: "WHO PM10 limit", value: "45 μg/m³", note: "Annual mean guideline" },
  ]},
  { category: "Climate Constants", icon: FlaskConical, items: [
    { label: "CO₂ → C mass ratio", value: "3.664", note: "44.01 / 12.011" },
    { label: "1 ppm CO₂ ≈", value: "7.82 GtCO₂", note: "In atmosphere" },
    { label: "Climate sensitivity (ECS)", value: "2.5–4.0°C", note: "Per CO₂ doubling" },
    { label: "TCR", value: "1.4–2.2°C", note: "Transient response" },
    { label: "Ocean heat fraction", value: "~93%", note: "Of excess heat absorbed" },
    { label: "Radiative forcing (2xCO₂)", value: "3.7 W/m²", note: "IPCC AR5" },
  ]},
  { category: "Current State (2024–25)", icon: Thermometer, items: [
    { label: "Current CO₂", value: "~425 ppm", note: "NOAA Mauna Loa" },
    { label: "Current CH₄", value: "~1,925 ppb", note: "NOAA baseline" },
    { label: "Current N₂O", value: "~337 ppb", note: "NOAA baseline" },
    { label: "Global temp anomaly", value: "+1.3°C", note: "vs 1850-1900 avg" },
    { label: "Sea level rise rate", value: "~4.5 mm/yr", note: "Satellite altimetry" },
    { label: "Annual global emissions", value: "~40.9 GtCO₂", note: "Fossil + cement" },
  ]},
];

function QuickReference() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "Critical Thresholds": true, "Climate Constants": true, "Current State (2024–25)": true });

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Quick Reference</h3>
        <span className="text-xs text-muted-foreground ml-auto">IPCC AR6 / NOAA / NASA</span>
      </div>

      {REFERENCE_DATA.map(section => (
        <div key={section.category}>
          <button
            onClick={() => setExpanded(p => ({ ...p, [section.category]: !p[section.category] }))}
            className="flex items-center gap-2 w-full text-left py-2 hover:bg-muted/20 rounded px-1 transition-colors"
          >
            <section.icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground flex-1">{section.category}</span>
            {expanded[section.category] ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </button>
          {expanded[section.category] && (
            <div className="grid gap-1 ml-6">
              {section.items.map(item => (
                <div key={item.label} className="flex items-baseline gap-2 py-1 border-b border-border/20 last:border-0">
                  <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground/60 w-28 text-right">{item.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 4. KEY DATASETS & RESOURCES
// ═══════════════════════════════════════════════

const DATASETS = [
  { name: "NOAA GML CO₂ (Mauna Loa)", url: "https://gml.noaa.gov/ccgg/trends/", desc: "Daily/monthly atmospheric CO₂", updated: "Daily" },
  { name: "NASA GISS Temperature", url: "https://data.giss.nasa.gov/gistemp/", desc: "Global surface temperature anomaly", updated: "Monthly" },
  { name: "IPCC AR6 Data", url: "https://www.ipcc.ch/report/ar6/wg1/#FullReport", desc: "Working Group I datasets & figures", updated: "Static" },
  { name: "Global Carbon Budget", url: "https://globalcarbonbudget.org/", desc: "Annual emissions, sinks, budget", updated: "Annual" },
  { name: "Climate TRACE", url: "https://climatetrace.org/", desc: "Facility-level GHG inventory", updated: "Quarterly" },
  { name: "ERA5 Reanalysis (Copernicus)", url: "https://cds.climate.copernicus.eu/", desc: "Hourly atmospheric reanalysis 1940–present", updated: "Monthly" },
  { name: "NSIDC Sea Ice Index", url: "https://nsidc.org/data/seaice_index/", desc: "Arctic & Antarctic sea ice extent", updated: "Daily" },
  { name: "Our World in Data — Climate", url: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions", desc: "Curated visualizations & CSV exports", updated: "Annual" },
  { name: "Open-Meteo API", url: "https://open-meteo.com/", desc: "Free weather, air quality, climate projections", updated: "Real-time" },
  { name: "EDGAR GHG Database", url: "https://edgar.jrc.ec.europa.eu/", desc: "Emissions Database for Global Atmospheric Research", updated: "Annual" },
];

function DatasetLinks() {
  return (
    <div className="glass-card rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Key Datasets & APIs</h3>
      </div>
      <div className="grid gap-1.5">
        {DATASETS.map(d => (
          <a
            key={d.name}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg p-2.5 bg-muted/20 hover:bg-muted/40 border border-border/20 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground truncate">{d.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground/60 shrink-0">{d.updated}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 5. CLIMATE CALENDAR — KEY DATES
// ═══════════════════════════════════════════════

const CLIMATE_EVENTS = [
  { date: "2026-03-23", title: "World Meteorological Day", type: "awareness", desc: "Theme: 'Weather, Climate, and Water across Generations'" },
  { date: "2026-04-22", title: "Earth Day", type: "awareness", desc: "Annual global environmental action day" },
  { date: "2026-05-15", title: "IPCC AR7 Scoping Meeting", type: "ipcc", desc: "Planning session for Seventh Assessment Report" },
  { date: "2026-06-05", title: "World Environment Day", type: "awareness", desc: "UN Environment Programme flagship day" },
  { date: "2026-06-15", title: "Bonn Climate Conference (SB60)", type: "unfccc", desc: "UNFCCC subsidiary bodies sessions" },
  { date: "2026-09-15", title: "UN General Assembly – Climate Week", type: "unfccc", desc: "High-level climate discussions in New York" },
  { date: "2026-11-09", title: "COP31 — Belém, Brazil", type: "cop", desc: "UN Climate Change Conference" },
  { date: "2027-01-01", title: "EU CBAM Phase 2", type: "policy", desc: "Full EU carbon border adjustment implementation" },
  { date: "2027-03-01", title: "Updated NDCs Due", type: "unfccc", desc: "Nationally Determined Contributions for 2035 targets" },
  { date: "2028-11-01", title: "COP32 (TBD)", type: "cop", desc: "Location to be determined" },
];

const eventColors: Record<string, string> = {
  cop: "bg-destructive/15 text-destructive border-destructive/20",
  unfccc: "bg-primary/15 text-primary border-primary/20",
  ipcc: "bg-info/15 text-info border-info/20",
  policy: "bg-warning/15 text-warning border-warning/20",
  awareness: "bg-muted text-muted-foreground border-border/30",
};

function ClimateCalendar() {
  const now = new Date();
  const upcoming = CLIMATE_EVENTS.filter(e => new Date(e.date) >= now).slice(0, 8);
  const past = CLIMATE_EVENTS.filter(e => new Date(e.date) < now).slice(-2);

  return (
    <div className="glass-card rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Climate Calendar</h3>
        <span className="text-xs text-muted-foreground ml-auto">2026–2028</span>
      </div>

      <div className="space-y-1.5">
        {past.map(e => (
          <div key={e.date} className="flex items-start gap-3 rounded-lg p-2.5 opacity-50 border border-border/10">
            <div className="text-center shrink-0 w-12">
              <p className="text-xs font-mono text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short" })}</p>
              <p className="text-sm font-bold font-mono text-muted-foreground">{new Date(e.date).getDate()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground line-through">{e.title}</p>
              <p className="text-xs text-muted-foreground/60">{e.desc}</p>
            </div>
          </div>
        ))}
        {upcoming.map(e => {
          const daysUntil = Math.ceil((new Date(e.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <div key={e.date} className={`flex items-start gap-3 rounded-lg p-2.5 border ${eventColors[e.type] || eventColors.awareness}`}>
              <div className="text-center shrink-0 w-12">
                <p className="text-xs font-mono">{new Date(e.date).toLocaleDateString("en-US", { month: "short" })}</p>
                <p className="text-sm font-bold font-mono">{new Date(e.date).getDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{e.title}</p>
                <p className="text-xs opacity-70">{e.desc}</p>
              </div>
              <span className="text-xs font-mono shrink-0 opacity-70">
                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 6. RESEARCH NOTES (local-only, persisted to localStorage)
// ═══════════════════════════════════════════════

interface ResearchNote {
  id: string;
  text: string;
  timestamp: string;
  tag: string;
}

function ResearchNotes() {
  const [notes, setNotes] = useState<ResearchNote[]>(() => {
    try { return JSON.parse(localStorage.getItem("climate-research-notes") || "[]"); } catch { return []; }
  });
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState("observation");

  const save = (updated: ResearchNote[]) => {
    setNotes(updated);
    localStorage.setItem("climate-research-notes", JSON.stringify(updated));
  };

  const addNote = () => {
    if (!draft.trim()) return;
    save([{ id: Date.now().toString(), text: draft.trim(), timestamp: new Date().toISOString(), tag }, ...notes]);
    setDraft("");
  };

  const deleteNote = (id: string) => save(notes.filter(n => n.id !== id));

  const tagColors: Record<string, string> = {
    observation: "bg-primary/15 text-primary",
    hypothesis: "bg-warning/15 text-warning",
    todo: "bg-info/15 text-info",
    insight: "bg-success/15 text-success",
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Research Notes</h3>
        <span className="text-xs text-muted-foreground ml-auto">{notes.length} notes · local storage</span>
      </div>

      <div className="flex gap-2">
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-32 bg-muted border-border text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="observation">Observation</SelectItem>
            <SelectItem value="hypothesis">Hypothesis</SelectItem>
            <SelectItem value="todo">To-do</SelectItem>
            <SelectItem value="insight">Insight</SelectItem>
          </SelectContent>
        </Select>
        <Textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Quick note..." className="bg-muted border-border text-xs min-h-[38px] max-h-[80px]" />
        <Button size="sm" onClick={addNote} disabled={!draft.trim()}>Add</Button>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No notes yet. Jot down observations as you work.</p>
        ) : notes.map(n => (
          <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border/20 group">
            <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${tagColors[n.tag] || tagColors.observation}`}>{n.tag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground whitespace-pre-wrap">{n.text}</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
            </div>
            <button onClick={() => deleteNote(n.id)} className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 7. LIVE CORRELATION PANEL
// ═══════════════════════════════════════════════

function CorrelationPanel() {
  const { data: co2Data } = useCO2Levels();
  const { data: tempData } = useTemperatureAnomaly();
  const { data: methaneData } = useMethaneLevels();

  const correlationData = useMemo(() => {
    if (!co2Data?.length || !tempData?.length) return [];
    // Build year-matched dataset
    const co2ByYear: Record<string, number> = {};
    co2Data.forEach(e => { co2ByYear[e.year] = parseFloat(e.trend); });

    const tempByYear: Record<string, number> = {};
    tempData.forEach(e => {
      const year = Math.floor(parseFloat(e.time)).toString();
      tempByYear[year] = parseFloat(e.station);
    });

    const methaneByYear: Record<string, number> = {};
    methaneData?.forEach(e => {
      const year = e.date.slice(0, 4);
      methaneByYear[year] = parseFloat(e.trend);
    });

    const years = Object.keys(co2ByYear).filter(y => tempByYear[y]).sort();
    return years.map(y => ({
      year: y,
      co2: co2ByYear[y],
      temp: tempByYear[y],
      methane: methaneByYear[y] || null,
    }));
  }, [co2Data, tempData, methaneData]);

  if (correlationData.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">CO₂ ↔ Temperature Correlation</h3>
        <span className="text-xs text-muted-foreground ml-auto">{correlationData.length} data points</span>
      </div>
      <p className="text-xs text-muted-foreground">Overlaid trends showing the relationship between atmospheric CO₂ concentration and global temperature anomaly.</p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={correlationData} margin={{ top: 5, right: 40, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <YAxis yAxisId="co2" tick={{ fill: "hsl(160, 60%, 45%)", fontSize: 10 }} domain={["dataMin - 5", "dataMax + 5"]} />
            <YAxis yAxisId="temp" orientation="right" tick={{ fill: "hsl(0, 72%, 55%)", fontSize: 10 }} domain={["dataMin - 0.2", "dataMax + 0.2"]} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line yAxisId="co2" type="monotone" dataKey="co2" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} name="CO₂ (ppm)" />
            <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} name="Temp Anomaly (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[hsl(160,60%,45%)]" />
          <span className="text-xs text-muted-foreground">CO₂ (ppm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[hsl(0,72%,55%)]" />
          <span className="text-xs text-muted-foreground">Temperature Anomaly (°C)</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAGE LAYOUT
// ═══════════════════════════════════════════════

const ResearcherToolkit = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Beaker className="w-6 h-6 text-primary" /> Researcher Toolkit
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily-use tools for climate research — calculators, converters, references, and notes
        </p>
      </div>

      {/* Row 1: Budget Calculator + Unit Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CarbonBudgetCalculator />
        <UnitConverter />
      </div>

      {/* Row 2: Correlation + Quick Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CorrelationPanel />
        <QuickReference />
      </div>

      {/* Row 3: Calendar + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClimateCalendar />
        <ResearchNotes />
      </div>

      {/* Row 4: Datasets */}
      <DatasetLinks />
    </div>
  );
};

export default ResearcherToolkit;

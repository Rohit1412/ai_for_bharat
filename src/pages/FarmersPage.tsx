import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wheat,
  Sprout,
  MapPin,
  Loader2,
  Sparkles,
  TrendingUp,
  Droplets,
  Sun,
  Leaf,
  BarChart3,
  Languages,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import IndiaMap from "@/components/IndiaMap";
import ReactMarkdown from "react-markdown";
import UserBadge from "@/components/UserBadge";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATE_AGRI_DATA: Record<string, { topCrops: string[]; rainfall: string; soilType: string; season: string; avgYield: string }> = {
  "Andhra Pradesh": { topCrops: ["Rice", "Cotton", "Chilli"], rainfall: "900 mm", soilType: "Black & Red", season: "Kharif dominant", avgYield: "3.2 t/ha" },
  "Assam": { topCrops: ["Rice", "Tea", "Jute"], rainfall: "2800 mm", soilType: "Alluvial", season: "Kharif", avgYield: "2.1 t/ha" },
  "Bihar": { topCrops: ["Rice", "Wheat", "Maize"], rainfall: "1200 mm", soilType: "Alluvial", season: "Kharif & Rabi", avgYield: "2.8 t/ha" },
  "Chhattisgarh": { topCrops: ["Rice", "Soybean", "Maize"], rainfall: "1400 mm", soilType: "Red & Yellow", season: "Kharif dominant", avgYield: "2.0 t/ha" },
  "Goa": { topCrops: ["Rice", "Coconut", "Cashew"], rainfall: "3000 mm", soilType: "Laterite", season: "Kharif", avgYield: "2.5 t/ha" },
  "Gujarat": { topCrops: ["Cotton", "Groundnut", "Bajra"], rainfall: "800 mm", soilType: "Black & Sandy", season: "Kharif & Rabi", avgYield: "2.4 t/ha" },
  "Haryana": { topCrops: ["Wheat", "Rice", "Sugarcane"], rainfall: "550 mm", soilType: "Alluvial", season: "Rabi dominant", avgYield: "4.5 t/ha" },
  "Himachal Pradesh": { topCrops: ["Apple", "Wheat", "Maize"], rainfall: "1500 mm", soilType: "Mountain", season: "Rabi & Kharif", avgYield: "1.9 t/ha" },
  "Jharkhand": { topCrops: ["Rice", "Maize", "Pulses"], rainfall: "1400 mm", soilType: "Red & Laterite", season: "Kharif", avgYield: "1.7 t/ha" },
  "Karnataka": { topCrops: ["Rice", "Ragi", "Sugarcane"], rainfall: "1250 mm", soilType: "Red & Black", season: "Kharif & Rabi", avgYield: "3.0 t/ha" },
  "Kerala": { topCrops: ["Rice", "Rubber", "Coconut"], rainfall: "3000 mm", soilType: "Laterite & Alluvial", season: "Kharif", avgYield: "2.8 t/ha" },
  "Madhya Pradesh": { topCrops: ["Soybean", "Wheat", "Gram"], rainfall: "1100 mm", soilType: "Black", season: "Kharif & Rabi", avgYield: "2.5 t/ha" },
  "Maharashtra": { topCrops: ["Sugarcane", "Cotton", "Soybean"], rainfall: "1000 mm", soilType: "Black & Laterite", season: "Kharif & Rabi", avgYield: "2.7 t/ha" },
  "Odisha": { topCrops: ["Rice", "Pulses", "Oilseeds"], rainfall: "1500 mm", soilType: "Alluvial & Laterite", season: "Kharif dominant", avgYield: "2.2 t/ha" },
  "Punjab": { topCrops: ["Wheat", "Rice", "Cotton"], rainfall: "650 mm", soilType: "Alluvial", season: "Rabi & Kharif", avgYield: "4.8 t/ha" },
  "Rajasthan": { topCrops: ["Bajra", "Wheat", "Mustard"], rainfall: "500 mm", soilType: "Sandy & Arid", season: "Rabi dominant", avgYield: "1.5 t/ha" },
  "Tamil Nadu": { topCrops: ["Rice", "Sugarcane", "Cotton"], rainfall: "950 mm", soilType: "Red & Alluvial", season: "All seasons", avgYield: "3.5 t/ha" },
  "Telangana": { topCrops: ["Rice", "Cotton", "Maize"], rainfall: "950 mm", soilType: "Red & Black", season: "Kharif & Rabi", avgYield: "3.0 t/ha" },
  "Uttar Pradesh": { topCrops: ["Wheat", "Rice", "Sugarcane"], rainfall: "1000 mm", soilType: "Alluvial", season: "Rabi & Kharif", avgYield: "3.8 t/ha" },
  "West Bengal": { topCrops: ["Rice", "Jute", "Potato"], rainfall: "1750 mm", soilType: "Alluvial", season: "Kharif & Rabi", avgYield: "3.2 t/ha" },
  "Delhi": { topCrops: ["Wheat", "Vegetables", "Flowers"], rainfall: "700 mm", soilType: "Alluvial", season: "Rabi", avgYield: "3.0 t/ha" },
  "Jammu & Kashmir": { topCrops: ["Rice", "Apple", "Saffron"], rainfall: "1200 mm", soilType: "Mountain & Alluvial", season: "Kharif & Rabi", avgYield: "2.5 t/ha" },
};

const NATIONAL_STATS = [
  { label: "Total Arable Land", value: "156 M ha", icon: Leaf },
  { label: "Cropping Intensity", value: "142%", icon: BarChart3 },
  { label: "Avg Rainfall", value: "1,180 mm", icon: Droplets },
  { label: "Agri GDP Share", value: "18.3%", icon: TrendingUp },
];

/* ── State → native language mapping ── */
const STATE_LANGUAGE: Record<string, { name: string; nativeName: string }> = {
  "Andhra Pradesh": { name: "Telugu", nativeName: "తెలుగు" },
  "Arunachal Pradesh": { name: "Hindi", nativeName: "हिन्दी" },
  "Assam": { name: "Assamese", nativeName: "অসমীয়া" },
  "Bihar": { name: "Hindi", nativeName: "हिन्दी" },
  "Chhattisgarh": { name: "Hindi", nativeName: "हिन्दी" },
  "Delhi": { name: "Hindi", nativeName: "हिन्दी" },
  "Goa": { name: "Konkani", nativeName: "कोंकणी" },
  "Gujarat": { name: "Gujarati", nativeName: "ગુજરાતી" },
  "Haryana": { name: "Hindi", nativeName: "हिन्दी" },
  "Himachal Pradesh": { name: "Hindi", nativeName: "हिन्दी" },
  "Jammu & Kashmir": { name: "Urdu", nativeName: "اردو" },
  "Jharkhand": { name: "Hindi", nativeName: "हिन्दी" },
  "Karnataka": { name: "Kannada", nativeName: "ಕನ್ನಡ" },
  "Kerala": { name: "Malayalam", nativeName: "മലയാളം" },
  "Madhya Pradesh": { name: "Hindi", nativeName: "हिन्दी" },
  "Maharashtra": { name: "Marathi", nativeName: "मराठी" },
  "Manipur": { name: "Meitei", nativeName: "মৈতৈলোন্" },
  "Meghalaya": { name: "English", nativeName: "English" },
  "Mizoram": { name: "Mizo", nativeName: "Mizo ṭawng" },
  "Nagaland": { name: "English", nativeName: "English" },
  "Odisha": { name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  "Punjab": { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  "Rajasthan": { name: "Hindi", nativeName: "हिन्दी" },
  "Sikkim": { name: "Nepali", nativeName: "नेपाली" },
  "Tamil Nadu": { name: "Tamil", nativeName: "தமிழ்" },
  "Telangana": { name: "Telugu", nativeName: "తెలుగు" },
  "Tripura": { name: "Bengali", nativeName: "বাংলা" },
  "Uttar Pradesh": { name: "Hindi", nativeName: "हिन्दी" },
  "Uttarakhand": { name: "Hindi", nativeName: "हिन्दी" },
  "West Bengal": { name: "Bengali", nativeName: "বাংলা" },
  "Andaman & Nicobar Islands": { name: "Hindi", nativeName: "हिन्दी" },
  "Chandigarh": { name: "Hindi", nativeName: "हिन्दी" },
  "Dadra & Nagar Haveli": { name: "Gujarati", nativeName: "ગુજરાતી" },
  "Daman & Diu": { name: "Gujarati", nativeName: "ગુજરાતી" },
  "Lakshadweep": { name: "Malayalam", nativeName: "മലയാളം" },
  "Puducherry": { name: "Tamil", nativeName: "தமிழ்" },
};

const FarmersPage = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useNativeLanguage, setUseNativeLanguage] = useState(false);

  const nativeLang = selectedState ? STATE_LANGUAGE[selectedState] : null;

  const analyze = useCallback(async () => {
    if (!selectedState || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const language = useNativeLanguage && nativeLang ? nativeLang.name : "English";
      const { data, error } = await supabase.functions.invoke("farmers-ai", {
        body: { state: selectedState, month: selectedMonth, queryType: "full_analysis", context: { language } },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data?.text || "No response received.");
    } catch (err: any) {
      toast({ title: "AI Analysis Failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedMonth, loading, useNativeLanguage, nativeLang]);

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setResult(null);
  };

  const stateData = selectedState ? STATE_AGRI_DATA[selectedState] : null;

  return (
    <div className="h-screen bg-background overflow-hidden relative flex flex-col">
      {/* Scan line */}
      <div className="fixed inset-0 pointer-events-none scan-line z-50" />

      {/* Header */}
      <header className="shrink-0 z-40 backdrop-blur-md bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-8 h-8 rounded-lg bg-muted/80 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Wheat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-[0.15em] text-foreground glow-text-primary">KISAN MITRA</h1>
              <p className="text-xs font-body text-muted-foreground tracking-wide">AI-Powered Agricultural Advisory — India</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Sprout className="w-3.5 h-3.5 text-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>LIVE</span>
            </div>
            <UserBadge />
          </div>
        </div>
      </header>

      {/* Main — full remaining height */}
      <div className="flex-1 min-h-0 flex">

        {/* LEFT SIDEBAR — Map + Stats */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-border/30 bg-card/20 overflow-y-auto custom-scrollbar">
          {/* Map */}
          <div className="p-4 pb-2 shrink-0">
            <div className="glass-panel p-3" style={{ height: "340px" }}>
              <IndiaMap selectedState={selectedState} onStateSelect={handleStateSelect} featuredState="ka" />
            </div>
          </div>

          {/* National stats */}
          <div className="px-4 py-2 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {NATIONAL_STATS.map((s) => (
                <div key={s.label} className="glass-panel px-3 py-2 flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground font-body">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* State data / hint */}
          <div className="px-4 py-2 flex-1">
            <AnimatePresence mode="wait">
              {stateData ? (
                <motion.div key={selectedState} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-sm tracking-wider text-foreground">{selectedState?.toUpperCase()}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Top Crops</p>
                      <div className="flex flex-wrap gap-1">
                        {stateData.topCrops.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-body border border-primary/20">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Season</p>
                      <p className="text-foreground font-body">{stateData.season}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Rainfall</p>
                        <p className="text-foreground font-body">{stateData.rainfall}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-glow-warning" />
                      <div>
                        <p className="text-xs text-muted-foreground">Soil</p>
                        <p className="text-foreground font-body">{stateData.soilType}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-border/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Yield</span>
                    <span className="text-sm font-semibold text-primary font-body">{stateData.avgYield}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 border-glow-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-glow-warning" />
                    <span className="text-sm font-display tracking-wider text-glow-warning">SELECT A STATE</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-body">
                    Click any state on the map to view agricultural data and generate a full AI analysis.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => handleStateSelect("Karnataka")} className="mt-3 text-xs font-display tracking-wider gap-2 border-glow-warning/30 text-glow-warning hover:bg-glow-warning/10">
                    <Leaf className="w-3.5 h-3.5" /> QUICK START: KARNATAKA
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-t border-border/20 shrink-0">
            <div className="flex items-center justify-center gap-5 text-[10px] font-display tracking-wider text-muted-foreground/70">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(38_90%_55%_/_0.5)] border border-[hsl(38_90%_55%_/_0.8)]" />
                <span>FEATURED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(165_80%_45%_/_0.4)] border border-primary/60" />
                <span>SELECTED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(200_20%_18%_/_0.6)] border border-border/60" />
                <span>DEFAULT</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Full analysis area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedState ? (
            <>
              {/* Controls bar */}
              <div className="shrink-0 px-6 py-4 border-b border-border/30 bg-card/30 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-base tracking-wider text-foreground">{selectedState.toUpperCase()}</h2>
                    <p className="text-xs text-muted-foreground font-body">Complete Agricultural Analysis</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value); setResult(null); }}
                    className="bg-muted border border-border/60 rounded-lg px-3 py-1.5 text-sm text-foreground font-body focus:outline-none focus:border-primary/50"
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>

                  {/* Language toggle */}
                  {nativeLang && (
                    <button
                      onClick={() => { setUseNativeLanguage((v) => !v); setResult(null); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-display tracking-wider transition-all ${
                        useNativeLanguage
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-muted border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <Languages className="w-3.5 h-3.5" />
                      {useNativeLanguage ? nativeLang.nativeName : "EN"}
                    </button>
                  )}

                  <Button onClick={analyze} disabled={loading} className="text-xs font-display tracking-wider gap-2 h-9 px-5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? "ANALYZING..." : "ANALYZE STATE"}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => { setSelectedState(null); setResult(null); }} className="text-xs font-display tracking-wider text-muted-foreground hover:text-foreground">
                    CLOSE
                  </Button>
                </div>
              </div>

              {/* Result area — scrollable, takes all remaining space */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    </div>
                    <p className="text-sm font-display tracking-wider text-muted-foreground animate-pulse">
                      GENERATING FULL ANALYSIS FOR {selectedState.toUpperCase()}...
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-body">
                      Crops, climate, costs & government schemes
                    </p>
                  </div>
                ) : result ? (
                  <div className="glass-panel p-6 farmers-ai-prose">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-primary/60" />
                    </div>
                    <p className="text-base text-muted-foreground font-body text-center max-w-md">
                      Click <strong className="text-primary">ANALYZE STATE</strong> to generate a comprehensive report — crop recommendations, climate analysis, cost breakdowns, and government schemes.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Intro / no state selected */
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8">
                <Wheat className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-lg tracking-[0.2em] text-foreground mb-3">SELECT A STATE</h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8 font-body">
                Click on any Indian state to get a complete AI-powered agricultural report — crops, climate, costs, and schemes in one go.
              </p>
              <Button variant="outline" onClick={() => handleStateSelect("Karnataka")} className="text-sm font-display tracking-wider gap-2 border-glow-warning/30 text-glow-warning hover:bg-glow-warning/10 h-10 px-6">
                <Leaf className="w-4 h-4" /> QUICK START: KARNATAKA
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmersPage;

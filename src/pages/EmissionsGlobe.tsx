import { useState } from "react";
import Globe3D from "@/components/Globe3D";
import { useCountryRankings } from "@/hooks/useClimateTrace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, TrendingUp, Brain, Loader2, X, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { aiCountryBrief } from "@/lib/aiService";

const EmissionsGlobe = () => {
  const [year, setYear] = useState(2024);
  const [gas, setGas] = useState("co2e_100yr");
  const { data: rankings, isLoading } = useCountryRankings(year, gas);

  const topCountries = (rankings as any[])?.slice(0, 10) || [];
  const totalEmissions = topCountries.reduce((sum: number, r: any) => sum + (r.emissionsQuantity || 0), 0);

  // AI country brief state
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const handleCountryClick = (marker: any) => {
    // Find full ranking data for this country
    const rankingEntry = (rankings as any[])?.find((r) => r.country === marker.country);
    setSelectedCountry({ ...marker, percentage: rankingEntry?.percentage ?? 0 });
    setBrief(null);
    setBriefLoading(true);
    aiCountryBrief({
      name: marker.name,
      code: marker.country,
      emissions: marker.emissions,
      rank: marker.rank,
      percentage: rankingEntry?.percentage ?? 0,
      year,
    })
      .then((res) => setBrief(res))
      .catch(() => setBrief(null))
      .finally(() => setBriefLoading(false));
  };

  const trajectoryIcon = (t: string) => {
    if (t === "rising") return <TrendingUp className="w-3.5 h-3.5 text-destructive" />;
    if (t === "falling") return <TrendingDown className="w-3.5 h-3.5 text-success" />;
    return <Minus className="w-3.5 h-3.5 text-warning" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Emissions Globe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive 3D visualization of global emissions by country · Climate TRACE
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022, 2021].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gas} onValueChange={setGas}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="co2e_100yr">CO₂e (100yr)</SelectItem>
              <SelectItem value="co2e_20yr">CO₂e (20yr)</SelectItem>
              <SelectItem value="co2">CO₂ only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 lg:col-span-2">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Brain className="w-3 h-3 text-primary" /> Click a spike for AI country brief
          </p>
          <Globe3D rankings={rankings || []} isLoading={isLoading} onCountryClick={handleCountryClick} />
        </div>

        {/* AI Country Brief Panel */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          {!selectedCountry && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <Brain className="w-8 h-8 text-primary/40" />
              <p className="text-sm text-muted-foreground">Click any emission spike on the globe to get an AI-generated country climate brief</p>
            </div>
          )}

          {selectedCountry && (
            <div className="space-y-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{selectedCountry.name}</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">#{selectedCountry.rank}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Gemini</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedCountry.emissions / 1e9).toFixed(2)}B t · {selectedCountry.percentage?.toFixed(1)}% global
                  </p>
                </div>
                <button onClick={() => { setSelectedCountry(null); setBrief(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {briefLoading && (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Generating brief…</span>
                </div>
              )}

              {brief && !briefLoading && (
                <div className="space-y-3 text-xs">
                  <p className="text-sm font-medium text-foreground leading-snug">{brief.headline}</p>

                  <div className="flex items-center gap-2">
                    {trajectoryIcon(brief.trajectory)}
                    <span className="text-muted-foreground capitalize font-medium">{brief.trajectory}</span>
                    <span className="text-muted-foreground/60">· {brief.trajectory_note}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{brief.emissions_context}</p>

                  {brief.top_sectors?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Top Emitting Sectors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {brief.top_sectors.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {brief.key_policy && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-primary/60 mb-1">Key Policy</p>
                      <p className="text-muted-foreground">{brief.key_policy}</p>
                    </div>
                  )}

                  {brief.india_connection && (
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-warning/60 mb-1">India Connection</p>
                      <p className="text-muted-foreground">{brief.india_connection}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-2.5">
                    <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Recommended: </span>{brief.one_action}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top emitters summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {topCountries.slice(0, 5).map((r: any) => (
          <div key={r.country} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-mono">#{r.rank}</span>
              <TrendingUp className="w-3 h-3 text-warning" />
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
            <p className="text-lg font-bold font-mono-data text-primary">
              {(r.emissionsQuantity / 1e9).toFixed(2)}B
            </p>
            <p className="text-xs text-muted-foreground">
              {r.percentage?.toFixed(1)}% of global
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmissionsGlobe;

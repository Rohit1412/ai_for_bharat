import { useState } from "react";
import Globe3D from "@/components/Globe3D";
import { useCountryRankings } from "@/hooks/useClimateTrace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, TrendingUp } from "lucide-react";

const EmissionsGlobe = () => {
  const [year, setYear] = useState(2024);
  const [gas, setGas] = useState("co2e_100yr");
  const { data: rankings, isLoading } = useCountryRankings(year, gas);

  const topCountries = (rankings as any[])?.slice(0, 10) || [];
  const totalEmissions = topCountries.reduce((sum: number, r: any) => sum + (r.emissionsQuantity || 0), 0);

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

      <div className="glass-card rounded-xl p-4">
        <Globe3D rankings={rankings || []} isLoading={isLoading} />
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

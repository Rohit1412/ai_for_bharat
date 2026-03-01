import { useState, useMemo } from "react";
import { useCountryRankings } from "@/hooks/useClimateTrace";
import { useRegionalData } from "@/hooks/useClimateData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, Line,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, Search, Database, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SECTOR_COLORS = [
  "hsl(160, 60%, 45%)", "hsl(200, 80%, 55%)", "hsl(30, 90%, 55%)",
  "hsl(340, 70%, 55%)", "hsl(270, 60%, 55%)", "hsl(50, 80%, 50%)",
  "hsl(180, 50%, 45%)", "hsl(0, 60%, 50%)", "hsl(120, 40%, 45%)",
  "hsl(220, 60%, 55%)",
];

const continentMap: Record<string, string> = {
  CHN: "Asia", IND: "Asia", JPN: "Asia", KOR: "Asia", IDN: "Asia", THA: "Asia",
  VNM: "Asia", MYS: "Asia", PAK: "Asia", BGD: "Asia", PHL: "Asia", MMR: "Asia",
  USA: "North America", CAN: "North America", MEX: "North America",
  BRA: "South America", ARG: "South America", COL: "South America", VEN: "South America",
  CHL: "South America", PER: "South America",
  DEU: "Europe", GBR: "Europe", FRA: "Europe", ITA: "Europe", POL: "Europe",
  TUR: "Europe", UKR: "Europe", RUS: "Europe",
  ZAF: "Africa", NGA: "Africa", EGY: "Africa", DZA: "Africa", ETH: "Africa",
  KEN: "Africa", TZA: "Africa", AGO: "Africa", MOZ: "Africa", LBY: "Africa",
  AUS: "Oceania",
  SAU: "Middle East", ARE: "Middle East", IRN: "Middle East", IRQ: "Middle East",
  QAT: "Middle East", KWT: "Middle East", OMN: "Middle East",
};

const EmissionsData = () => {
  const [year, setYear] = useState(2024);
  const [gas, setGas] = useState("co2e_100yr");
  const [search, setSearch] = useState("");
  const { data: rankings, isLoading } = useCountryRankings(year, gas);
  const { data: regionalData } = useRegionalData();

  const filteredRankings = useMemo(() => {
    if (!rankings) return [];
    return (rankings as any[]).filter(
      (r: any) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.country?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rankings, search]);

  const top10 = useMemo(() => {
    if (!rankings) return [];
    return (rankings as any[]).slice(0, 10).map((r: any) => ({
      name: r.name?.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
      emissions: +(r.emissionsQuantity / 1e9).toFixed(2),
    }));
  }, [rankings]);

  const sectorData = useMemo(() => {
    if (!rankings) return [];
    return (rankings as any[]).slice(0, 10).map((r: any) => ({
      name: r.name?.length > 15 ? r.name.slice(0, 15) + "…" : r.name,
      value: +(r.emissionsQuantity / 1e9).toFixed(2),
    }));
  }, [rankings]);

  const totalEmissions = useMemo(() => {
    if (!rankings) return 0;
    return (rankings as any[]).reduce((sum: number, r: any) => sum + (r.emissionsQuantity || 0), 0);
  }, [rankings]);

  // --- Charts from EmissionsCharts ---
  const continentData = useMemo(() => {
    if (!rankings) return [];
    const map: Record<string, number> = {};
    (rankings as any[]).forEach((r: any) => {
      const cont = continentMap[r.country] || "Other";
      map[cont] = (map[cont] || 0) + (r.emissionsQuantity || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, emissions: +(value / 1e9).toFixed(2) }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [rankings]);

  const radarData = useMemo(() => {
    if (!rankings) return [];
    return (rankings as any[]).slice(0, 8).map((r: any) => ({
      country: r.name?.slice(0, 10) || r.country,
      emissions: +(r.emissionsQuantity / 1e9).toFixed(2),
      percentage: +(r.percentage || 0).toFixed(1),
    }));
  }, [rankings]);

  const regionalComparison = useMemo(() => {
    if (!regionalData) return [];
    return regionalData.map((r) => ({
      region: r.region_name,
      stored: Number(r.emissions),
      trend: Number(r.trend_percentage) || 0,
    }));
  }, [regionalData]);

  const continentColors = ["hsl(160, 60%, 45%)", "hsl(200, 80%, 55%)", "hsl(30, 90%, 55%)", "hsl(340, 70%, 55%)", "hsl(270, 60%, 55%)", "hsl(50, 80%, 50%)", "hsl(180, 50%, 45%)"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Emissions Data
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Country-level emissions data from Climate TRACE
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022, 2021].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gas} onValueChange={setGas}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="co2e_100yr">CO₂e (100yr)</SelectItem>
              <SelectItem value="co2e_20yr">CO₂e (20yr)</SelectItem>
              <SelectItem value="co2">CO₂ only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Global Emissions</p>
          <p className="text-2xl font-bold font-mono-data text-foreground">
            {(totalEmissions / 1e9).toFixed(2)}B
          </p>
          <p className="text-xs text-muted-foreground">tonnes CO₂e · {year}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Countries Tracked</p>
          <p className="text-2xl font-bold font-mono-data text-foreground">
            {(rankings as any[])?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground">nations reporting</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Top Emitter</p>
          <p className="text-2xl font-bold font-mono-data text-foreground">
            {(rankings as any[])?.[0]?.name || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {((rankings as any[])?.[0]?.percentage || 0).toFixed(1)}% of global
          </p>
        </div>
      </div>

      {/* Charts Row 1 — existing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Top 10 Emitting Countries
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
              <XAxis type="number" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8 }}
                labelStyle={{ color: "hsl(215, 15%, 85%)" }}
                formatter={(value: number) => [`${value}B t`, "Emissions"]}
              />
              <Bar dataKey="emissions" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-info" />
            Emissions by Country top 10
          </h3>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value"
                  label={({ name, value }) => `${name.slice(0, 15)} (${value}B)`}
                  labelLine={{ stroke: "hsl(215, 15%, 40%)" }}
                >
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8 }}
                  formatter={(value: number) => [`${value}B t CO₂e`, "Emissions"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Loading sector data...
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 — moved from Emissions Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continental emissions */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Emissions by Continent ({year})
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={continentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8 }}
                formatter={(value: number) => [`${value}B t CO₂e`, "Emissions"]}
              />
              <Bar dataKey="emissions" radius={[4, 4, 0, 0]}>
                {continentData.map((_, i) => (
                  <Cell key={i} fill={continentColors[i % continentColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top 8 Emitters Radar</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(220, 18%, 20%)" />
              <PolarAngleAxis dataKey="country" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: "hsl(215, 15%, 40%)", fontSize: 9 }} />
              <Radar name="Emissions (Bt)" dataKey="emissions" stroke="hsl(160, 60%, 45%)" fill="hsl(160, 60%, 45%)" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional trend comparison — moved from Emissions Charts */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Regional Emissions & Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={regionalComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
            <XAxis dataKey="region" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8 }}
            />
            <Bar yAxisId="left" dataKey="stored" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} name="Emissions (GtCO₂)" />
            <Line yAxisId="right" type="monotone" dataKey="trend" stroke="hsl(30, 90%, 55%)" strokeWidth={2} name="Trend %" dot={{ fill: "hsl(30, 90%, 55%)" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Country Table */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">All Countries</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Emissions (Bt CO₂e)</TableHead>
                <TableHead className="text-right">% of Global</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><div className="h-6 bg-muted/30 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredRankings.map((r: any) => (
                  <TableRow key={r.country}>
                    <TableCell>
                      <Badge variant={r.rank <= 10 ? "destructive" : r.rank <= 30 ? "secondary" : "outline"} className="font-mono text-xs">
                        #{r.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right font-mono-data">
                      {(r.emissionsQuantity / 1e9).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono-data">
                      {r.percentage?.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default EmissionsData;
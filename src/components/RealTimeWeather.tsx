import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Thermometer, Droplets, Wind, Eye, Sun, Cloud, CloudRain,
  CloudSnow, Loader2, RefreshCw, AlertTriangle, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherEntry {
  country: string;
  resolvedAddress?: string;
  temp?: number;
  feelslike?: number;
  humidity?: number;
  windspeed?: number;
  pressure?: number;
  visibility?: number;
  uvindex?: number;
  conditions?: string;
  icon?: string;
  cloudcover?: number;
  precip?: number;
  snow?: number;
  datetime?: string;
  sunrise?: string;
  sunset?: string;
  error?: string;
}

const DEFAULT_COUNTRIES = [
  "India", "United States", "China", "United Kingdom",
  "Brazil", "Japan", "Germany", "South Africa",
  "Australia", "Nigeria",
];

const weatherIconMap: Record<string, typeof Sun> = {
  "clear-day": Sun, "clear-night": Sun,
  "partly-cloudy-day": Cloud, "partly-cloudy-night": Cloud,
  cloudy: Cloud, rain: CloudRain, snow: CloudSnow,
};

interface RealTimeWeatherProps {
  countries?: string[];
  onDataLoaded?: (data: WeatherEntry[]) => void;
}

export { DEFAULT_COUNTRIES };
export type { WeatherEntry };

export default function RealTimeWeather({ countries, onDataLoaded }: RealTimeWeatherProps = {}) {
  const activeCountries = countries && countries.length > 0 ? countries : DEFAULT_COUNTRIES;
  const countriesKey = activeCountries.join(",");
  const [data, setData] = useState<WeatherEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fromCache, setFromCache] = useState(0);

  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const countryList = countriesKey.split(",");

      // Check DB cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
        const { data: cached } = await supabase
          .from("weather_cache")
          .select("country, data, fetched_at")
          .in("country", countryList)
          .gte("fetched_at", cutoff);

        if (cached && cached.length === countryList.length) {
          const weatherData = cached.map((c) => c.data as unknown as WeatherEntry);
          setData(weatherData);
          setFromCache(cached.length);
          setLastUpdated(new Date(cached[0].fetched_at));
          onDataLoaded?.(weatherData);
          setLoading(false);
          return;
        }
      }

      // Cache miss or stale — call edge function (which also updates DB cache)
      const { data: result, error: fnError } = await supabase.functions.invoke("weather-data", {
        body: { countries: countryList },
      });
      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);
      const weatherData = result.data || [];
      setData(weatherData);
      setFromCache(result.fromCache || 0);
      setLastUpdated(new Date());
      onDataLoaded?.(weatherData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, [countriesKey, onDataLoaded]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && data.length === 0) {
    return (
      <div className="glass-panel p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="text-sm text-muted-foreground">Fetching weather data...</span>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center gap-2 text-glow-danger text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <button onClick={() => fetchData()} className="flex items-center gap-2 text-xs font-display tracking-wider text-accent hover:text-primary transition-colors">
          <RefreshCw className="w-3 h-3" /> RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="text-[9px] font-mono text-primary animate-pulse">● LIVE</span>
          {fromCache > 0 && (
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" /> {fromCache}/{data.length} cached
            </span>
          )}
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-display tracking-wider text-accent hover:text-primary transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          REFRESH
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((entry, i) => {
          if (entry.error) {
            return (
              <motion.div key={entry.country} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-panel p-4 border-l-2 border-l-glow-danger">
                <div className="font-display text-sm tracking-wider text-foreground mb-1">{entry.country}</div>
                <div className="text-xs text-glow-danger flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {entry.error}
                </div>
              </motion.div>
            );
          }

          const WeatherIcon = weatherIconMap[entry.icon || ""] || Cloud;
          const tempColor = (entry.temp ?? 0) > 35 ? "text-glow-danger" : (entry.temp ?? 0) > 25 ? "text-glow-warning" : "text-primary";

          return (
            <motion.div key={entry.country} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display text-sm font-semibold tracking-wider text-foreground">{entry.country}</div>
                  <div className="text-xs text-muted-foreground">{entry.resolvedAddress}</div>
                </div>
                <div className="flex items-center gap-2">
                  <WeatherIcon className={`w-5 h-5 ${tempColor}`} />
                  <span className={`font-display text-xl font-bold ${tempColor}`}>{entry.temp?.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-3 italic">{entry.conditions}</div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Thermometer className="w-3 h-3 text-glow-warning" />
                  <span className="text-muted-foreground">Feels</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.feelslike?.toFixed(1)}°</span>
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Droplets className="w-3 h-3 text-accent" />
                  <span className="text-muted-foreground">Hum</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.humidity}%</span>
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Wind className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">Wind</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.windspeed}km/h</span>
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Vis</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.visibility}km</span>
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Sun className="w-3 h-3 text-glow-warning" />
                  <span className="text-muted-foreground">UV</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.uvindex}</span>
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <Cloud className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Cloud</span>
                  <span className="text-foreground font-semibold ml-auto">{entry.cloudcover}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground/60">
                <span>🌅 {entry.sunrise}</span>
                <span>🌇 {entry.sunset}</span>
                <span>{entry.datetime}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

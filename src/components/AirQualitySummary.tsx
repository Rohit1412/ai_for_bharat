import { Wind } from "lucide-react";
import { useAirQuality } from "@/hooks/useOpenMeteo";

// WHO Air Quality Guidelines thresholds
function getAqiColor(pollutant: string, value: number | null): string {
  if (value === null || value === undefined) return "text-muted-foreground";
  if (pollutant === "pm2_5") {
    if (value <= 15) return "text-success";
    if (value <= 35) return "text-warning";
    return "text-destructive";
  }
  if (pollutant === "pm10") {
    if (value <= 45) return "text-success";
    if (value <= 100) return "text-warning";
    return "text-destructive";
  }
  if (pollutant === "ozone") {
    if (value <= 60) return "text-success";
    if (value <= 120) return "text-warning";
    return "text-destructive";
  }
  if (pollutant === "uv_index") {
    if (value <= 2) return "text-success";
    if (value <= 5) return "text-warning";
    return "text-destructive";
  }
  return "text-muted-foreground";
}

function getAqiLabel(pm25: number | null): { label: string; color: string } {
  if (pm25 === null || pm25 === undefined) return { label: "N/A", color: "text-muted-foreground" };
  if (pm25 <= 15) return { label: "Good", color: "text-success" };
  if (pm25 <= 35) return { label: "Moderate", color: "text-warning" };
  if (pm25 <= 55) return { label: "Unhealthy (SG)", color: "text-orange-400" };
  return { label: "Unhealthy", color: "text-destructive" };
}

interface AirQualitySummaryProps {
  latitude?: number;
  longitude?: number;
  cityName?: string;
}

const AirQualitySummary = ({ latitude = 28.6139, longitude = 77.209, cityName = "New Delhi" }: AirQualitySummaryProps) => {
  const { data, isLoading, isError } = useAirQuality(latitude, longitude);

  const current = data?.current;
  const aqi = getAqiLabel(current?.pm2_5 ?? null);

  const metrics = [
    { key: "pm2_5", label: "PM2.5", value: current?.pm2_5, unit: "μg/m³" },
    { key: "pm10", label: "PM10", value: current?.pm10, unit: "μg/m³" },
    { key: "ozone", label: "O₃", value: current?.ozone, unit: "μg/m³" },
    { key: "uv_index", label: "UV", value: current?.uv_index, unit: "idx" },
  ];

  return (
    <div className="glass-card rounded-xl p-5 opacity-0 animate-fade-in-up animate-delay-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
            <Wind className="w-4 h-4 text-info" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Air Quality</h3>
            <p className="text-xs text-muted-foreground">{cityName} · Live via Open-Meteo</p>
          </div>
        </div>
        {!isLoading && !isError && (
          <span className={`text-xs font-semibold px-2 py-1 rounded bg-muted ${aqi.color}`}>
            {aqi.label}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-muted-foreground text-center py-4">Air quality data unavailable</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-lg font-bold font-mono ${getAqiColor(m.key, m.value ?? null)}`}>
                {m.value !== null && m.value !== undefined ? Math.round(m.value) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{m.unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AirQualitySummary;

import { useRegionalData } from "@/hooks/useClimateData";
import { ScrollArea } from "@/components/ui/scroll-area";

const colorMap: Record<string, string> = {
  "USA": "bg-primary",
  "Russia": "bg-info",
  "Canada": "bg-warning",
  "Brazil": "bg-destructive",
  "Australia": "bg-muted-foreground",
  "Iran": "bg-primary",
  "Saudi Arabia": "bg-warning",
  "Bolivia": "bg-info",
};

const RegionalOverview = () => {
  const { data: regions, isLoading } = useRegionalData();

  const sorted = regions?.slice().sort((a, b) => Number(b.emissions) - Number(a.emissions)) || [];
  const maxEmissions = sorted.length > 0 ? Number(sorted[0].emissions) : 1;

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in-up animate-delay-3 h-full flex flex-col">
      <div className="mb-5 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Regional Emissions</h3>
        <p className="text-xs text-muted-foreground mt-1">GtCO₂ per year by region</p>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ScrollArea className="flex-1 -mr-3 pr-3" style={{ maxHeight: "320px" }}>
          <div className="space-y-3">
            {sorted.map((region) => {
              const trend = Number(region.trend_percentage) || 0;
              return (
                <div key={region.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground font-medium truncate max-w-[140px]">{region.region_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-xs text-foreground">{Number(region.emissions).toFixed(1)}</span>
                      <span className={`text-xs font-mono ${trend < 0 ? "text-success" : "text-destructive"}`}>
                        {trend > 0 ? "+" : ""}{trend}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorMap[region.region_name] || "bg-primary"} transition-all duration-1000 ease-out`}
                      style={{ width: `${(Number(region.emissions) / maxEmissions) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default RegionalOverview;

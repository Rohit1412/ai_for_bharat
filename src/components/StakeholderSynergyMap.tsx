import { useMemo } from "react";
import { GitMerge, AlertTriangle, Handshake } from "lucide-react";
import { useStakeholders, useActionPlans } from "@/hooks/useClimateData";

interface SynergyItem {
  type: "synergy" | "conflict";
  stakeholders: string[];
  reason: string;
  sector: string;
}

const StakeholderSynergyMap = () => {
  const { data: stakeholders } = useStakeholders();
  const { data: plans } = useActionPlans();

  const analysis = useMemo<SynergyItem[]>(() => {
    if (!stakeholders?.length || !plans?.length) return [];

    const items: SynergyItem[] = [];
    const regionGroups: Record<string, typeof stakeholders> = {};

    // Group stakeholders by region
    stakeholders.forEach(s => {
      const region = s.region?.toLowerCase().trim();
      if (!region) return;
      if (!regionGroups[region]) regionGroups[region] = [];
      regionGroups[region].push(s);
    });

    // Find synergies: multiple stakeholders in same region = potential collaboration
    Object.entries(regionGroups).forEach(([region, group]) => {
      if (group.length >= 2) {
        const types = [...new Set(group.map(s => s.type))];
        if (types.length >= 2) {
          items.push({
            type: "synergy",
            stakeholders: group.map(s => s.name),
            reason: `Cross-sector collaboration opportunity: ${types.join(" + ")} stakeholders in same region`,
            sector: region,
          });
        }
      }
    });

    // Find conflicts: overlapping sectors in plans from different stakeholder types
    const sectorPlans: Record<string, typeof plans> = {};
    plans.forEach(p => {
      const sector = p.sector?.toLowerCase().trim();
      if (!sector) return;
      if (!sectorPlans[sector]) sectorPlans[sector] = [];
      sectorPlans[sector].push(p);
    });

    Object.entries(sectorPlans).forEach(([sector, sectorPlanList]) => {
      if (sectorPlanList.length >= 2) {
        const activePlans = sectorPlanList.filter(p => p.status === "active" || p.status === "review");
        if (activePlans.length >= 2) {
          items.push({
            type: "conflict",
            stakeholders: activePlans.map(p => p.name),
            reason: `Multiple active/review plans in "${sector}" sector — potential resource competition or duplication`,
            sector,
          });
        }
      }
    });

    return items;
  }, [stakeholders, plans]);

  if (analysis.length === 0) return null;

  const synergies = analysis.filter(a => a.type === "synergy");
  const conflicts = analysis.filter(a => a.type === "conflict");

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <GitMerge className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Stakeholder Synergy & Conflict Analysis</h3>
      </div>

      {synergies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5 text-success" /> Synergy Opportunities ({synergies.length})
          </p>
          {synergies.map((s, i) => (
            <div key={`s${i}`} className="bg-success/5 border border-success/10 rounded-lg p-3">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {s.stakeholders.map(name => (
                  <span key={name} className="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">{name}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
            </div>
          ))}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Potential Conflicts ({conflicts.length})
          </p>
          {conflicts.map((c, i) => (
            <div key={`c${i}`} className="bg-warning/5 border border-warning/10 rounded-lg p-3">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {c.stakeholders.map(name => (
                  <span key={name} className="px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">{name}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{c.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StakeholderSynergyMap;

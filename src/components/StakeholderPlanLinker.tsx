import { useState } from "react";
import { Users, X, Plus } from "lucide-react";
import { useStakeholders } from "@/hooks/useClimateData";
import { useStakeholderPlans, useLinkStakeholder, useUnlinkStakeholder } from "@/hooks/useStakeholderPlans";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/hooks/useAuditLog";

interface Props {
  actionPlanId: string;
  actionPlanName: string;
}

const StakeholderPlanLinker = ({ actionPlanId, actionPlanName }: Props) => {
  const { data: allStakeholders } = useStakeholders();
  const { data: links } = useStakeholderPlans(actionPlanId);
  const linkMutation = useLinkStakeholder();
  const unlinkMutation = useUnlinkStakeholder();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [selectedStakeholder, setSelectedStakeholder] = useState("");

  const linkedIds = new Set(links?.map((l: any) => l.stakeholder_id) || []);
  const available = allStakeholders?.filter((s) => !linkedIds.has(s.id)) || [];

  const handleLink = async () => {
    if (!selectedStakeholder) return;
    try {
      await linkMutation.mutateAsync({ stakeholderId: selectedStakeholder, actionPlanId });
      const name = allStakeholders?.find((s) => s.id === selectedStakeholder)?.name;
      await logAuditEvent("create", "stakeholder_plans", actionPlanId, null, { stakeholder: name, plan: actionPlanName });
      toast({ title: `Linked ${name}` });
      setSelectedStakeholder("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUnlink = async (stakeholderId: string, stakeholderName: string) => {
    try {
      await unlinkMutation.mutateAsync({ stakeholderId, actionPlanId });
      await logAuditEvent("delete", "stakeholder_plans", actionPlanId, { stakeholder: stakeholderName, plan: actionPlanName }, null);
      toast({ title: `Unlinked ${stakeholderName}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="w-3.5 h-3.5" />
        <span>Linked Stakeholders ({links?.length || 0})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {links?.map((link: any) => (
          <div key={link.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {link.stakeholders?.name || "Unknown"}
            {isAdmin && (
              <button onClick={() => handleUnlink(link.stakeholder_id, link.stakeholders?.name)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {(!links || links.length === 0) && <span className="text-xs text-muted-foreground">No stakeholders linked</span>}
      </div>

      {isAdmin && available.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedStakeholder} onValueChange={setSelectedStakeholder}>
            <SelectTrigger className="w-48 h-8 text-xs bg-muted border-border">
              <SelectValue placeholder="Select stakeholder..." />
            </SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleLink} disabled={!selectedStakeholder}>
            <Plus className="w-3 h-3 mr-1" /> Link
          </Button>
        </div>
      )}
    </div>
  );
};

export default StakeholderPlanLinker;

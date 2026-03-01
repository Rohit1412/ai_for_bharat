import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStakeholderPlans = (actionPlanId?: string) => {
  return useQuery({
    queryKey: ["stakeholder-plans", actionPlanId],
    queryFn: async () => {
      let query = supabase.from("stakeholder_plans").select("*, stakeholders(id, name, type, region), action_plans(id, name)");
      if (actionPlanId) query = query.eq("action_plan_id", actionPlanId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useLinkStakeholder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stakeholderId, actionPlanId }: { stakeholderId: string; actionPlanId: string }) => {
      const { error } = await supabase.from("stakeholder_plans").insert({ stakeholder_id: stakeholderId, action_plan_id: actionPlanId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-plans"] });
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
  });
};

export const useUnlinkStakeholder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stakeholderId, actionPlanId }: { stakeholderId: string; actionPlanId: string }) => {
      const { error } = await supabase.from("stakeholder_plans").delete().eq("stakeholder_id", stakeholderId).eq("action_plan_id", actionPlanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-plans"] });
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
  });
};

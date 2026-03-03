import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/db";

export const usePlanComments = (actionPlanId: string) => {
  return useQuery({
    queryKey: ["plan-comments", actionPlanId],
    queryFn: async () => {
      // Return empty comments in demo mode
      if (isDemoMode()) return [];

      const { data: comments, error } = await supabase
        .from("plan_comments")
        .select("*")
        .eq("action_plan_id", actionPlanId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profile names for comment authors
      const userIds = [...new Set(comments?.map((c) => c.user_id) || [])];
      if (userIds.length === 0) return comments || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return (comments || []).map((c) => ({ ...c, profile: profileMap.get(c.user_id) || null }));
    },
    enabled: !!actionPlanId && !isDemoMode(),
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionPlanId, content, parentId }: { actionPlanId: string; content: string; parentId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("plan_comments").insert({
        action_plan_id: actionPlanId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["plan-comments", vars.actionPlanId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actionPlanId }: { id: string; actionPlanId: string }) => {
      const { error } = await supabase.from("plan_comments").delete().eq("id", id);
      if (error) throw error;
      return actionPlanId;
    },
    onSuccess: (actionPlanId) => {
      queryClient.invalidateQueries({ queryKey: ["plan-comments", actionPlanId] });
    },
  });
};

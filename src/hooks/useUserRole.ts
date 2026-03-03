import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user, isSkippedAuth } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      // In demo mode, give admin access
      if (isSkippedAuth) return ["admin", "analyst", "viewer"];
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!user || isSkippedAuth,
  });

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isAnalyst: roles.includes("analyst"),
    isViewer: roles.includes("viewer"),
    isLoading,
  };
};

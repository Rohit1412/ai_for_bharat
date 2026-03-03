import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Mock profile for demo mode
const MOCK_PROFILE = {
  id: "mock-profile-id",
  user_id: "00000000-0000-0000-0000-000000000000",
  full_name: "Demo User",
  organization: "ClimateAI Demo",
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useProfile = () => {
  const { user, isSkippedAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      // Return mock profile for demo mode
      if (isSkippedAuth) return MOCK_PROFILE;
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user || isSkippedAuth,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: { full_name?: string; organization?: string; avatar_url?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  return { profile, isLoading, updateProfile };
};

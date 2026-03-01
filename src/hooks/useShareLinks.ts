import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useShareLinks = () => {
  return useQuery({
    queryKey: ["share-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateShareLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ page, expiresAt }: { page: string; expiresAt?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("share_links").insert({
        created_by: user.id,
        page,
        expires_at: expiresAt || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["share-links"] }),
  });
};

export const useDeleteShareLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("share_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["share-links"] }),
  });
};

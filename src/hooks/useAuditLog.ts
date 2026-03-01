import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const logAuditEvent = async (action: string, tableName: string, recordId?: string, oldData?: any, newData?: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData,
    new_data: newData,
  });
};

export const useAuditLogs = (limit = 50) => {
  return useQuery({
    queryKey: ["audit-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
};

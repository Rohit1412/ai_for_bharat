import { useState, useEffect } from "react";
import { Settings, User, Shield, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logAuditEvent } from "@/hooks/useAuditLog";

const SettingsPage = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { isAdmin, roles } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setOrganization(profile.organization || "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName, organization });
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const { data: allUsers } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: allRoles } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const getUserRoles = (userId: string) => {
    return allRoles?.filter((r) => r.user_id === userId).map((r) => r.role) || [];
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles for this user
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Add new role if not "none"
      if (newRole !== "none") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "analyst" | "viewer" });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["all-roles"] });
      await logAuditEvent("role_change", "user_roles", userId, { old_role: getUserRoles(userId) }, { new_role: newRole });
      toast({ title: "Role updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" /> Profile
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50 border-border opacity-60" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Organization</Label>
            <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Roles</Label>
            <div className="flex gap-2">
              {roles.length > 0 ? roles.map((r) => (
                <span key={r} className="px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">{r}</span>
              )) : <span className="text-xs text-muted-foreground">No roles assigned</span>}
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-warning" /> User Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">User</th>
                  <th className="text-left pb-3 font-medium">Organization</th>
                  <th className="text-left pb-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {allUsers?.map((u) => {
                  const userRoles = getUserRoles(u.user_id);
                  const currentRole = userRoles[0] || "none";
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{u.full_name || "Unnamed"}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{u.organization || "—"}</td>
                      <td className="py-3">
                        <Select value={currentRole} onValueChange={(v) => handleRoleChange(u.user_id, v)}>
                          <SelectTrigger className="w-32 bg-muted border-border h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Role</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

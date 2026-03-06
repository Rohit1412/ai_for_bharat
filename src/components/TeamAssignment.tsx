import { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamAssignmentProps {
  actionId: string;
  currentTeam: string[];
  onUpdate: () => void;
}

export default function TeamAssignment({ actionId, currentTeam, onUpdate }: TeamAssignmentProps) {
  const [newMember, setNewMember] = useState("");
  const [saving, setSaving] = useState(false);

  const addMember = async () => {
    if (!newMember.trim()) return;
    const updated = [...currentTeam, newMember.trim()];
    setSaving(true);
    const { error } = await supabase
      .from("tracked_actions")
      .update({ assigned_team: updated })
      .eq("id", actionId);
    if (error) toast.error(error.message);
    else {
      toast.success(`${newMember.trim()} assigned!`);
      setNewMember("");
      onUpdate();
    }
    setSaving(false);
  };

  const removeMember = async (member: string) => {
    const updated = currentTeam.filter((m) => m !== member);
    const { error } = await supabase
      .from("tracked_actions")
      .update({ assigned_team: updated })
      .eq("id", actionId);
    if (error) toast.error(error.message);
    else onUpdate();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-display tracking-wider text-primary">TEAM ({currentTeam.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {currentTeam.map((m) => (
          <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] text-primary">
            {m}
            <button onClick={() => removeMember(m)} className="hover:text-destructive transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
          placeholder="Add team member..."
          className="flex-1 bg-background border border-border/50 rounded px-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={addMember}
          disabled={!newMember.trim() || saving}
          className="px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

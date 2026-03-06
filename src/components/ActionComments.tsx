import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Comment {
  id: string;
  action_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

interface ActionCommentsProps {
  actionId: string;
  actionTitle: string;
}

export default function ActionComments({ actionId, actionTitle }: ActionCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("action_comments")
      .select("*")
      .eq("action_id", actionId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      // Fetch display names for user_ids
      const userIds = [...new Set(data.filter(c => c.user_id).map(c => c.user_id!))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p.display_name || "User"]));
      }
      setComments(data.map(c => ({ ...c, profiles: { display_name: c.user_id ? (profileMap[c.user_id] || "User") : "Anonymous" } })));
    }
    setLoading(false);
  }, [actionId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${actionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "action_comments", filter: `action_id=eq.${actionId}` }, () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [actionId, fetchComments]);

  const handlePost = async () => {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("action_comments").insert({
      action_id: actionId,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) toast.error(error.message);
    else setNewComment("");
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("action_comments").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-accent" />
        <span className="text-[10px] font-display tracking-wider text-accent">COMMENTS ({comments.length})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-muted/20 rounded p-2.5 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-display tracking-wider text-primary">
                    {c.profiles?.display_name || "User"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                    {user && c.user_id === user.id && (
                      <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-foreground/80">{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-3">No comments yet</p>
          )}
        </div>
      )}

      {user && (
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
            placeholder="Add a comment..."
            className="flex-1 bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handlePost}
            disabled={!newComment.trim() || posting}
            className="px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

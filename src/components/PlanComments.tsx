import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { usePlanComments, useAddComment, useDeleteComment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Props {
  actionPlanId: string;
}

const PlanComments = ({ actionPlanId }: Props) => {
  const { data: comments } = usePlanComments(actionPlanId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");

  useRealtimeSubscription("plan_comments", ["plan-comments", actionPlanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment.mutateAsync({ actionPlanId, content: newComment.trim() });
    setNewComment("");
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Discussion ({comments?.length || 0})</span>
      </div>

      {comments && comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-medium flex-shrink-0 mt-0.5">
                {c.profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{c.profile?.full_name || "User"}</span>
                  <span className="text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-muted-foreground mt-0.5">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => deleteComment.mutate({ id: c.id, actionPlanId })}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="h-7 text-xs bg-muted border-border"
        />
        <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={!newComment.trim()}>
          <Send className="w-3 h-3" />
        </Button>
      </form>
    </div>
  );
};

export default PlanComments;

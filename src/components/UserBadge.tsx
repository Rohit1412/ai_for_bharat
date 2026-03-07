import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserBadge() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isGuest) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/50 text-[10px] font-mono text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>OBSERVER</span>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="text-[10px] font-display tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          SIGN IN
        </button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-[10px] font-mono text-primary">
          <User className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{user.user_metadata?.display_name || user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-1 rounded hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
}

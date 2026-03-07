import { useState } from "react";
import { motion } from "framer-motion";
import { Satellite, LogIn, UserPlus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { skipAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email for a confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    skipAuth();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none scan-line z-50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 glow-primary">
            <Satellite className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-sm font-bold tracking-[0.25em] text-foreground glow-text-primary">
            CLIMATE COORDINATOR
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">GLOBAL AI SYSTEM v3.2.1</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-xs font-display tracking-widest rounded transition-all ${
                mode === "login"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-display tracking-widest rounded transition-all ${
                mode === "signup"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] font-display tracking-widest text-muted-foreground mb-1 block">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Your name or organization"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-display tracking-widest text-muted-foreground mb-1 block">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="operator@climate.org"
              />
            </div>
            <div>
              <label className="text-[10px] font-display tracking-widest text-muted-foreground mb-1 block">
                PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary/20 border border-primary/40 text-primary font-display text-xs tracking-widest rounded hover:bg-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="w-3.5 h-3.5" /> AUTHENTICATE</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> CREATE ACCOUNT</>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-card/60 text-[10px] font-mono text-muted-foreground">OR</span>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="w-full py-2.5 border border-border/50 text-muted-foreground font-display text-xs tracking-widest rounded hover:border-primary/30 hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" /> CONTINUE AS OBSERVER
          </button>
          <p className="text-[10px] text-center text-muted-foreground/60">
            Observers have read-only access. Sign in to contribute actions and receive alerts.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, Lock, User, ArrowRight, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSkipAuth = () => {
    localStorage.setItem("climateai_skip_auth", "true");
    toast({
      title: "Demo Mode",
      description: "You're accessing the app in demo mode. Some features may be limited.",
    });
    navigate("/");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setShowForgot(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-info/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ClimateAI</h1>
              <p className="text-xs text-muted-foreground">Global Coordinator</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Coordinating<br />
            <span className="text-gradient-primary">Global Climate Action</span>
          </h2>
          <p className="text-muted-foreground max-w-md">
            AI-powered platform integrating real-time climate data, advanced modeling, and multi-objective optimization for evidence-based decision making.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Data Sources", value: "2,400+" },
            { label: "Active Plans", value: "147" },
            { label: "Stakeholders", value: "1,200+" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg p-3">
              <p className="text-lg font-semibold font-mono-data text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">ClimateAI</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {showForgot ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {showForgot
              ? "Enter your email to receive a reset link"
              : isSignUp
              ? "Join the global climate coordination effort"
              : "Sign in to your command center"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && !showForgot && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="pl-9 bg-muted border-border"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.org"
                  required
                  className="pl-9 bg-muted border-border"
                />
              </div>
            </div>

            {!showForgot && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-9 bg-muted border-border"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : showForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            {!showForgot && (
              <button
                onClick={() => setShowForgot(true)}
                className="text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setShowForgot(false); }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
            {showForgot && (
              <button
                onClick={() => setShowForgot(false)}
                className="text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Back to sign in
              </button>
            )}
          </div>

          {/* Skip Auth Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Skip Auth Button */}
          <Button
            variant="outline"
            onClick={handleSkipAuth}
            className="w-full mt-4"
            type="button"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Continue without Login
          </Button>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Demo mode uses sample data. Some features may be limited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

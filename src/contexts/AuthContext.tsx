import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SKIP_AUTH_KEY = "climateai_skip_auth";

// Mock user for skipped auth
const MOCK_USER: User = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@climateai.local",
  user_metadata: { full_name: "Demo User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
} as User;

const MOCK_SESSION: Session = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  user: MOCK_USER,
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  token_type: "bearer",
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  skipAuth: () => void;
  isSkippedAuth: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  skipAuth: () => {},
  isSkippedAuth: false,
});

export const useAuth = () => useContext(AuthContext);

export const isAuthSkipped = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SKIP_AUTH_KEY) === "true";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [skippedAuth, setSkippedAuth] = useState(false);

  useEffect(() => {
    // Check if auth was skipped
    if (isAuthSkipped()) {
      setSession(MOCK_SESSION);
      setSkippedAuth(true);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (skippedAuth || isAuthSkipped()) {
      localStorage.removeItem(SKIP_AUTH_KEY);
      setSession(null);
      setSkippedAuth(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const skipAuth = () => {
    localStorage.setItem(SKIP_AUTH_KEY, "true");
    setSession(MOCK_SESSION);
    setSkippedAuth(true);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signOut,
      skipAuth,
      isSkippedAuth: skippedAuth || isAuthSkipped()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

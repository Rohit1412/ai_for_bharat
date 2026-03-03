import { Navigate } from "react-router-dom";
import { useAuth, isAuthSkipped } from "@/contexts/AuthContext";
import { Leaf } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-primary animate-pulse">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if session exists OR auth was skipped
  if (!session && !isAuthSkipped()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import InsightsPage from "./pages/InsightsPage";
import ActionsPage from "./pages/ActionsPage";
import StakeholdersPage from "./pages/StakeholdersPage";
import FarmersPage from "./pages/FarmersPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthenticated = !!user || isGuest;

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={isAuthenticated ? <Index /> : <Navigate to="/auth" />} />
      <Route path="/insights" element={isAuthenticated ? <InsightsPage /> : <Navigate to="/auth" />} />
      <Route path="/actions" element={isAuthenticated ? <ActionsPage /> : <Navigate to="/auth" />} />
      <Route path="/stakeholders" element={isAuthenticated ? <StakeholdersPage /> : <Navigate to="/auth" />} />
      <Route path="/farmers" element={isAuthenticated ? <FarmersPage /> : <Navigate to="/auth" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

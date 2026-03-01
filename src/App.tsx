import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";

import Analytics from "@/pages/Analytics";
import ActionPlans from "@/pages/ActionPlans";
import Alerts from "@/pages/Alerts";
import Stakeholders from "@/pages/Stakeholders";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import AuditLog from "@/pages/AuditLog";
import ScenarioModeling from "@/pages/ScenarioModeling";
import EmissionsGlobe from "@/pages/EmissionsGlobe";
import EmissionsData from "@/pages/EmissionsData";

import ActivityFeed from "@/pages/ActivityFeed";
import AirQuality from "@/pages/AirQuality";
import SharedView from "@/pages/SharedView";
import ResearcherToolkit from "@/pages/ResearcherToolkit";
import DataComparison from "@/pages/DataComparison";
import AIForecast from "@/pages/AIForecast";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/shared/:token" element={<SharedView />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/global-overview" element={<EmissionsData />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/action-plans" element={<ActionPlans />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/stakeholders" element={<Stakeholders />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/scenarios" element={<ScenarioModeling />} />
              <Route path="/emissions-globe" element={<EmissionsGlobe />} />
              
              
              <Route path="/air-quality" element={<AirQuality />} />
              <Route path="/activity" element={<ActivityFeed />} />
              <Route path="/toolkit" element={<ResearcherToolkit />} />
              <Route path="/compare" element={<DataComparison />} />
              <Route path="/forecast" element={<AIForecast />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

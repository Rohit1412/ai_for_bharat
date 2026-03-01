import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Fallback seed data (used when DB is empty or unreachable) ──

const FALLBACK_METRICS = [
  { id: "fb-1", metric_type: "atmospheric_co2", value: 424.6, unit: "ppm", recorded_at: new Date().toISOString(), change_value: 0.6, change_label: "vs last year", source: "NOAA GML" },
  { id: "fb-2", metric_type: "global_temp_anomaly", value: 1.45, unit: "°C", recorded_at: new Date().toISOString(), change_value: 0.12, change_label: "vs 1951-1980 avg", source: "NASA GISS" },
  { id: "fb-3", metric_type: "methane_levels", value: 1923, unit: "ppb", recorded_at: new Date().toISOString(), change_value: 0.5, change_label: "annual increase", source: "NOAA GML" },
  { id: "fb-4", metric_type: "sea_level_rise", value: 3.7, unit: "mm/yr", recorded_at: new Date().toISOString(), change_value: 0.4, change_label: "acceleration rate", source: "NASA Sea Level" },
];

const FALLBACK_REGIONAL = [
  { id: "fr-1", region_name: "China", emissions: 12.1, trend_percentage: -1.2 },
  { id: "fr-2", region_name: "United States", emissions: 5.0, trend_percentage: -2.8 },
  { id: "fr-3", region_name: "India", emissions: 3.9, trend_percentage: 4.5 },
  { id: "fr-4", region_name: "European Union", emissions: 2.8, trend_percentage: -3.1 },
  { id: "fr-5", region_name: "Russia", emissions: 1.9, trend_percentage: 0.3 },
  { id: "fr-6", region_name: "Japan", emissions: 1.1, trend_percentage: -1.7 },
  { id: "fr-7", region_name: "Brazil", emissions: 1.0, trend_percentage: 2.1 },
  { id: "fr-8", region_name: "Indonesia", emissions: 0.8, trend_percentage: 3.4 },
  { id: "fr-9", region_name: "South Korea", emissions: 0.7, trend_percentage: -0.9 },
  { id: "fr-10", region_name: "Saudi Arabia", emissions: 0.6, trend_percentage: 1.8 },
];

const FALLBACK_PLANS = [
  { id: "fp-1", name: "Global Carbon Tax Initiative", sector: "Energy", status: "active", impact: "-2.4 GtCO₂/yr", progress: 42, description: "Phased carbon pricing across G20 nations", stakeholders_count: 14, created_at: new Date().toISOString(), deadline: "2030-12-31", feasibility_score: "high", technical_readiness: "ready" },
  { id: "fp-2", name: "Tropical Reforestation Program", sector: "Forestry", status: "active", impact: "-1.2 GtCO₂/yr", progress: 67, description: "Large-scale reforestation in Amazon, Congo, SE Asia", stakeholders_count: 8, created_at: new Date().toISOString(), deadline: "2035-06-30", feasibility_score: "high", technical_readiness: "ready" },
  { id: "fp-3", name: "Methane Reduction Mandate", sector: "Agriculture", status: "review", impact: "-0.8 GtCO₂e/yr", progress: 28, description: "Mandatory methane capture for livestock and rice paddies", stakeholders_count: 6, created_at: new Date().toISOString(), deadline: "2032-01-01", feasibility_score: "medium", technical_readiness: "prototype" },
  { id: "fp-4", name: "EV Transition Accelerator", sector: "Transport", status: "active", impact: "-1.5 GtCO₂/yr", progress: 55, description: "Ban ICE vehicle sales by 2035 in OECD nations", stakeholders_count: 22, created_at: new Date().toISOString(), deadline: "2035-01-01", feasibility_score: "medium", technical_readiness: "ready" },
  { id: "fp-5", name: "Ocean Carbon Capture", sector: "Research", status: "draft", impact: "-0.3 GtCO₂/yr", progress: 12, description: "Ocean alkalinity enhancement pilot programs", stakeholders_count: 3, created_at: new Date().toISOString(), deadline: "2040-12-31", feasibility_score: "low", technical_readiness: "research" },
];

const FALLBACK_ALERTS = [
  { id: "fa-1", title: "CO₂ exceeds 424 ppm", description: "Atmospheric CO₂ concentration has surpassed 424 ppm, approaching critical threshold of 450 ppm", level: "critical", resolved: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), recommended_actions: ["Accelerate carbon tax implementation", "Increase renewable energy targets"] },
  { id: "fa-2", title: "Arctic ice below seasonal average", description: "Arctic sea ice extent is 12% below the 30-year average for this time of year", level: "warning", resolved: false, created_at: new Date(Date.now() - 8 * 3600000).toISOString(), recommended_actions: ["Review polar monitoring frequency"] },
  { id: "fa-3", title: "India AQI spike in Delhi NCR", description: "PM2.5 levels in Delhi exceeded 250 μg/m³ for 3 consecutive days", level: "warning", resolved: false, created_at: new Date(Date.now() - 24 * 3600000).toISOString(), recommended_actions: ["Issue public health advisory", "Activate GRAP Stage III"] },
  { id: "fa-4", title: "Methane surge detected", description: "Global methane levels rising 0.5% YoY — fastest rate since 2020", level: "info", resolved: false, created_at: new Date(Date.now() - 48 * 3600000).toISOString(), recommended_actions: ["Expand methane monitoring network"] },
];

const FALLBACK_STAKEHOLDERS = [
  { id: "fs-1", name: "UNFCCC Secretariat", type: "International Org", region: "Global", email: "info@unfccc.int", phone: "", organization: "United Nations" },
  { id: "fs-2", name: "Ministry of Environment, India", type: "Government", region: "South Asia", email: "contact@moef.gov.in", phone: "", organization: "Government of India" },
  { id: "fs-3", name: "European Environment Agency", type: "Government", region: "Europe", email: "info@eea.europa.eu", phone: "", organization: "EU" },
  { id: "fs-4", name: "Climate Analytics", type: "Research", region: "Global", email: "contact@climateanalytics.org", phone: "", organization: "Climate Analytics" },
  { id: "fs-5", name: "Greenpeace International", type: "NGO", region: "Global", email: "info@greenpeace.org", phone: "", organization: "Greenpeace" },
  { id: "fs-6", name: "Shell Energy Transition", type: "Private Sector", region: "Europe", email: "", phone: "", organization: "Shell plc" },
];

// ── Hooks with fallback ──

export const useClimateMetrics = () => {
  return useQuery({
    queryKey: ["climate-metrics"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("climate_metrics")
          .select("*")
          .order("recorded_at", { ascending: false });
        if (error) throw error;
        return data && data.length > 0 ? data : FALLBACK_METRICS;
      } catch {
        return FALLBACK_METRICS;
      }
    },
  });
};

export const useRegionalData = () => {
  return useQuery({
    queryKey: ["regional-data"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("regional_data")
          .select("*")
          .order("region_name");
        if (error) throw error;
        return data && data.length > 0 ? data : FALLBACK_REGIONAL;
      } catch {
        return FALLBACK_REGIONAL;
      }
    },
  });
};

export const useActionPlans = () => {
  return useQuery({
    queryKey: ["action-plans"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("action_plans")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data && data.length > 0 ? data : FALLBACK_PLANS;
      } catch {
        return FALLBACK_PLANS;
      }
    },
  });
};

export const useAlerts = (resolved?: boolean) => {
  return useQuery({
    queryKey: ["alerts", resolved],
    queryFn: async () => {
      try {
        let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
        if (resolved !== undefined) {
          query = query.eq("resolved", resolved);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) return data;
        // Return fallback only for unresolved
        if (resolved === false || resolved === undefined) return FALLBACK_ALERTS;
        return [];
      } catch {
        return resolved === false || resolved === undefined ? FALLBACK_ALERTS : [];
      }
    },
    refetchInterval: 30000,
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

export const useStakeholders = () => {
  return useQuery({
    queryKey: ["stakeholders"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("stakeholders")
          .select("*")
          .order("name");
        if (error) throw error;
        return data && data.length > 0 ? data : FALLBACK_STAKEHOLDERS;
      } catch {
        return FALLBACK_STAKEHOLDERS;
      }
    },
  });
};

export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Mutation hooks for admin CRUD
export const useCreateActionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: { name: string; sector: string; status?: "active" | "review" | "draft" | "completed"; impact?: string; description?: string }) => {
      const { error } = await supabase.from("action_plans").insert([plan]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["action-plans"] }),
  });
};

export const useUpdateActionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; sector?: string; status?: "active" | "review" | "draft" | "completed"; impact?: string; progress?: number; description?: string }) => {
      const { error } = await supabase.from("action_plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["action-plans"] }),
  });
};

export const useDeleteActionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["action-plans"] }),
  });
};

export const useCreateStakeholder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stakeholder: { name: string; type: string; region: string; email?: string; phone?: string; organization?: string }) => {
      const { error } = await supabase.from("stakeholders").insert(stakeholder);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stakeholders"] }),
  });
};

export const useDeleteStakeholder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stakeholders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stakeholders"] }),
  });
};

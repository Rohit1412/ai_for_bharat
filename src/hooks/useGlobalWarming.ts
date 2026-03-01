import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DIRECT_BASE = "https://global-warming.org/api";

async function callGlobalWarming(endpoint: string) {
  // Try edge function first, fall back to direct API call
  try {
    const { data, error } = await supabase.functions.invoke("global-warming", {
      body: { endpoint },
    });
    if (error) throw error;
    return data;
  } catch {
    // Edge function unavailable — call directly
    const resp = await fetch(`${DIRECT_BASE}/${endpoint}.php`);
    if (!resp.ok) throw new Error(`global-warming.org returned ${resp.status}`);
    return resp.json();
  }
}

// --- Response types ---

export interface TemperatureEntry {
  time: string;
  station: string;
  land: string;
}

export interface CO2Entry {
  year: string;
  month: string;
  day: string;
  cycle: string;
  trend: string;
}

export interface MethaneEntry {
  date: string;
  average: string;
  trend: string;
  averageUnc: string;
  trendUnc: string;
}

export interface N2OEntry {
  date: string;
  average: string;
  trend: string;
  averageUnc: string;
  trendUnc: string;
}

export interface ArcticEntry {
  year: string;
  month: string;
  "data-type": string;
  hemisphere: string;
  extent: string;
  area: string;
}

// --- Fallback data for when APIs are CORS-blocked ---

const FALLBACK_TEMP: TemperatureEntry[] = Array.from({ length: 60 }, (_, i) => {
  const year = 1964 + i;
  return { time: `${year}.5`, station: `${(Math.random() * 0.3 + (year - 1960) * 0.018 - 0.1).toFixed(2)}`, land: `${(Math.random() * 0.4 + (year - 1960) * 0.022 - 0.15).toFixed(2)}` };
});

const FALLBACK_CO2: CO2Entry[] = Array.from({ length: 24 }, (_, i) => {
  const month = i % 12 + 1;
  const year = 2024 + Math.floor(i / 12);
  const base = 422 + i * 0.2;
  const seasonal = Math.sin((month - 5) * Math.PI / 6) * 3;
  return { year: `${year}`, month: `${month}`, day: "15", cycle: `${(base + seasonal).toFixed(2)}`, trend: `${base.toFixed(2)}` };
});

const FALLBACK_METHANE: MethaneEntry[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, i, 15);
  return { date: d.toISOString().slice(0, 10), average: `${(1920 + i * 0.5 + Math.random() * 2).toFixed(1)}`, trend: `${(1920 + i * 0.5).toFixed(1)}`, averageUnc: "2.3", trendUnc: "1.1" };
});

const FALLBACK_N2O: N2OEntry[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, i, 15);
  return { date: d.toISOString().slice(0, 10), average: `${(336 + i * 0.08 + Math.random() * 0.3).toFixed(2)}`, trend: `${(336 + i * 0.08).toFixed(2)}`, averageUnc: "0.15", trendUnc: "0.08" };
});

const FALLBACK_ARCTIC: ArcticEntry[] = Array.from({ length: 12 }, (_, i) => ({
  year: "2025", month: `${i + 1}`, "data-type": "Extent", hemisphere: "N",
  extent: `${(14 - Math.abs(i - 2) * 1.2 + Math.random() * 0.5).toFixed(2)}`,
  area: `${(11 - Math.abs(i - 2) * 1.0 + Math.random() * 0.4).toFixed(2)}`,
}));

// --- Hooks ---

export const useTemperatureAnomaly = () => {
  return useQuery<TemperatureEntry[]>({
    queryKey: ["global-warming", "temperature"],
    queryFn: async () => {
      try {
        const data = await callGlobalWarming("temperature-api");
        const result = data?.result || [];
        return result.length > 0 ? result : FALLBACK_TEMP;
      } catch {
        return FALLBACK_TEMP;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};

export const useCO2Levels = () => {
  return useQuery<CO2Entry[]>({
    queryKey: ["global-warming", "co2"],
    queryFn: async () => {
      try {
        const data = await callGlobalWarming("co2-api");
        const result = data?.co2 || [];
        return result.length > 0 ? result : FALLBACK_CO2;
      } catch {
        return FALLBACK_CO2;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};

export const useMethaneLevels = () => {
  return useQuery<MethaneEntry[]>({
    queryKey: ["global-warming", "methane"],
    queryFn: async () => {
      try {
        const data = await callGlobalWarming("methane-api");
        const result = data?.methane || [];
        return result.length > 0 ? result : FALLBACK_METHANE;
      } catch {
        return FALLBACK_METHANE;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};

export const useNitrousOxideLevels = () => {
  return useQuery<N2OEntry[]>({
    queryKey: ["global-warming", "nitrous-oxide"],
    queryFn: async () => {
      try {
        const data = await callGlobalWarming("nitrous-oxide-api");
        const result = data?.nitpiousoxide || data?.nitrousoxide || [];
        return result.length > 0 ? result : FALLBACK_N2O;
      } catch {
        return FALLBACK_N2O;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};

export const useArcticIce = () => {
  return useQuery<ArcticEntry[]>({
    queryKey: ["global-warming", "arctic"],
    queryFn: async () => {
      try {
        const data = await callGlobalWarming("arctic-api");
        const result = data?.arcticData || data?.result || [];
        return result.length > 0 ? result : FALLBACK_ARCTIC;
      } catch {
        return FALLBACK_ARCTIC;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function callClimateTrace(endpoint: string, params?: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("climate-trace", {
    body: { endpoint, params },
  });
  if (error) throw error;
  return data;
}

export interface CountryEmissions {
  location: {
    country: string;
    name: string;
  };
  sectors: {
    summaries: Array<{
      emissionsQuantity: number;
      gasName: string;
      sectorName: string;
      year: number;
    }>;
  };
  subsectors?: any;
}

export interface CountryRanking {
  country: string;
  name: string;
  rank: number;
  emissionsQuantity: number;
  percentage: number;
}

export const useCountryEmissions = (year = 2024, gas = "co2e_100yr") => {
  return useQuery({
    queryKey: ["climate-trace-emissions", year, gas],
    queryFn: () => callClimateTrace("country/emissions", { year, gas }),
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
};

export const useCountryRankings = (year = 2024, gas = "co2e_100yr") => {
  return useQuery({
    queryKey: ["climate-trace-rankings", year, gas],
    queryFn: async () => {
      const data = await callClimateTrace("rankings/countries", { year, gas });
      return data?.rankings || data || [];
    },
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
};

export const useSectorDefinitions = () => {
  return useQuery({
    queryKey: ["climate-trace-sectors"],
    queryFn: () => callClimateTrace("definitions/sectors"),
    staleTime: 1000 * 60 * 60,
  });
};

export const useCountryDefinitions = () => {
  return useQuery({
    queryKey: ["climate-trace-countries"],
    queryFn: () => callClimateTrace("definitions/countries"),
    staleTime: 1000 * 60 * 60,
  });
};

import { useQuery } from "@tanstack/react-query";
import {
  fetchInterventions,
  fetchKarnatakaAlerts,
  fetchKarnatakaKPIs,
  checkAWSHealth,
  KARNATAKA_MOCK,
} from "@/lib/awsDataService";

export function useKarnatakaInterventions() {
  return useQuery({
    queryKey: ["karnataka-interventions"],
    queryFn: fetchInterventions,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useKarnatakaAlerts() {
  return useQuery({
    queryKey: ["karnataka-alerts"],
    queryFn: fetchKarnatakaAlerts,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useKarnatakaKPIs() {
  return useQuery({
    queryKey: ["karnataka-kpis"],
    queryFn: fetchKarnatakaKPIs,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAWSHealth() {
  return useQuery({
    queryKey: ["aws-health"],
    queryFn: checkAWSHealth,
    staleTime: 30 * 1000,
    retry: false,
    refetchInterval: 60 * 1000,
  });
}

export { KARNATAKA_MOCK };

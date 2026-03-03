import { useState } from "react";
import { aiRunScenario } from "@/lib/aiService";

export interface ScenarioProjection {
  year: number;
  co2_ppm: number;
  temp_anomaly_c: number;
  sea_level_rise_mm_yr: number;
  methane_ppb: number;
}

export interface KeyImpact {
  area: string;
  impact: string;
  magnitude: "high" | "medium" | "low";
}

export interface EconomicAnalysis {
  estimated_cost_trillion_usd: number;
  gdp_impact_percent: number;
  jobs_created_millions: number;
  investment_needed_billion_usd_per_year: number;
}

export interface UncertaintyRanges {
  temp_low_c: number;
  temp_mid_c: number;
  temp_high_c: number;
  co2_low_ppm: number;
  co2_mid_ppm: number;
  co2_high_ppm: number;
}

export interface ScenarioResult {
  title: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  projections: ScenarioProjection[];
  baseline_projections: ScenarioProjection[];
  key_impacts: KeyImpact[];
  recommendations: string[];
  economic_analysis?: EconomicAnalysis;
  uncertainty_ranges?: UncertaintyRanges;
  co_benefits?: string[];
  political_feasibility?: "high" | "medium" | "low";
  interaction_effects?: string;
}

export interface ClimateBaseline {
  co2_ppm: number;
  temp_anomaly_c: number;
  sea_level_rise_mm_yr: number;
  methane_ppb: number;
}

const DEFAULT_BASELINE: ClimateBaseline = {
  co2_ppm: 425,
  temp_anomaly_c: 1.3,
  sea_level_rise_mm_yr: 3.6,
  methane_ppb: 1925,
};

export const useClimateScenario = () => {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScenario = async (scenario: string, baseline?: Partial<ClimateBaseline>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const currentMetrics = { ...DEFAULT_BASELINE, ...baseline };

    try {
      const data = await aiRunScenario(scenario, currentMetrics);
      setResult(data as unknown as ScenarioResult);
    } catch (e: any) {
      setError(e.message || "Failed to run scenario");
    } finally {
      setIsLoading(false);
    }
  };

  return { result, isLoading, error, runScenario, reset: () => { setResult(null); setError(null); } };
};

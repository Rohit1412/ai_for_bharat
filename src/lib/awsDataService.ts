/**
 * AWS Data Service
 * Fetches climate data from:
 *  1. AWS Lambda + DynamoDB (via API Gateway) — primary
 *  2. S3 public JSON files — secondary
 *  3. Embedded mock data — fallback
 */

const AWS_API_URL = (import.meta.env.VITE_AWS_API_URL || "").replace(/\/$/, "");
const S3_PUBLIC_URL = (import.meta.env.VITE_S3_PUBLIC_URL || "").replace(/\/$/, "");

// ── Embedded fallback data (from viriva-ai karnataka-mock.json) ───────────────

export const KARNATAKA_MOCK = {
  regions: {
    raichur: {
      name: "Raichur District",
      coordinates: [13.1986, 76.4129],
      paddy_hectares: 285000,
      annual_methane_tons: 12750,
      water_stress_index: 78,
      solar_potential_kwh_m2: 5.8,
      groundwater_depth_m: 8.2,
      active_projects: 12,
    },
    chikkaballapur: {
      name: "Chikkaballapur District",
      coordinates: [13.2298, 77.3374],
      paddy_hectares: 165000,
      annual_methane_tons: 7360,
      water_stress_index: 72,
      solar_potential_kwh_m2: 5.6,
      groundwater_depth_m: 7.5,
      active_projects: 8,
    },
  },
  kpis: {
    emissions_trend: { current: 45.2, target: 40.0, unit: "MtCO2e", change_percent: -12.0 },
    carbon_budget: { current: 1.8, total: 2.5, unit: "GtCO2e", remaining_percent: 72.0 },
    temp_rise_2030: { projection: 1.4, target: 1.2, unit: "°C", change_percent: 16.7 },
    water_risk_score: { current: 78, scale: 100, unit: "Score", change_percent: 5.0 },
  },
  alerts: [
    {
      id: "alert_1",
      region: "Raichur",
      type: "methane_spike",
      severity: "high",
      message: "Methane spike detected in flooded paddy fields (Sentinel-5P CO2M data)",
      current: 285,
      threshold: 250,
      unit: "ppb above baseline",
      recommended_action: "Switch 15% paddy area to Direct Seeded Rice (DSR) immediately",
    },
    {
      id: "alert_2",
      region: "Chikkaballapur",
      type: "water_stress",
      severity: "critical",
      message: "Groundwater depth dropped to 8.2m — critical threshold exceeded",
      current: 8.2,
      threshold: 7.0,
      unit: "meters",
      recommended_action: "Deploy solar agri-pumps with drip irrigation to reduce extraction by 30%",
    },
    {
      id: "alert_3",
      region: "Karnataka",
      type: "temperature",
      severity: "medium",
      message: "Temperature 2.1°C above seasonal average — heat stress risk for rabi crops",
      current: 34.1,
      threshold: 32.0,
      unit: "°C",
      recommended_action: "Issue heat advisory to farmers; recommend protective irrigation",
    },
  ],
  interventions: [
    {
      id: "int_1",
      name: "Solar Agri-Pumps",
      description: "Solar-powered pumps for irrigation — 25% water savings, 250 tCO₂e reduction",
      cost_range: "₹60,000 – ₹85,000",
      carbon_reduction_tco2e: 250,
      equity_score: 85,
      water_savings_percent: 25,
      timeline_months: 2,
      priority: "high",
    },
    {
      id: "int_2",
      name: "Direct Seeded Rice (DSR)",
      description: "Switch from flooded to direct-seeded rice — 30% water savings, 380 tCO₂e reduction",
      cost_range: "₹15,000 – ₹25,000",
      carbon_reduction_tco2e: 380,
      equity_score: 90,
      water_savings_percent: 30,
      timeline_months: 3,
      priority: "critical",
    },
    {
      id: "int_3",
      name: "Residue-to-Biogas",
      description: "Convert crop residue to biogas for cooking and lighting",
      cost_range: "₹50,000 – ₹95,000",
      carbon_reduction_tco2e: 180,
      equity_score: 75,
      water_savings_percent: 0,
      timeline_months: 4,
      priority: "medium",
    },
    {
      id: "int_4",
      name: "Dairy Methane Digesters",
      description: "Anaerobic digesters for dairy farms — converts manure to biogas",
      cost_range: "₹80,000 – ₹1,10,000",
      carbon_reduction_tco2e: 120,
      equity_score: 70,
      water_savings_percent: 5,
      timeline_months: 5,
      priority: "medium",
    },
    {
      id: "int_5",
      name: "Reforestation",
      description: "Reforestation on farm boundaries — shade, fodder, erosion control",
      cost_range: "₹5,000 – ₹15,000",
      carbon_reduction_tco2e: 150,
      equity_score: 95,
      water_savings_percent: 10,
      timeline_months: 12,
      priority: "low",
    },
  ],
};

// ── Helper ────────────────────────────────────────────────────────────────────

async function fetchWithFallback<T>(
  apiPath: string,
  s3Path: string,
  fallback: T
): Promise<T> {
  // 1. Try Lambda API
  if (AWS_API_URL) {
    try {
      const res = await fetch(`${AWS_API_URL}${apiPath}`);
      if (res.ok) return (await res.json()) as T;
    } catch {
      // fall through
    }
  }

  // 2. Try S3 public JSON
  if (S3_PUBLIC_URL) {
    try {
      const res = await fetch(`${S3_PUBLIC_URL}${s3Path}`);
      if (res.ok) return (await res.json()) as T;
    } catch {
      // fall through
    }
  }

  // 3. Embedded fallback
  return fallback;
}

// ── Public data fetchers ──────────────────────────────────────────────────────

export async function fetchInterventions() {
  const result = await fetchWithFallback<{ interventions?: typeof KARNATAKA_MOCK.interventions }>(
    "/api/interventions",
    "/data/interventions.json",
    { interventions: KARNATAKA_MOCK.interventions }
  );
  return result.interventions || KARNATAKA_MOCK.interventions;
}

export async function fetchKarnatakaAlerts() {
  const result = await fetchWithFallback<{ alerts?: typeof KARNATAKA_MOCK.alerts }>(
    "/api/alerts?region=Karnataka",
    "/data/alerts.json",
    { alerts: KARNATAKA_MOCK.alerts }
  );
  return result.alerts || KARNATAKA_MOCK.alerts;
}

export async function fetchKarnatakaKPIs() {
  return fetchWithFallback(
    "/api/kpis",
    "/data/kpis.json",
    KARNATAKA_MOCK.kpis
  );
}

/** Check if AWS backend is reachable */
export async function checkAWSHealth(): Promise<boolean> {
  if (!AWS_API_URL) return false;
  try {
    const res = await fetch(`${AWS_API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Store a report/export file via AWS API (saves to S3) */
export async function uploadToS3(
  fileName: string,
  content: string,
  contentType = "application/json"
): Promise<string | null> {
  if (!AWS_API_URL) return null;
  try {
    const res = await fetch(`${AWS_API_URL}/api/data/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, content, contentType }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.url || null;
    }
  } catch {
    // ignore
  }
  return null;
}

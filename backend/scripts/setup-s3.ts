/**
 * Creates and configures S3 buckets for ClimateAI.
 * Run: npx ts-node backend/scripts/setup-s3.ts
 *
 * Requires: AWS credentials configured (aws configure or env vars)
 * Region: ap-south-1
 */

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const client = new S3Client({ region: REGION });

const BUCKETS = {
  data: process.env.VITE_S3_BUCKET_DATA ?? "viriva-data-dev",
  pdfs: process.env.VITE_S3_BUCKET_PDFS ?? "viriva-exports-dev",
};

const CORS_CONFIG = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

const LIFECYCLE_CONFIG = {
  Rules: [
    {
      ID: "delete-temp-uploads-30d",
      Status: "Enabled" as const,
      Filter: { Prefix: "uploads/tmp/" },
      Expiration: { Days: 30 },
    },
  ],
};

async function bucketExists(name: string): Promise<boolean> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }));
    return true;
  } catch {
    return false;
  }
}

async function createBucket(name: string) {
  if (await bucketExists(name)) {
    console.log(`  ✓ ${name} — already exists, skipping`);
    return;
  }

  await client.send(
    new CreateBucketCommand({
      Bucket: name,
      CreateBucketConfiguration: { LocationConstraint: REGION },
    })
  );
  console.log(`  ✓ ${name} — created`);
}

async function seedKarnatakaData(bucket: string) {
  const karnatakaData = {
    regions: {
      raichur: {
        name: "Raichur District",
        coordinates: [16.2120, 77.3566],
        paddy_hectares: 285000,
        annual_methane_tons: 12750,
        water_stress_index: 78,
        solar_potential_kwh_m2: 5.8,
        groundwater_depth_m: 8.2,
        active_projects: 12,
        dominant_crop: "paddy",
        population: 1928812,
      },
      chikkaballapur: {
        name: "Chikkaballapur District",
        coordinates: [13.4355, 77.7280],
        paddy_hectares: 165000,
        annual_methane_tons: 7360,
        water_stress_index: 72,
        solar_potential_kwh_m2: 5.6,
        groundwater_depth_m: 5.2,
        active_projects: 8,
        dominant_crop: "paddy",
        population: 1254823,
      },
    },
    kpis: {
      emissions_trend:  { current: 45.2, target: 40.0, unit: "MtCO2e", change_percent: -12.0, status: "good" },
      carbon_budget:    { current: 1.8,  total: 2.5,   unit: "GtCO2e", remaining_percent: 72.0, status: "warning" },
      temp_rise_2030:   { projection: 1.4, target: 1.2, unit: "°C",    change_percent: 16.7, status: "critical" },
      water_risk_score: { current: 78, scale: 100, unit: "Score",       change_percent: 5.0, status: "critical" },
    },
    alerts: [
      { id: "alert_1", region: "Raichur",        type: "methane_spike",   severity: "high",     message: "Methane spike detected in flooded paddy fields (Sentinel-5P CO2M data)", threshold: 1200, current: 1450, unit: "ppb",    recommended_action: "Consider DSR adoption or biogas digester installation", timestamp: "2026-03-01T10:30:00Z" },
      { id: "alert_2", region: "Chikkaballapur", type: "water_stress",    severity: "critical", message: "Groundwater level critically low (5.2m depth)", threshold: 6.0, current: 5.2, unit: "meters", recommended_action: "Switch to solar agri-pumps or DSR to reduce irrigation", timestamp: "2026-03-01T09:15:00Z" },
      { id: "alert_3", region: "Raichur",        type: "residue_burning", severity: "medium",   message: "Crop residue burning detected (NO2 anomaly via Sentinel-5P)", threshold: 8.0, current: 9.5, unit: "ppb",    recommended_action: "Promote residue-to-biogas conversion or in-situ management", timestamp: "2026-03-01T08:00:00Z" },
    ],
    recommended_actions: [
      { id: "action_1", title: "Solar Agri-Pump Installation",     description: "Install solar-powered agricultural pumps to reduce diesel consumption and groundwater stress", impact_tco2e: 250, cost_range: "₹60,000–₹85,000",    timeline_months: 2, equity_score: 85, region: "Chikkaballapur", priority: 1, govt_scheme: "PM-KUSUM" },
      { id: "action_2", title: "Direct Seeded Rice (DSR) Adoption", description: "Switch from flooded rice to direct-seeded rice to reduce methane by 40% and water by 30%",  impact_tco2e: 380, cost_range: "₹15,000–₹25,000",   timeline_months: 3, equity_score: 90, region: "Raichur",        priority: 1, govt_scheme: "PKVY" },
      { id: "action_3", title: "Residue-to-Biogas Conversion",     description: "Convert crop residue burning to biogas digestion for energy and methane reduction",           impact_tco2e: 180, cost_range: "₹50,000–₹95,000",    timeline_months: 4, equity_score: 75, region: "Raichur",        priority: 2, govt_scheme: "GOBAR-Dhan" },
      { id: "action_4", title: "Dairy Methane Digesters",           description: "Install biogas digesters on dairy farms to capture methane from cattle manure",              impact_tco2e: 120, cost_range: "₹80,000–₹1,10,000", timeline_months: 5, equity_score: 70, region: "Chikkaballapur", priority: 2, govt_scheme: "National Biogas Programme" },
    ],
    intervention_library: [
      { id: "int_1", name: "Solar Agri-Pumps",         carbon_reduction_percent: 18.0, water_savings_percent: 25.0, equity_score: 85, feasibility_score: 80, cost_multiplier: 1.0 },
      { id: "int_2", name: "Direct Seeded Rice (DSR)", carbon_reduction_percent: 28.0, water_savings_percent: 30.0, equity_score: 90, feasibility_score: 75, cost_multiplier: 0.5 },
      { id: "int_3", name: "Residue-to-Biogas",        carbon_reduction_percent: 13.0, water_savings_percent:  0.0, equity_score: 75, feasibility_score: 65, cost_multiplier: 1.2 },
      { id: "int_4", name: "Dairy Methane Digesters",  carbon_reduction_percent:  9.0, water_savings_percent:  5.0, equity_score: 70, feasibility_score: 70, cost_multiplier: 1.5 },
      { id: "int_5", name: "Reforestation Programs",   carbon_reduction_percent: 15.0, water_savings_percent: 10.0, equity_score: 95, feasibility_score: 85, cost_multiplier: 0.3 },
    ],
    summary: {
      total_paddy_ha: 450000,
      annual_methane_tco2e: 20100000,
      active_projects: 20,
      projected_impact_tco2e: -2800000,
    },
    last_updated: new Date().toISOString(),
    source: "ClimateAI Karnataka Data Service — v2",
  };

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: "data/karnataka.json",
    Body: JSON.stringify(karnatakaData, null, 2),
    ContentType: "application/json",
  }));
  console.log(`  ✓ Seeded data/karnataka.json → ${bucket}`);

  // Global climate metrics snapshot
  const globalData = {
    metrics: [
      { id: "cm_1", metric_type: "atmospheric_co2",    value: 424.6, unit: "ppm",     change_value: 0.6,  source: "NOAA GML",   recorded_at: new Date().toISOString() },
      { id: "cm_2", metric_type: "global_temp_anomaly", value: 1.45, unit: "°C",     change_value: 0.12, source: "NASA GISS",  recorded_at: new Date().toISOString() },
      { id: "cm_3", metric_type: "methane_levels",      value: 1923, unit: "ppb",    change_value: 0.5,  source: "NOAA GML",   recorded_at: new Date().toISOString() },
      { id: "cm_4", metric_type: "sea_level_rise",      value: 3.7,  unit: "mm/yr",  change_value: 0.4,  source: "NASA SeaLevel", recorded_at: new Date().toISOString() },
      { id: "cm_5", metric_type: "arctic_sea_ice",      value: 10.2, unit: "M km²",  change_value: -1.4, source: "NSIDC",      recorded_at: new Date().toISOString() },
      { id: "cm_6", metric_type: "india_renewables_gw", value: 203,  unit: "GW",     change_value: 18.2, source: "MNRE",       recorded_at: new Date().toISOString() },
    ],
    regional_emissions: [
      { region_name: "China",         emissions: 12.1, trend_percentage: -1.2, unit: "GtCO₂/yr" },
      { region_name: "United States", emissions: 5.0,  trend_percentage: -2.8, unit: "GtCO₂/yr" },
      { region_name: "India",         emissions: 3.9,  trend_percentage:  4.5, unit: "GtCO₂/yr" },
      { region_name: "EU",            emissions: 2.8,  trend_percentage: -3.1, unit: "GtCO₂/yr" },
      { region_name: "Russia",        emissions: 1.9,  trend_percentage:  0.3, unit: "GtCO₂/yr" },
      { region_name: "Japan",         emissions: 1.1,  trend_percentage: -1.7, unit: "GtCO₂/yr" },
      { region_name: "Brazil",        emissions: 1.0,  trend_percentage:  2.1, unit: "GtCO₂/yr" },
      { region_name: "Indonesia",     emissions: 0.8,  trend_percentage:  3.4, unit: "GtCO₂/yr" },
      { region_name: "South Korea",   emissions: 0.7,  trend_percentage: -0.9, unit: "GtCO₂/yr" },
      { region_name: "Saudi Arabia",  emissions: 0.6,  trend_percentage:  1.8, unit: "GtCO₂/yr" },
    ],
    last_updated: new Date().toISOString(),
    source: "ClimateAI Global Data Service",
  };

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: "data/global-climate.json",
    Body: JSON.stringify(globalData, null, 2),
    ContentType: "application/json",
  }));
  console.log(`  ✓ Seeded data/global-climate.json → ${bucket}`);
}

async function main() {
  console.log(`Setting up S3 buckets in ${REGION}...\n`);

  // Create buckets
  console.log("Creating buckets:");
  for (const [key, name] of Object.entries(BUCKETS)) {
    try {
      await createBucket(name);
    } catch (e) {
      console.error(`  ✗ ${name} — ${(e as Error).message}`);
    }
  }

  // Apply CORS
  console.log("\nApplying CORS rules:");
  for (const name of Object.values(BUCKETS)) {
    try {
      await client.send(
        new PutBucketCorsCommand({ Bucket: name, CORSConfiguration: CORS_CONFIG })
      );
      console.log(`  ✓ ${name} — CORS applied`);
    } catch (e) {
      console.error(`  ✗ ${name} CORS — ${(e as Error).message}`);
    }
  }

  // Apply lifecycle to data bucket
  console.log("\nApplying lifecycle rules:");
  try {
    await client.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: BUCKETS.data,
        LifecycleConfiguration: LIFECYCLE_CONFIG,
      })
    );
    console.log(`  ✓ ${BUCKETS.data} — lifecycle applied`);
  } catch (e) {
    console.error(`  ✗ lifecycle — ${(e as Error).message}`);
  }

  // Seed Karnataka data
  console.log("\nSeeding Karnataka data:");
  try {
    await seedKarnatakaData(BUCKETS.data);
  } catch (e) {
    console.error(`  ✗ seed — ${(e as Error).message}`);
  }

  console.log("\nDone.");
}

main().catch(console.error);

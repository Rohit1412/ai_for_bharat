/**
 * Creates all DynamoDB tables and seeds them with initial data.
 * Run: npx ts-node backend/scripts/setup-dynamodb.ts
 *
 * Covers data used across: Dashboard, ActionPlans, Alerts, Stakeholders,
 *                          Reports, AIForecast, KarnatakaPanel
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const raw = new DynamoDBClient({ region: REGION });
const client = DynamoDBDocumentClient.from(raw);

// ── Table definitions ────────────────────────────────────────────────────────

const TABLES: CreateTableCommandInput[] = [
  {
    TableName: "viriva-alerts",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "region", AttributeType: "S" },
      { AttributeName: "id",     AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "region", KeyType: "HASH"  },
      { AttributeName: "id",     KeyType: "RANGE" },
    ],
  },
  {
    TableName: "viriva-interventions",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
    ],
  },
  {
    TableName: "viriva-action-plans",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "plan_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "plan_id", KeyType: "HASH" },
    ],
  },
  {
    TableName: "viriva-chat-history",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "chat_id",   AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "N" },
    ],
    KeySchema: [
      { AttributeName: "chat_id",   KeyType: "HASH"  },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
  },
  {
    TableName: "viriva-stakeholders",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
    ],
  },
  {
    TableName: "viriva-climate-metrics",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
    ],
  },
  {
    TableName: "viriva-farms-dev",
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "farm_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "farm_id", KeyType: "HASH" },
    ],
  },
];

// ── Seed data ────────────────────────────────────────────────────────────────

const NOW = Date.now();

const SEED_ALERTS = [
  // Karnataka/India alerts
  { region: "Raichur",        id: "alert_1", severity: "high",     type: "methane_spike",    message: "Methane spike detected in flooded paddy fields (Sentinel-5P CO2M data)", threshold: 1200, current: 1450, unit: "ppb", recommended_action: "Consider DSR adoption or biogas digester installation", timestamp: new Date("2026-03-01T10:30:00Z").getTime(), source: "satellite" },
  { region: "Chikkaballapur", id: "alert_2", severity: "critical",  type: "water_stress",     message: "Groundwater level critically low (5.2m depth)", threshold: 6.0, current: 5.2, unit: "meters", recommended_action: "Switch to solar agri-pumps or DSR to reduce irrigation", timestamp: new Date("2026-03-01T09:15:00Z").getTime(), source: "ground-sensor" },
  { region: "Raichur",        id: "alert_3", severity: "medium",    type: "residue_burning",  message: "Crop residue burning detected (NO2 anomaly via Sentinel-5P)", threshold: 8.0, current: 9.5, unit: "ppb", recommended_action: "Promote residue-to-biogas conversion or in-situ management", timestamp: new Date("2026-03-01T08:00:00Z").getTime(), source: "satellite" },
  // Global alerts
  { region: "Global",         id: "alert_4", severity: "critical",  type: "co2_threshold",    message: "Atmospheric CO₂ exceeds 424 ppm — approaching critical 450 ppm budget limit", threshold: 420, current: 424.6, unit: "ppm", recommended_action: "Accelerate carbon tax implementation; increase renewable energy targets", timestamp: NOW - 7200000, source: "NOAA GML" },
  { region: "Global",         id: "alert_5", severity: "warning",   type: "arctic_ice",       message: "Arctic sea ice extent 12% below 30-year seasonal average", threshold: 100, current: 88, unit: "% of avg", recommended_action: "Review polar monitoring frequency; update albedo feedback models", timestamp: NOW - 28800000, source: "NSIDC" },
  { region: "India",          id: "alert_6", severity: "warning",   type: "aqi_spike",        message: "PM2.5 levels in Delhi NCR exceeded 250 μg/m³ for 3 consecutive days", threshold: 150, current: 267, unit: "μg/m³", recommended_action: "Issue public health advisory; activate GRAP Stage III restrictions", timestamp: NOW - 86400000, source: "CPCB" },
  { region: "Global",         id: "alert_7", severity: "info",      type: "methane_global",   message: "Global methane levels rising 0.5% YoY — fastest rate since 2020", threshold: 1900, current: 1923, unit: "ppb", recommended_action: "Expand methane monitoring network; enforce agricultural emission cuts", timestamp: NOW - 172800000, source: "NOAA GML" },
  { region: "Karnataka",      id: "alert_8", severity: "medium",    type: "temperature",      message: "Temperature 2.1°C above seasonal average — heat stress risk for rabi crops", threshold: 32.0, current: 34.1, unit: "°C", recommended_action: "Issue heat advisory to farmers; recommend protective irrigation scheduling", timestamp: NOW - 3600000, source: "IMD" },
];

const SEED_INTERVENTIONS = [
  { id: "int_1", name: "Solar Agri-Pumps",         description: "Solar-powered pumps for irrigation — 25% water savings, 250 tCO₂e reduction per deployment", cost_range: "₹60,000–₹85,000",   carbon_reduction_tco2e: 250, equity_score: 85, water_savings_percent: 25, timeline_months: 2,  priority: "high",     carbon_reduction_percent: 18.0, feasibility_score: 80, cost_multiplier: 1.0, govt_scheme: "PM-KUSUM" },
  { id: "int_2", name: "Direct Seeded Rice (DSR)",  description: "Switch from flooded to direct-seeded rice — reduces methane 40%, water use 30%",              cost_range: "₹15,000–₹25,000",   carbon_reduction_tco2e: 380, equity_score: 90, water_savings_percent: 30, timeline_months: 3,  priority: "critical", carbon_reduction_percent: 28.0, feasibility_score: 75, cost_multiplier: 0.5, govt_scheme: "Paramparagat Krishi Vikas Yojana" },
  { id: "int_3", name: "Residue-to-Biogas",         description: "Convert crop residue burning to biogas digestion — energy generation + methane reduction",   cost_range: "₹50,000–₹95,000",   carbon_reduction_tco2e: 180, equity_score: 75, water_savings_percent: 0,  timeline_months: 4,  priority: "medium",   carbon_reduction_percent: 13.0, feasibility_score: 65, cost_multiplier: 1.2, govt_scheme: "GOBAR-Dhan Scheme" },
  { id: "int_4", name: "Dairy Methane Digesters",   description: "Anaerobic digesters on dairy farms capture methane from cattle manure for clean cooking gas", cost_range: "₹80,000–₹1,10,000", carbon_reduction_tco2e: 120, equity_score: 70, water_savings_percent: 5,  timeline_months: 5,  priority: "medium",   carbon_reduction_percent: 9.0,  feasibility_score: 70, cost_multiplier: 1.5, govt_scheme: "National Biogas Programme" },
  { id: "int_5", name: "Reforestation Programs",    description: "Reforestation on farm boundaries and wastelands — carbon sink + soil moisture retention",    cost_range: "₹5,000–₹15,000",    carbon_reduction_tco2e: 150, equity_score: 95, water_savings_percent: 10, timeline_months: 12, priority: "low",      carbon_reduction_percent: 15.0, feasibility_score: 85, cost_multiplier: 0.3, govt_scheme: "Green India Mission" },
  { id: "int_6", name: "Drip Irrigation Systems",   description: "Precision micro-irrigation reduces water use by 50%, fertiliser runoff by 30%",              cost_range: "₹40,000–₹70,000",   carbon_reduction_tco2e: 90,  equity_score: 80, water_savings_percent: 50, timeline_months: 2,  priority: "high",     carbon_reduction_percent: 7.0,  feasibility_score: 90, cost_multiplier: 0.8, govt_scheme: "Pradhan Mantri Krishi Sinchai Yojana" },
  { id: "int_7", name: "Community Wind Turbines",   description: "Small-scale wind turbines for rural electrification — reduces diesel dependency",            cost_range: "₹2,00,000–₹4,00,000", carbon_reduction_tco2e: 320, equity_score: 72, water_savings_percent: 0, timeline_months: 8, priority: "medium",   carbon_reduction_percent: 22.0, feasibility_score: 60, cost_multiplier: 2.0, govt_scheme: "MNRE Wind Energy Programme" },
];

const SEED_ACTION_PLANS = [
  { plan_id: "plan_1", name: "Global Carbon Tax Initiative",   sector: "Energy",       status: "active",    impact: "-2.4 GtCO₂/yr",   progress: 42, description: "Phased carbon pricing framework across G20 nations with border adjustment mechanism",           stakeholders_count: 14, deadline: "2030-12-31", feasibility_score: "high",   technical_readiness: "ready",     economic_cost: "$1.2T/yr", region: "Global",    created_at: NOW - 30 * 86400000 },
  { plan_id: "plan_2", name: "Tropical Reforestation Program", sector: "Forestry",     status: "active",    impact: "-1.2 GtCO₂/yr",   progress: 67, description: "Large-scale reforestation across Amazon basin, Congo rainforest, and Southeast Asian peatlands", stakeholders_count: 8,  deadline: "2035-06-30", feasibility_score: "high",   technical_readiness: "ready",     economic_cost: "$180B/yr", region: "Global",    created_at: NOW - 60 * 86400000 },
  { plan_id: "plan_3", name: "Methane Reduction Mandate",      sector: "Agriculture",  status: "review",    impact: "-0.8 GtCO₂e/yr",  progress: 28, description: "Mandatory methane capture for livestock operations and rice paddies exceeding 500 ha threshold",  stakeholders_count: 6,  deadline: "2032-01-01", feasibility_score: "medium", technical_readiness: "prototype", economic_cost: "$95B/yr",  region: "Global",    created_at: NOW - 15 * 86400000 },
  { plan_id: "plan_4", name: "EV Transition Accelerator",      sector: "Transport",    status: "active",    impact: "-1.5 GtCO₂/yr",   progress: 55, description: "Coordinated phase-out of internal combustion vehicle sales across OECD nations by 2035",          stakeholders_count: 22, deadline: "2035-01-01", feasibility_score: "medium", technical_readiness: "ready",     economic_cost: "$320B/yr", region: "Global",    created_at: NOW - 45 * 86400000 },
  { plan_id: "plan_5", name: "Ocean Carbon Capture Pilot",     sector: "Research",     status: "draft",     impact: "-0.3 GtCO₂/yr",   progress: 12, description: "Ocean alkalinity enhancement and seaweed cultivation pilot programs in 6 coastal nations",         stakeholders_count: 3,  deadline: "2040-12-31", feasibility_score: "low",    technical_readiness: "research",  economic_cost: "$40B/yr",  region: "Global",    created_at: NOW - 7 * 86400000  },
  { plan_id: "plan_6", name: "Karnataka DSR Scale-Up",         sector: "Agriculture",  status: "active",    impact: "-2.1 MtCO₂e/yr",  progress: 38, description: "State-wide rollout of Direct Seeded Rice across 450,000 ha paddy area in Karnataka by 2028",      stakeholders_count: 5,  deadline: "2028-06-30", feasibility_score: "high",   technical_readiness: "ready",     economic_cost: "₹850 Cr",  region: "Karnataka", created_at: NOW - 20 * 86400000 },
  { plan_id: "plan_7", name: "Solar Agri-Pump Mission",        sector: "Energy",       status: "active",    impact: "-0.8 MtCO₂e/yr",  progress: 61, description: "Deploy 50,000 solar agri-pumps under PM-KUSUM across water-stressed districts of Karnataka",       stakeholders_count: 4,  deadline: "2027-03-31", feasibility_score: "high",   technical_readiness: "ready",     economic_cost: "₹425 Cr",  region: "Karnataka", created_at: NOW - 90 * 86400000 },
  { plan_id: "plan_8", name: "India Renewable 500 GW Target",  sector: "Energy",       status: "review",    impact: "-4.0 GtCO₂/yr",   progress: 44, description: "National roadmap for 500 GW renewable energy capacity by 2030 — solar + wind + green hydrogen",   stakeholders_count: 18, deadline: "2030-12-31", feasibility_score: "medium", technical_readiness: "ready",     economic_cost: "$120B",    region: "India",     created_at: NOW - 180 * 86400000 },
];

const SEED_STAKEHOLDERS = [
  { id: "sk_1",  name: "UNFCCC Secretariat",              organization: "United Nations Framework Convention on Climate Change", type: "International Org", sector: "Policy",          region: "Global",     email: "secretariat@unfccc.int",           role: "Treaty body secretariat",        engagement_level: "high",   last_contact: "2026-02-15" },
  { id: "sk_2",  name: "Ministry of Environment India",   organization: "Government of India",                                  type: "Government",        sector: "Policy",          region: "South Asia", email: "contact@moef.gov.in",              role: "National climate focal point",   engagement_level: "high",   last_contact: "2026-02-28" },
  { id: "sk_3",  name: "European Environment Agency",     organization: "European Union",                                       type: "Government",        sector: "Monitoring",      region: "Europe",     email: "info@eea.europa.eu",               role: "Environmental data provider",    engagement_level: "medium", last_contact: "2026-01-20" },
  { id: "sk_4",  name: "Climate Analytics",               organization: "Climate Analytics GmbH",                               type: "Research",          sector: "Science",         region: "Global",     email: "contact@climateanalytics.org",     role: "Emissions scenario modelling",   engagement_level: "high",   last_contact: "2026-02-10" },
  { id: "sk_5",  name: "Greenpeace International",        organization: "Greenpeace",                                           type: "NGO",               sector: "Advocacy",        region: "Global",     email: "info@greenpeace.org",              role: "Policy advocacy & monitoring",   engagement_level: "medium", last_contact: "2026-01-05" },
  { id: "sk_6",  name: "Shell Energy Transition",         organization: "Shell plc",                                            type: "Private Sector",    sector: "Energy",          region: "Europe",     email: "energy.transition@shell.com",      role: "Low-carbon technology partner",  engagement_level: "low",    last_contact: "2025-12-15" },
  { id: "sk_7",  name: "Karnataka State Pollution Board", organization: "Government of Karnataka",                              type: "Government",        sector: "Monitoring",      region: "Karnataka",  email: "kspcb@kspcb.gov.in",               role: "State emission regulator",       engagement_level: "high",   last_contact: "2026-03-01" },
  { id: "sk_8",  name: "TERI — The Energy Resources Inst","organization": "TERI",                                               type: "Research",          sector: "Science",         region: "India",      email: "contact@teri.res.in",              role: "Climate research & advisory",    engagement_level: "high",   last_contact: "2026-02-20" },
  { id: "sk_9",  name: "World Resources Institute India", organization: "WRI India",                                            type: "NGO",               sector: "Policy",          region: "India",      email: "wriindia@wri.org",                 role: "Climate finance & policy",       engagement_level: "medium", last_contact: "2026-02-08" },
  { id: "sk_10", name: "Adani Green Energy",              organization: "Adani Group",                                          type: "Private Sector",    sector: "Energy",          region: "India",      email: "info@adanigreen.com",              role: "Large-scale solar developer",    engagement_level: "low",    last_contact: "2026-01-18" },
  { id: "sk_11", name: "C40 Cities Network",              organization: "C40",                                                  type: "International Org", sector: "Urban",           region: "Global",     email: "info@c40.org",                     role: "Urban climate action network",   engagement_level: "medium", last_contact: "2025-11-30" },
  { id: "sk_12", name: "ICAR — National Rice Research",  organization: "Indian Council of Agricultural Research",              type: "Research",          sector: "Agriculture",     region: "India",      email: "director@icar.gov.in",             role: "Crop research & DSR guidance",   engagement_level: "high",   last_contact: "2026-02-25" },
];

const SEED_METRICS = [
  { id: "cm_1", metric_type: "atmospheric_co2",    value: 424.6, unit: "ppm",    recorded_at: new Date().toISOString(), change_value: 0.6,  change_label: "vs last year",          source: "NOAA GML",         region: "Global", description: "Mauna Loa Observatory monthly mean" },
  { id: "cm_2", metric_type: "global_temp_anomaly", value: 1.45, unit: "°C",    recorded_at: new Date().toISOString(), change_value: 0.12, change_label: "vs 1951-1980 avg",       source: "NASA GISS",        region: "Global", description: "Surface temperature relative to baseline" },
  { id: "cm_3", metric_type: "methane_levels",      value: 1923, unit: "ppb",   recorded_at: new Date().toISOString(), change_value: 0.5,  change_label: "annual increase %",      source: "NOAA GML",         region: "Global", description: "Global atmospheric methane concentration" },
  { id: "cm_4", metric_type: "sea_level_rise",      value: 3.7,  unit: "mm/yr", recorded_at: new Date().toISOString(), change_value: 0.4,  change_label: "acceleration rate",      source: "NASA Sea Level",   region: "Global", description: "Satellite altimetry mean sea level trend" },
  { id: "cm_5", metric_type: "arctic_sea_ice",      value: 10.2, unit: "M km²", recorded_at: new Date().toISOString(), change_value: -1.4, change_label: "below 30yr avg",         source: "NSIDC",            region: "Arctic", description: "September Arctic sea ice minimum extent" },
  { id: "cm_6", metric_type: "india_co2_emissions", value: 3.9,  unit: "GtCO₂/yr", recorded_at: new Date().toISOString(), change_value: 4.5, change_label: "YoY growth %",        source: "IEA",              region: "India",  description: "India total energy-related CO₂ emissions" },
  { id: "cm_7", metric_type: "karnataka_methane",   value: 45.2, unit: "MtCO₂e", recorded_at: new Date().toISOString(), change_value: -12.0, change_label: "vs 2022 baseline",    source: "State Survey",     region: "Karnataka", description: "Karnataka agricultural methane emissions" },
  { id: "cm_8", metric_type: "india_renewables_gw", value: 203,  unit: "GW",    recorded_at: new Date().toISOString(), change_value: 18.2, change_label: "YoY growth %",          source: "MNRE",             region: "India",  description: "India total installed renewable capacity" },
];

const SEED_FARMS = [
  { farm_id: "farm_1", farmer_name: "Ramesh Nayak",    region: "Raichur",        area_ha: 4.2, crop: "paddy", irrigation: "canal",    soil_type: "black_cotton", lat: 16.2120, lng: 77.3566, active_interventions: ["int_2"],        annual_methane_kg: 420 },
  { farm_id: "farm_2", farmer_name: "Savitha Gowda",   region: "Chikkaballapur", area_ha: 2.8, crop: "paddy", irrigation: "borewell", soil_type: "red_loamy",    lat: 13.4355, lng: 77.7280, active_interventions: ["int_1","int_6"], annual_methane_kg: 280 },
  { farm_id: "farm_3", farmer_name: "Basavaraj Patil", region: "Raichur",        area_ha: 6.5, crop: "paddy", irrigation: "canal",    soil_type: "black_cotton", lat: 16.1994, lng: 77.2785, active_interventions: [],               annual_methane_kg: 650 },
  { farm_id: "farm_4", farmer_name: "Lakshmi Devi",    region: "Chikkaballapur", area_ha: 1.5, crop: "ragi",  irrigation: "rainfed",  soil_type: "red_laterite", lat: 13.2980, lng: 77.6410, active_interventions: ["int_5"],        annual_methane_kg: 45  },
  { farm_id: "farm_5", farmer_name: "Manjunath Reddy", region: "Raichur",        area_ha: 8.0, crop: "paddy", irrigation: "drip",     soil_type: "black_cotton", lat: 16.3100, lng: 77.4210, active_interventions: ["int_2","int_3"], annual_methane_kg: 510 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function tableExists(name: string): Promise<boolean> {
  try {
    await raw.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
}

async function createTable(tableInput: CreateTableCommandInput) {
  const name = tableInput.TableName!;
  if (await tableExists(name)) {
    console.log(`  ✓ ${name} — already exists`);
    return;
  }
  await raw.send(new CreateTableCommand(tableInput));
  console.log(`  ✓ ${name} — created`);
  // Brief wait for table to become ACTIVE
  await new Promise((r) => setTimeout(r, 2000));
}

async function seedItems(tableName: string, items: Record<string, unknown>[]) {
  // Batch write in chunks of 25 (DynamoDB limit)
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      })
    );
  }
  console.log(`    → seeded ${items.length} records`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSetting up DynamoDB tables in ${REGION}...\n`);

  console.log("1. Creating tables:");
  for (const t of TABLES) {
    try { await createTable(t); }
    catch (e) { console.error(`  ✗ ${t.TableName} — ${(e as Error).message}`); }
  }

  console.log("\n2. Seeding tables:");

  const seeds: Array<{ table: string; data: Record<string, unknown>[] }> = [
    { table: "viriva-alerts",          data: SEED_ALERTS as Record<string, unknown>[] },
    { table: "viriva-interventions",   data: SEED_INTERVENTIONS as Record<string, unknown>[] },
    { table: "viriva-action-plans",    data: SEED_ACTION_PLANS as Record<string, unknown>[] },
    { table: "viriva-stakeholders",    data: SEED_STAKEHOLDERS as Record<string, unknown>[] },
    { table: "viriva-climate-metrics", data: SEED_METRICS as Record<string, unknown>[] },
    { table: "viriva-farms-dev",       data: SEED_FARMS as Record<string, unknown>[] },
  ];

  for (const { table, data } of seeds) {
    console.log(`  ${table}:`);
    try { await seedItems(table, data); }
    catch (e) { console.error(`    ✗ seed failed — ${(e as Error).message}`); }
  }

  console.log("\nDone. All tables created and seeded.\n");
  console.log("Tables created:");
  TABLES.forEach((t) => console.log(`  • ${t.TableName}`));
}

main().catch(console.error);

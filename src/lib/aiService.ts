/**
 * Unified AI Service
 * Primary:  Google Gemini  (VITE_GEMINI_API_KEY)
 * Fallback: AWS Bedrock    (VITE_AWS_API_URL → Lambda)
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const AWS_API_URL = (import.meta.env.VITE_AWS_API_URL || "").replace(/\/$/, "");

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

type Role = "system" | "user" | "assistant";
type Message = { role: Role; content: string };

// ── Internal helpers ─────────────────────────────────────────────────────────

async function callGemini(messages: Message[], model = "gemini-2.0-flash-exp"): Promise<string> {
  if (!GEMINI_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, max_tokens: 2000 }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 120)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callBedrockLambda(prompt: string): Promise<string> {
  if (!AWS_API_URL) throw new Error("VITE_AWS_API_URL not configured");

  const res = await fetch(`${AWS_API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: prompt, language: "english" }),
  });

  if (!res.ok) throw new Error(`Lambda ${res.status}`);
  const data = await res.json();
  return data.answer || data.response || "";
}

/** Try Gemini, then Bedrock Lambda. Throws only if both fail. */
async function callAI(messages: Message[], geminiModel?: string): Promise<string> {
  const plainPrompt = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // Primary: Gemini
  if (GEMINI_KEY) {
    try {
      return await callGemini(messages, geminiModel);
    } catch {
      // fall through to Bedrock
    }
  }

  // Fallback: Bedrock via Lambda
  if (AWS_API_URL) {
    try {
      return await callBedrockLambda(plainPrompt);
    } catch {
      // fall through
    }
  }

  throw new Error("No AI service available – add VITE_GEMINI_API_KEY or VITE_AWS_API_URL");
}

// ── Public status ─────────────────────────────────────────────────────────────

export type AIProvider = "gemini" | "bedrock" | "none";

export function getActiveAIService(): AIProvider {
  if (GEMINI_KEY) return "gemini";
  if (AWS_API_URL) return "bedrock";
  return "none";
}

// ── Public AI calls ───────────────────────────────────────────────────────────

export async function aiChat(
  question: string,
  context: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a climate data analyst AI assistant for ClimateAI Global Coordinator – an AWS-powered command center for global climate action. Answer questions about climate metrics, emissions, action plans, and alerts. Keep answers concise (under 150 words) and cite numbers when possible.\n\nPage context:\n${context}`,
    },
    ...(history.slice(-6) as Message[]),
    { role: "user", content: question },
  ];
  return callAI(messages);
}

export async function aiGenerateBrief(model: "fast" | "advanced"): Promise<Record<string, unknown>> {
  const today = new Date().toISOString().slice(0, 10);
  const geminiModel =
    model === "advanced" ? "gemini-2.5-flash-preview-04-17" : "gemini-2.0-flash-exp";

  const prompt = `Generate a daily climate intelligence brief for ${today}.
Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "date": "${today}",
  "threat_level": "elevated",
  "headline": "string ≤120 chars",
  "executive_summary": "2-3 sentence paragraph",
  "key_developments": [
    {"title":"string","detail":"string","category":"emissions|temperature|policy|extreme_weather|technology|biodiversity","severity":"positive|neutral|concerning|critical"}
  ],
  "india_focus": {
    "headline":"string",
    "developments":["string"],
    "aqi_status":"string",
    "policy_update":"string"
  },
  "action_items": ["string"],
  "data_spotlight": {"metric":"string","value":"string","context":"string","trend":"rising|falling|stable"},
  "outlook": "string"
}
Focus on real climate data as of early 2026. Include India-specific context around renewable energy, AQI, and COP31 preparations.`;

  const messages: Message[] = [
    {
      role: "system",
      content: "You are a senior climate intelligence analyst. Return valid JSON only – no markdown, no extra text.",
    },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages, geminiModel);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned non-JSON response");

  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  parsed._model = GEMINI_KEY
    ? `gemini-${model === "advanced" ? "2.5" : "2.0"}-flash`
    : "bedrock-claude";
  parsed._generated_at = new Date().toISOString();
  return parsed;
}

export async function aiForecast(
  variable: string,
  historicalData: Array<{ year: number; value: number }>,
  model: "fast" | "advanced"
): Promise<Record<string, unknown>> {
  const variableLabels: Record<string, string> = {
    co2: "Atmospheric CO₂ (ppm)",
    temperature: "Global Temperature Anomaly (°C above pre-industrial)",
    methane: "Atmospheric Methane CH₄ (ppb)",
    n2o: "Atmospheric Nitrous Oxide N₂O (ppb)",
  };

  const geminiModel =
    model === "advanced" ? "gemini-2.5-flash-preview-04-17" : "gemini-2.0-flash-exp";
  const recentData = historicalData.slice(-20);

  const prompt = `You are a climate scientist. Generate a 10-year forecast (2026-2035) for: ${variableLabels[variable] || variable}.

Historical data (last ≤20 years): ${JSON.stringify(recentData)}

Return ONLY valid JSON (no markdown):
{
  "variable_name": "string",
  "current_value": number,
  "unit": "string",
  "trend_summary": "2-3 sentence summary with India implications",
  "annual_rate": number,
  "forecast": [{"year":number,"value":number,"lower_bound":number,"upper_bound":number}],
  "thresholds": [{"level":number,"label":"string","expected_year":number,"severity":"info|warning|critical"}],
  "india_implications": ["string (5 items max)"],
  "trajectory_changers": ["string (5 items max)"],
  "confidence": "high|medium|low",
  "methodology": "string"
}`;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate scientist providing data-driven forecasts. Return valid JSON only – no extra text or markdown.",
    },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages, geminiModel);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned non-JSON response");

  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  parsed._model = GEMINI_KEY
    ? `gemini-${model === "advanced" ? "2.5" : "2.0"}-flash`
    : "bedrock-claude";
  return parsed;
}

export async function aiSearch(
  question: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate search assistant for ClimateAI Global Coordinator. Answer questions about global emissions, climate metrics, action plans, alerts, stakeholders, and India's climate policy concisely (under 200 words).",
    },
    ...(history.slice(-4) as Message[]),
    { role: "user", content: question },
  ];
  return callAI(messages);
}

export async function aiGenerateActionPlan(
  title: string,
  description: string,
  region = "Global"
): Promise<string> {
  const prompt = `Generate a detailed climate action plan for:
Title: ${title}
Description: ${description}
Region: ${region}

Include: objectives, key milestones (quarterly), stakeholders, KPIs, risks, estimated CO₂ reduction, and cost range.
Keep it practical and actionable (300-500 words).`;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate action planning expert. Generate structured, evidence-based action plans for climate initiatives.",
    },
    { role: "user", content: prompt },
  ];
  return callAI(messages);
}

export async function aiTriageAlert(
  alertTitle: string,
  alertDescription: string,
  severity: string
): Promise<string> {
  const prompt = `Triage this climate alert and recommend immediate actions:
Title: ${alertTitle}
Description: ${alertDescription}
Severity: ${severity}

Provide: root cause analysis, immediate response steps (3-5 bullet points), escalation recommendations, and monitoring KPIs. Keep it under 200 words.`;

  const messages: Message[] = [
    {
      role: "system",
      content: "You are a climate emergency response coordinator. Provide rapid, actionable alert triage.",
    },
    { role: "user", content: prompt },
  ];
  return callAI(messages);
}

export async function aiTriageAllAlerts(alerts: Array<{ title: string; description?: string; severity: string }>): Promise<Record<string, unknown>> {
  const alertSummary = alerts
    .slice(0, 10)
    .map((a, i) => `${i + 1}. [${a.severity.toUpperCase()}] ${a.title}`)
    .join("\n");

  const prompt = `Triage these ${alerts.length} active climate alerts and return a JSON prioritization:
${alertSummary}

Return ONLY valid JSON:
{
  "priority_level": "critical|high|medium|low",
  "summary": "2-sentence overview",
  "top_alert": {"title": "string", "reason": "string", "immediate_action": "string"},
  "prioritized_alerts": [{"rank": number, "title": "string", "recommended_action": "string", "urgency": "immediate|24h|week"}],
  "root_causes": ["string"],
  "coordination_needed": ["string"]
}`;

  const messages: Message[] = [
    { role: "system", content: "You are a climate emergency coordinator. Return valid JSON only." },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiDashboardInsights(): Promise<Record<string, unknown>> {
  const prompt = `Analyze the current global climate situation as of March 2026 and return structured insights.

Return ONLY valid JSON:
{
  "headline": "string (one-line summary of current climate state)",
  "insights": [
    {"title": "string", "description": "string (2 sentences)", "severity": "positive|neutral|warning|critical", "metric": "string"}
  ],
  "recommendation": "string (top priority action for climate coordinators)"
}
Include 3-4 insights covering: global temperature trend, India emissions, extreme weather events, and policy progress.`;

  const messages: Message[] = [
    { role: "system", content: "You are a climate data analyst. Return valid JSON only – no markdown." },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiGeneratePlanFromGoal(goal: string): Promise<Record<string, unknown>> {
  const prompt = `Create a climate action plan for this goal: "${goal}"

Return ONLY valid JSON:
{
  "name": "string (concise plan name)",
  "sector": "energy|transport|agriculture|industry|forestry|water|waste",
  "impact": "high|medium|low",
  "description": "string (2-3 sentence description)",
  "deadline": "YYYY-MM-DD (realistic 1-3 year deadline)",
  "economic_cost": number (estimated USD cost),
  "co2_reduction": number (estimated tonnes CO₂e reduced),
  "key_milestones": ["string (4-6 milestones)"],
  "stakeholders": ["string (3-5 key stakeholders)"],
  "kpis": ["string (3-5 measurable KPIs)"],
  "risks": ["string (2-3 main risks)"]
}`;

  const messages: Message[] = [
    { role: "system", content: "You are a climate action planning expert. Return valid JSON only." },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiStakeholderComms(stakeholder: {
  name: string;
  role?: string;
  organization?: string;
  sector?: string;
}): Promise<Record<string, unknown>> {
  const prompt = `Draft a stakeholder communication for:
Name: ${stakeholder.name}
Role: ${stakeholder.role || "N/A"}
Organization: ${stakeholder.organization || "N/A"}
Sector: ${stakeholder.sector || "N/A"}

Return ONLY valid JSON:
{
  "subject": "string",
  "email_draft": "string (professional email, 150-200 words)",
  "key_messages": ["string (3 key talking points)"],
  "call_to_action": "string",
  "follow_up_timeline": "string"
}`;

  const messages: Message[] = [
    { role: "system", content: "You are a climate communications specialist. Return valid JSON only." },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiCountryBrief(country: {
  name: string;
  code: string;
  emissions: number;
  rank: number;
  percentage: number;
  year: number;
}): Promise<Record<string, unknown>> {
  const emissionsGt = (country.emissions / 1e9).toFixed(2);

  const prompt = `Generate a concise climate brief for ${country.name} (${country.code}):
- ${country.year} emissions: ${emissionsGt} billion tonnes CO₂e
- Global rank: #${country.rank}
- Share of global emissions: ${country.percentage.toFixed(1)}%

Return ONLY valid JSON:
{
  "headline": "string (≤15 words about this country's climate situation)",
  "emissions_context": "string (1-2 sentences comparing to peers or historical)",
  "top_sectors": ["string (top 3 emitting sectors for this country)"],
  "trajectory": "rising|stable|falling",
  "trajectory_note": "string (1 sentence on recent trend)",
  "key_policy": "string (most significant climate policy this country has)",
  "india_connection": "string or null (any trade/climate link with India)",
  "urgency": "critical|high|medium|low",
  "one_action": "string (single most impactful action this country could take)"
}`;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate intelligence analyst. Provide data-driven country climate briefs. Return valid JSON only.",
    },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiAnalyzeChartData(data: {
  totalEmissions: number;
  avgTrend: number;
  regions: Array<{ name: string; emissions: number; trend: number }>;
  co2Latest: number | null;
  metricTypes: Array<{ metric: string; value: number }>;
}): Promise<Record<string, unknown>> {
  const prompt = `Analyze this climate dataset and detect anomalies, trends, and notable patterns.

Data:
- Total global emissions: ${data.totalEmissions.toFixed(2)} GtCO₂
- Average emissions trend: ${data.avgTrend.toFixed(2)}%
- Latest atmospheric CO₂: ${data.co2Latest ?? "N/A"} ppm
- Regional breakdown: ${data.regions.map((r) => `${r.name}: ${r.emissions} GtCO₂ (${r.trend}% trend)`).join(", ")}
- Other metrics: ${data.metricTypes.map((m) => `${m.metric}: ${m.value}`).join(", ")}

Return ONLY valid JSON:
{
  "anomalies": [
    {
      "id": "unique_slug",
      "title": "string (≤10 words)",
      "description": "string (1-2 sentences with numbers)",
      "chart": "emissions|co2|temperature|methane|regional|scatter",
      "severity": "critical|warning|info|positive",
      "metric_value": "string (e.g. '12.1 GtCO₂')",
      "region": "string or null"
    }
  ],
  "overall_assessment": "string (2-3 sentences summary)",
  "top_concern": "string (single most urgent issue)",
  "positive_signal": "string or null (any good news in the data)"
}
Include 4-6 anomalies covering different aspects.`;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate data scientist specializing in anomaly detection and trend analysis. Return valid JSON only.",
    },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiRankActionPlans(
  plans: Array<{
    id: string;
    name: string;
    sector: string;
    status: string;
    impact?: string;
    deadline?: string;
    feasibility_score?: string;
    progress?: number;
  }>
): Promise<Record<string, unknown>> {
  const summary = plans
    .map(
      (p) =>
        `ID:${p.id} | "${p.name}" | sector:${p.sector} | status:${p.status} | impact:${p.impact || "?"} | deadline:${p.deadline || "none"} | feasibility:${p.feasibility_score || "?"} | progress:${p.progress ?? 0}%`
    )
    .join("\n");

  const prompt = `Rank these ${plans.length} climate action plans by urgency and strategic importance. Consider: deadline proximity, sector criticality, impact magnitude, feasibility, and current progress.

Plans:
${summary}

Return ONLY valid JSON:
{
  "summary": "1-2 sentence overview of the portfolio",
  "ranked_ids": ["id_string_array_in_priority_order"],
  "rankings": [
    {"id": "string", "rank": 1, "urgency": "critical|high|medium|low", "reason": "string (≤15 words)"}
  ]
}`;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a climate strategy prioritization expert. Rank action plans by real-world impact and urgency. Return valid JSON only.",
    },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response");
  return JSON.parse(match[0]);
}

export async function aiRunScenario(
  scenario: string,
  currentMetrics: { co2_ppm: number; temp_anomaly_c: number; sea_level_rise_mm_yr: number; methane_ppb: number }
): Promise<Record<string, unknown>> {
  const prompt = `Run a climate scenario analysis for: "${scenario}"

Current baseline metrics:
- CO₂: ${currentMetrics.co2_ppm} ppm
- Temperature anomaly: ${currentMetrics.temp_anomaly_c}°C
- Sea level rise rate: ${currentMetrics.sea_level_rise_mm_yr} mm/yr
- Methane: ${currentMetrics.methane_ppb} ppb

Return ONLY valid JSON (no markdown):
{
  "title": "string",
  "summary": "string (2-3 sentences)",
  "confidence": "high|medium|low",
  "projections": [{"year": number, "co2_ppm": number, "temp_anomaly_c": number, "sea_level_rise_mm_yr": number, "methane_ppb": number}],
  "baseline_projections": [{"year": number, "co2_ppm": number, "temp_anomaly_c": number, "sea_level_rise_mm_yr": number, "methane_ppb": number}],
  "key_impacts": [{"area": "string", "impact": "string", "magnitude": "high|medium|low"}],
  "recommendations": ["string"],
  "economic_analysis": {"estimated_cost_trillion_usd": number, "gdp_impact_percent": number, "jobs_created_millions": number, "investment_needed_billion_usd_per_year": number},
  "uncertainty_ranges": {"temp_low_c": number, "temp_mid_c": number, "temp_high_c": number, "co2_low_ppm": number, "co2_mid_ppm": number, "co2_high_ppm": number},
  "co_benefits": ["string"],
  "political_feasibility": "high|medium|low"
}
Include projections for years 2025, 2030, 2035, 2040, 2050.`;

  const messages: Message[] = [
    { role: "system", content: "You are a climate scientist running scenario analysis. Return valid JSON only." },
    { role: "user", content: prompt },
  ];

  const text = await callAI(messages);
  const scenarioMatch = text.match(/\{[\s\S]*\}/);
  if (!scenarioMatch) throw new Error("Non-JSON response from AI");
  return JSON.parse(scenarioMatch[0]);
}

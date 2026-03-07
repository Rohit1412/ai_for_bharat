/**
 * AI Service — centralized climate intelligence module.
 * Provides streaming and non-streaming analysis, risk classification,
 * and structured report generation via the climate-chat edge function.
 */

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/climate-chat`;
const AUTH = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface ClimateData {
  country: string;
  temp?: number;
  feelslike?: number;
  humidity?: number;
  windspeed?: number;
  uvindex?: number;
  precip?: number;
  conditions?: string;
  riskLevel?: RiskLevel;
}

/** Classify risk from weather metrics */
export function classifyRisk(data: Partial<ClimateData>): RiskLevel {
  const { temp, uvindex, windspeed, precip } = data;
  let score = 0;
  if (temp !== undefined) {
    if (temp > 42 || temp < -15) score += 3;
    else if (temp > 35 || temp < -5) score += 2;
    else if (temp > 30 || temp < 0) score += 1;
  }
  if (uvindex !== undefined) {
    if (uvindex >= 11) score += 3;
    else if (uvindex >= 8) score += 2;
    else if (uvindex >= 6) score += 1;
  }
  if (windspeed !== undefined) {
    if (windspeed > 80) score += 3;
    else if (windspeed > 50) score += 2;
    else if (windspeed > 30) score += 1;
  }
  if (precip !== undefined) {
    if (precip > 50) score += 2;
    else if (precip > 20) score += 1;
  }
  if (score >= 7) return "Critical";
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

/** Build a climate data map with risk levels from weather entries */
export function buildClimateDataMap(
  weatherEntries: Array<Record<string, any>>
): Record<string, ClimateData> {
  const map: Record<string, ClimateData> = {};
  for (const entry of weatherEntries) {
    if (entry.error) continue;
    const data: ClimateData = {
      country: entry.country,
      temp: entry.temp,
      feelslike: entry.feelslike,
      humidity: entry.humidity,
      windspeed: entry.windspeed,
      uvindex: entry.uvindex,
      precip: entry.precip,
      conditions: entry.conditions,
    };
    data.riskLevel = classifyRisk(data);
    map[entry.country] = data;
  }
  return map;
}

/** Non-streaming AI call — returns full text */
export async function queryAI(prompt: string): Promise<string> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(err.error || "AI request failed");
  }

  // Parse SSE stream into full text
  if (!resp.body) throw new Error("No response body");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  return result || "No response from AI.";
}

/** Streaming AI call with delta callback */
export async function streamAI({
  messages,
  onDelta,
  onDone,
}: {
  messages: Array<{ role: string; content: string }>;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "Stream failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

/** Build a prompt for city-level climate analysis */
export function buildClimatePrompt(
  city: string,
  temp: number,
  co2: string,
  renewables: string,
  risk: string
): string {
  return `You are a climate AI analyst for the Global Climate Action Coordinator. Analyze this city's climate data and give a concise, actionable recommendation (3-4 sentences max).

City: ${city}
Temperature anomaly: +${temp}°C
CO₂ emissions: ${co2}
Renewable energy adoption: ${renewables}
Risk level: ${risk}

Provide a specific, data-driven recommendation for immediate climate action in this region. Focus on the most impactful intervention.`;
}

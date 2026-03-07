import { supabase } from "@/integrations/supabase/client";

export async function queryGemini(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("gemini-proxy", {
    body: { prompt },
  });

  if (error) throw new Error(error.message || "Failed to call Gemini");
  if (data?.error) throw new Error(data.error);
  return data?.text || "No response from AI.";
}

export function buildClimatePrompt(city: string, temp: number, co2: string, renewables: string, risk: string): string {
  return `You are a climate AI analyst for the Global Climate Action Coordinator. Analyze this city's climate data and give a concise, actionable recommendation (3-4 sentences max).

City: ${city}
Temperature anomaly: +${temp}°C
CO₂ emissions: ${co2}
Renewable energy adoption: ${renewables}
Risk level: ${risk}

Provide a specific, data-driven recommendation for immediate climate action in this region. Focus on the most impactful intervention.`;
}

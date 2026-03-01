import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenario, currentMetrics, model: requestedModel } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-3-flash-preview",
    };
    const aiModel = MODELS[requestedModel] || "gemini-3-flash-preview";

    const systemPrompt = `You are a climate science AI specializing in scenario modeling and intervention projections. You analyze climate data and model the effects of various interventions.

Given a user scenario description and current climate metrics, return a structured analysis using the suggest_scenario tool. Project data for 5 time points (current year, +5yr, +10yr, +20yr, +30yr from 2026).

Be scientifically grounded. Use real-world data ranges. CO2 is in ppm (currently ~425), temperature anomaly in °C (currently ~1.3), sea level rise in mm (currently ~3.6mm/yr rate), methane in ppb (currently ~1925).

For each intervention, estimate realistic impact ranges based on published climate science literature.

IMPORTANT additional requirements:
- Include economic_analysis with estimated GDP cost, jobs impact, and investment needed
- Include uncertainty_ranges with low/mid/high bounds for temperature and CO2 at 2056
- Include co_benefits (health, biodiversity, energy security, etc.)
- Include political_feasibility assessment
- If the scenario describes multiple interventions, analyze their interaction effects`;

    const userPrompt = `Scenario: ${scenario}
    
Current metrics: ${JSON.stringify(currentMetrics || {})}

Analyze this climate intervention scenario and project its effects over 30 years.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_scenario",
              description: "Return structured climate scenario projection data",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Scenario title" },
                  summary: { type: "string", description: "2-3 sentence summary of projected outcomes" },
                  confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level" },
                  projections: {
                    type: "array",
                    description: "5 data points: current, +5yr, +10yr, +20yr, +30yr",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "number" },
                        co2_ppm: { type: "number" },
                        temp_anomaly_c: { type: "number" },
                        sea_level_rise_mm_yr: { type: "number" },
                        methane_ppb: { type: "number" },
                      },
                      required: ["year", "co2_ppm", "temp_anomaly_c", "sea_level_rise_mm_yr", "methane_ppb"],
                      additionalProperties: false,
                    },
                  },
                  baseline_projections: {
                    type: "array",
                    description: "5 baseline (no intervention) data points for comparison",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "number" },
                        co2_ppm: { type: "number" },
                        temp_anomaly_c: { type: "number" },
                        sea_level_rise_mm_yr: { type: "number" },
                        methane_ppb: { type: "number" },
                      },
                      required: ["year", "co2_ppm", "temp_anomaly_c", "sea_level_rise_mm_yr", "methane_ppb"],
                      additionalProperties: false,
                    },
                  },
                  key_impacts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string" },
                        impact: { type: "string" },
                        magnitude: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["area", "impact", "magnitude"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 actionable recommendations",
                  },
                  economic_analysis: {
                    type: "object",
                    description: "Economic impact assessment",
                    properties: {
                      estimated_cost_trillion_usd: { type: "number", description: "Total estimated cost in trillion USD over 30 years" },
                      gdp_impact_percent: { type: "number", description: "Projected GDP impact as percentage (negative = cost)" },
                      jobs_created_millions: { type: "number", description: "Net jobs created/lost in millions" },
                      investment_needed_billion_usd_per_year: { type: "number", description: "Annual investment required" },
                    },
                    required: ["estimated_cost_trillion_usd", "gdp_impact_percent", "jobs_created_millions", "investment_needed_billion_usd_per_year"],
                    additionalProperties: false,
                  },
                  uncertainty_ranges: {
                    type: "object",
                    description: "Uncertainty bounds for key projections at 2056",
                    properties: {
                      temp_low_c: { type: "number", description: "Low-bound temperature anomaly at 2056" },
                      temp_mid_c: { type: "number", description: "Mid estimate temperature anomaly at 2056" },
                      temp_high_c: { type: "number", description: "High-bound temperature anomaly at 2056" },
                      co2_low_ppm: { type: "number", description: "Low-bound CO2 at 2056" },
                      co2_mid_ppm: { type: "number", description: "Mid estimate CO2 at 2056" },
                      co2_high_ppm: { type: "number", description: "High-bound CO2 at 2056" },
                    },
                    required: ["temp_low_c", "temp_mid_c", "temp_high_c", "co2_low_ppm", "co2_mid_ppm", "co2_high_ppm"],
                    additionalProperties: false,
                  },
                  co_benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Co-benefits: health, biodiversity, energy security, etc.",
                  },
                  political_feasibility: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Political feasibility assessment",
                  },
                  interaction_effects: {
                    type: "string",
                    description: "If multiple interventions, describe how they interact (synergies, conflicts). 'N/A' if single intervention.",
                  },
                },
                required: ["title", "summary", "confidence", "projections", "baseline_projections", "key_impacts", "recommendations", "economic_analysis", "uncertainty_ranges", "co_benefits", "political_feasibility", "interaction_effects"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_scenario" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scenarioData = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(scenarioData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("climate-scenario error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

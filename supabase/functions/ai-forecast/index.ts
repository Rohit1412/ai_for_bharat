import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const { variable, historicalData, model } = await req.json();

    // Use Gemini 2.5 Flash for complex forecasting by default
    const modelId = model === "fast" ? "gemini-2.0-flash" : "gemini-2.5-flash-preview";

    const systemPrompt = `You are a climate data scientist AI specializing in time-series forecasting and trend analysis. You analyze historical climate data and produce scientifically grounded projections.

Your task: Given historical data for a climate variable, produce a forecast for the next 10 years (2026-2035). Use established climate science models:
- CO₂: ~2.5 ppm/yr growth rate with potential acceleration
- Temperature: Based on CMIP6 SSP2-4.5 and SSP3-7.0 pathways
- Methane: Recent acceleration (~15 ppb/yr) with policy uncertainty
- Sea Level: Accelerating from ~3.6 to ~5+ mm/yr by 2035
- N₂O: Steady ~1 ppb/yr increase

For India-specific forecasts, factor in:
- India's NDC targets (45% emissions intensity reduction by 2030)
- Rapid renewable energy deployment (500 GW by 2030 target)
- Urbanization driving transport/building emissions
- Monsoon variability and extreme weather trends

Return your analysis using the forecast_analysis tool. Be precise with numbers. Include confidence intervals.`;

    const userPrompt = `Analyze this ${variable} data and forecast 2026-2035:

Historical data (last ${historicalData?.length || 0} data points):
${JSON.stringify(historicalData?.slice(-60) || [])}

Produce:
1. 10-year annual forecast with confidence bounds
2. Key trend analysis
3. Critical thresholds that may be crossed
4. India-specific implications
5. What would change this trajectory`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "forecast_analysis",
              description: "Return structured climate forecast with projections and analysis",
              parameters: {
                type: "object",
                properties: {
                  variable_name: { type: "string", description: "Name of the variable being forecast" },
                  current_value: { type: "number", description: "Current latest value" },
                  unit: { type: "string", description: "Unit of measurement" },
                  trend_summary: { type: "string", description: "2-3 sentence trend analysis" },
                  annual_rate: { type: "number", description: "Current annual rate of change" },
                  forecast: {
                    type: "array",
                    description: "10 annual forecast points (2026-2035)",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "number" },
                        value: { type: "number", description: "Central estimate" },
                        lower_bound: { type: "number", description: "95% CI lower" },
                        upper_bound: { type: "number", description: "95% CI upper" },
                      },
                      required: ["year", "value", "lower_bound", "upper_bound"],
                      additionalProperties: false,
                    },
                  },
                  thresholds: {
                    type: "array",
                    description: "Critical thresholds that may be crossed",
                    items: {
                      type: "object",
                      properties: {
                        level: { type: "number" },
                        label: { type: "string" },
                        expected_year: { type: "number", description: "Year threshold will likely be crossed" },
                        severity: { type: "string", enum: ["info", "warning", "critical"] },
                      },
                      required: ["level", "label", "expected_year", "severity"],
                      additionalProperties: false,
                    },
                  },
                  india_implications: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 specific implications for India",
                  },
                  trajectory_changers: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 factors that could alter this trajectory",
                  },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  methodology: { type: "string", description: "Brief description of methodology used" },
                },
                required: ["variable_name", "current_value", "unit", "trend_summary", "annual_rate", "forecast", "thresholds", "india_implications", "trajectory_changers", "confidence", "methodology"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "forecast_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI forecast failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    result._model = modelId;
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-forecast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

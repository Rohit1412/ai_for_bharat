import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { model } = await req.json().catch(() => ({}));

    // Use Gemini 2.0 Flash for fast briefing generation
    const modelId = model === "advanced" ? "gemini-2.5-flash-preview" : "gemini-2.0-flash";

    // Fetch all live data
    const [metricsRes, regionRes, alertsRes, plansRes] = await Promise.all([
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(20),
      supabase.from("regional_data").select("*").order("emissions", { ascending: false }).limit(15),
      supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(10),
      supabase.from("action_plans").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are the AI Climate Intelligence Officer for ClimateAI Global Coordinator. Generate a daily climate intelligence briefing for researchers and policymakers.

Today's date: ${today}

Your briefing should be authoritative, data-driven, and actionable. Write like a senior climate analyst at the IPCC or World Bank. Focus on:
- What changed in the last 24 hours
- Current threat levels
- India-specific developments (this is "AI for Bharat")
- What decision-makers need to act on TODAY

Use the generate_briefing tool to return structured data.`;

    const userPrompt = `Generate today's climate intelligence briefing based on this live data:

Metrics: ${JSON.stringify(metricsRes.data?.slice(0, 10) || [])}
Top Emitters: ${JSON.stringify(regionRes.data?.slice(0, 10) || [])}
Active Alerts: ${JSON.stringify(alertsRes.data || [])}
Action Plans: ${JSON.stringify(plansRes.data?.slice(0, 5) || [])}

Current global context (use your training knowledge for latest):
- Global CO₂: ~425 ppm (Mauna Loa, 2025)
- Global temp anomaly: +1.3°C above pre-industrial
- Arctic ice: tracking below seasonal average
- India: 200+ GW renewable capacity, AQI crisis in Indo-Gangetic plain
- COP31 in Belém scheduled for November 2026

Generate a compelling, data-rich briefing.`;

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
              name: "generate_briefing",
              description: "Generate a structured daily climate intelligence briefing",
              parameters: {
                type: "object",
                properties: {
                  date: { type: "string", description: "Briefing date (YYYY-MM-DD)" },
                  threat_level: { type: "string", enum: ["low", "elevated", "high", "critical"], description: "Overall global climate threat level today" },
                  headline: { type: "string", description: "One-line headline for today's briefing (max 100 chars)" },
                  executive_summary: { type: "string", description: "3-4 sentence executive summary for busy policymakers" },
                  key_developments: {
                    type: "array",
                    description: "3-5 key developments in last 24-48 hours",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        detail: { type: "string", description: "2-3 sentences" },
                        category: { type: "string", enum: ["emissions", "temperature", "policy", "extreme_weather", "technology", "biodiversity"] },
                        severity: { type: "string", enum: ["positive", "neutral", "concerning", "critical"] },
                      },
                      required: ["title", "detail", "category", "severity"],
                      additionalProperties: false,
                    },
                  },
                  india_focus: {
                    type: "object",
                    description: "India-specific section",
                    properties: {
                      headline: { type: "string" },
                      developments: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 India-specific developments",
                      },
                      aqi_status: { type: "string", description: "Current air quality situation across major Indian cities" },
                      policy_update: { type: "string", description: "Latest Indian climate policy development" },
                    },
                    required: ["headline", "developments", "aqi_status", "policy_update"],
                    additionalProperties: false,
                  },
                  action_items: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 priority actions for today",
                  },
                  data_spotlight: {
                    type: "object",
                    description: "One data point to highlight with context",
                    properties: {
                      metric: { type: "string" },
                      value: { type: "string" },
                      context: { type: "string", description: "Why this number matters today" },
                      trend: { type: "string", enum: ["rising", "stable", "falling"] },
                    },
                    required: ["metric", "value", "context", "trend"],
                    additionalProperties: false,
                  },
                  outlook: { type: "string", description: "2-3 sentence outlook for the next 7 days" },
                },
                required: ["date", "threat_level", "headline", "executive_summary", "key_developments", "india_focus", "action_items", "data_spotlight", "outlook"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_briefing" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI briefing generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    result._model = modelId;
    result._generated_at = new Date().toISOString();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-climate-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

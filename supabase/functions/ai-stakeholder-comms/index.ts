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

    const { stakeholder, mode, model: requestedModel } = await req.json();
    if (!stakeholder && mode !== "bulk") throw new Error("Stakeholder data is required");

    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-2.0-flash",
    };
    const aiModel = MODELS[requestedModel] || "gemini-2.0-flash";

    const [metricsRes, alertsRes, plansRes, regionRes] = await Promise.all([
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(10),
      supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(8),
      supabase.from("action_plans").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(8),
      supabase.from("regional_data").select("*").order("region_name"),
    ]);

    const dataContext = `Current climate data:
Metrics: ${JSON.stringify(metricsRes.data?.slice(0, 8) || [])}
Active Alerts: ${JSON.stringify(alertsRes.data?.slice(0, 5) || [])}
Active Plans: ${JSON.stringify(plansRes.data?.slice(0, 5) || [])}
Regional Data: ${JSON.stringify(regionRes.data?.slice(0, 8) || [])}`;

    const systemPrompt = `You are a diplomatic climate communications AI for ClimateAI Global Coordinator. Generate professional, personalized stakeholder communications.

Tailor the message based on:
- Stakeholder type: Government (formal, policy-focused), NGO (collaborative, action-oriented), Private Sector (ROI-focused, opportunity-driven), Research (data-heavy, methodological), International Org (diplomatic, multilateral)
- Region: Reference region-specific data and developments
- Current climate situation: Use the latest metrics and alerts

Write in a professional but engaging tone. Reference specific data points. Include India-specific context where relevant (this is "AI for Bharat").

${dataContext}`;

    const userPrompt = `Generate a personalized communication for this stakeholder:
Name: ${stakeholder.name}
Type: ${stakeholder.type}
Organization: ${stakeholder.organization || "Not specified"}
Region: ${stakeholder.region}
Email: ${stakeholder.email || "Not specified"}

Create a compelling, data-driven email draft.`;

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
              name: "draft_communication",
              description: "Draft a personalized stakeholder communication",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject line" },
                  greeting: { type: "string", description: "Opening greeting" },
                  body: { type: "string", description: "3-4 paragraph email body" },
                  talking_points: { type: "array", items: { type: "string" }, description: "4-6 key talking points" },
                  next_steps: { type: "array", items: { type: "string" }, description: "2-3 recommended next steps" },
                  tone: { type: "string", description: "Tone used: formal, collaborative, or urgent" },
                },
                required: ["subject", "greeting", "body", "talking_points", "next_steps", "tone"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "draft_communication" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI communication draft failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    result._model = aiModel;
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-stakeholder-comms error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

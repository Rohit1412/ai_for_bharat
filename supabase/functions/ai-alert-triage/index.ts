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

    const { model: requestedModel } = await req.json().catch(() => ({}));
    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-2.0-flash",
    };
    const aiModel = MODELS[requestedModel] || "gemini-2.0-flash";

    const [alertsRes, metricsRes, plansRes, regionRes] = await Promise.all([
      supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }),
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(15),
      supabase.from("action_plans").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10),
      supabase.from("regional_data").select("*").order("region_name"),
    ]);

    const alerts = alertsRes.data || [];
    if (alerts.length === 0) {
      return new Response(JSON.stringify({ error: "No active alerts to triage." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a climate emergency triage AI. Analyze all active alerts together with current climate metrics and active action plans. Your job is to:
1. Rank alerts by priority (considering cascading effects and compounding risks)
2. Identify correlations between alerts (e.g., rising methane + temperature anomaly = feedback loop)
3. Recommend specific actions for each alert
4. Assess overall systemic risk

CRITICAL: Use the EXACT alert IDs provided in the data. Do not invent new IDs.
For urgency, consider: "immediate" = act now, "24h" = within a day, "this_week" = can wait a few days, "monitor" = watch but no action needed.`;

    const userPrompt = `Triage these ${alerts.length} active alerts:

Alerts: ${JSON.stringify(alerts)}

Current metrics context: ${JSON.stringify(metricsRes.data?.slice(0, 10) || [])}
Active action plans: ${JSON.stringify(plansRes.data?.slice(0, 5) || [])}
Regional data: ${JSON.stringify(regionRes.data?.slice(0, 10) || [])}

Analyze, rank, correlate, and recommend actions.`;

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
              name: "triage_alerts",
              description: "Triage and prioritize climate alerts",
              parameters: {
                type: "object",
                properties: {
                  overall_risk: { type: "string", enum: ["low", "moderate", "high", "critical"], description: "Overall risk level" },
                  risk_summary: { type: "string", description: "2-3 sentence risk assessment" },
                  priority_ranking: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        alert_id: { type: "string", description: "Exact alert ID from the data" },
                        alert_title: { type: "string" },
                        priority: { type: "number", description: "1 = highest priority" },
                        reasoning: { type: "string" },
                        recommended_action: { type: "string" },
                        urgency: { type: "string", enum: ["immediate", "24h", "this_week", "monitor"] },
                      },
                      required: ["alert_id", "alert_title", "priority", "reasoning", "recommended_action", "urgency"],
                      additionalProperties: false,
                    },
                  },
                  correlation_groups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        group_name: { type: "string" },
                        alert_ids: { type: "array", items: { type: "string" } },
                        pattern: { type: "string", description: "What pattern connects these alerts" },
                      },
                      required: ["group_name", "alert_ids", "pattern"],
                      additionalProperties: false,
                    },
                  },
                  systemic_risks: { type: "array", items: { type: "string" }, description: "2-3 systemic risks" },
                },
                required: ["overall_risk", "risk_summary", "priority_ranking", "correlation_groups", "systemic_risks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "triage_alerts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI triage failed");
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
    console.error("ai-alert-triage error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

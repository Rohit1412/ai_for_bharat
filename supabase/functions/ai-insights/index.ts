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

    const { type, question, context: clientContext, history, model: requestedModel } = await req.json();
    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-3-flash-preview",
    };
    const aiModel = MODELS[requestedModel] || "gemini-3-flash-preview";

    // Fetch live data for context
    const [metricsRes, regionRes, alertsRes, plansRes] = await Promise.all([
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(20),
      supabase.from("regional_data").select("*").order("region_name"),
      supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(10),
      supabase.from("action_plans").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const context = {
      metrics: metricsRes.data || [],
      regions: regionRes.data || [],
      activeAlerts: alertsRes.data || [],
      plans: plansRes.data || [],
    };

    // Analytics Q&A — simple chat, no tool calling
    if (type === "analytics-qa") {
      const qaSystemPrompt = `You are a climate data analyst AI assistant. Answer questions about climate analytics data concisely and accurately. Use the provided data context. Keep answers under 150 words. Be specific with numbers.

Data context:
${clientContext || ""}

Database context:
Metrics: ${JSON.stringify(context.metrics.slice(0, 8))}
Regions: ${JSON.stringify(context.regions)}`;

      const messages: any[] = [
        { role: "system", content: qaSystemPrompt },
        ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      ];
      if (question) messages.push({ role: "user", content: question });

      const qaResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: aiModel, messages }),
      });

      if (!qaResponse.ok) {
        const status = qaResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI analysis failed");
      }

      const qaData = await qaResponse.json();
      const answer = qaData.choices?.[0]?.message?.content || "No response generated.";
      return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "dashboard") {
      systemPrompt = `You are a climate data analyst AI. Analyze the provided real-time climate data and generate a concise, actionable insight summary. Use the suggest_insights tool.`;
      userPrompt = `Analyze this live climate data and provide insights:
      
Metrics: ${JSON.stringify(context.metrics.slice(0, 10))}
Regional Data: ${JSON.stringify(context.regions)}
Active Alerts: ${JSON.stringify(context.activeAlerts)}
Action Plans: ${JSON.stringify(context.plans.slice(0, 5))}

Generate 3-4 key insights about current trends, anomalies, and recommended actions.`;
    } else if (type === "report") {
      systemPrompt = `You are a climate report generator AI. Analyze the provided data and create a professional climate intelligence report summary. Use the generate_report tool.`;
      userPrompt = `Generate a professional climate intelligence report based on this data:

Metrics: ${JSON.stringify(context.metrics)}
Regional Data: ${JSON.stringify(context.regions)}
Active Alerts: ${JSON.stringify(context.activeAlerts)}
Action Plans: ${JSON.stringify(context.plans)}

Create a comprehensive report with executive summary, key findings, and recommendations.`;
    } else {
      throw new Error(`Unknown type: ${type}`);
    }

    const tools = type === "dashboard" ? [
      {
        type: "function",
        function: {
          name: "suggest_insights",
          description: "Return structured climate insights",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string", description: "One-line headline summarizing the current state" },
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["positive", "neutral", "warning", "critical"] },
                    metric: { type: "string", description: "Related metric name if any" },
                  },
                  required: ["title", "description", "severity"],
                  additionalProperties: false,
                },
              },
              recommendation: { type: "string", description: "Top priority action recommendation" },
            },
            required: ["headline", "insights", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    ] : [
      {
        type: "function",
        function: {
          name: "generate_report",
          description: "Generate a structured climate report",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              executive_summary: { type: "string", description: "2-3 paragraph executive summary" },
              key_findings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    finding: { type: "string" },
                    impact: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" },
                  },
                  required: ["finding", "impact", "category"],
                  additionalProperties: false,
                },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
              risk_assessment: { type: "string", description: "Overall risk assessment paragraph" },
            },
            required: ["title", "executive_summary", "key_findings", "recommendations", "risk_assessment"],
            additionalProperties: false,
          },
        },
      },
    ];

    const toolName = type === "dashboard" ? "suggest_insights" : "generate_report";

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
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

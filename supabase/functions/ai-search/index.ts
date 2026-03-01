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

    const { question, history, model: requestedModel } = await req.json();
    if (!question) throw new Error("Question is required");

    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-2.0-flash",
    };
    const aiModel = MODELS[requestedModel] || "gemini-2.0-flash";

    const [metricsRes, regionRes, alertsRes, plansRes, stakeholdersRes, reportsRes] = await Promise.all([
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(20),
      supabase.from("regional_data").select("*").order("region_name"),
      supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(15),
      supabase.from("action_plans").select("*").order("created_at", { ascending: false }).limit(15),
      supabase.from("stakeholders").select("*").order("name"),
      supabase.from("reports").select("id, title, report_type, summary, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const systemPrompt = `You are ClimateAI Search — the intelligent search assistant for the Climate Command Center. Answer questions using the provided database context. Be concise (under 200 words), specific with numbers, and actionable.

If the user asks about navigation, suggest which page to visit:
- Dashboard (/) for overview metrics
- Emissions Data (/global-overview) for regional breakdowns
- Analytics (/analytics) for charts and trends
- Action Plans (/action-plans) for climate interventions
- Alerts (/alerts) for warnings and critical events
- Stakeholders (/stakeholders) for partner directory
- Reports (/reports) for generated reports
- AI Forecast (/ai-forecast) for predictions
- AI Scenarios (/ai-scenarios) for what-if modeling

Database context:
Metrics: ${JSON.stringify(metricsRes.data?.slice(0, 10) || [])}
Regions: ${JSON.stringify(regionRes.data || [])}
Alerts: ${JSON.stringify(alertsRes.data?.slice(0, 8) || [])}
Plans: ${JSON.stringify(plansRes.data?.slice(0, 8) || [])}
Stakeholders: ${JSON.stringify(stakeholdersRes.data?.slice(0, 10) || [])}
Reports: ${JSON.stringify(reportsRes.data?.slice(0, 5) || [])}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: aiModel, messages }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI search failed");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No response generated.";
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

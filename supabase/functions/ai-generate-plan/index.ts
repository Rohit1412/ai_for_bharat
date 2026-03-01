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

    const { goal, model: requestedModel } = await req.json();
    if (!goal) throw new Error("Goal is required");

    const MODELS: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash-preview",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "gemini-3-flash": "gemini-2.0-flash",
    };
    const aiModel = MODELS[requestedModel] || "gemini-2.0-flash";

    const [metricsRes, regionRes, plansRes] = await Promise.all([
      supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(15),
      supabase.from("regional_data").select("*").order("region_name"),
      supabase.from("action_plans").select("name, sector, status, impact").order("created_at", { ascending: false }).limit(10),
    ]);

    const systemPrompt = `You are a climate policy AI specializing in action plan design. Given current climate metrics, regional emissions data, and existing plans, generate a detailed, actionable climate intervention plan.

Your plan must be:
- Scientifically grounded with realistic impact estimates
- Economically feasible with cost estimates
- Time-bound with a clear deadline
- Specific to a sector (Energy, Transport, Agriculture, Forestry, Industry, Policy, Research)

Consider India-specific context ("AI for Bharat") where relevant.
Do NOT duplicate existing plans. Always return status as "draft".`;

    const userPrompt = `Goal: ${goal}

Current climate data:
Metrics: ${JSON.stringify(metricsRes.data?.slice(0, 10) || [])}
Regional emissions: ${JSON.stringify(regionRes.data?.slice(0, 10) || [])}
Existing plans (avoid duplicates): ${JSON.stringify(plansRes.data || [])}

Generate a structured action plan to achieve this goal.`;

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
              name: "generate_action_plan",
              description: "Generate a structured climate action plan",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Concise plan name (max 80 chars)" },
                  sector: { type: "string", description: "Primary sector: Energy, Transport, Agriculture, Forestry, Industry, Policy, Research" },
                  impact: { type: "string", description: "Estimated emissions impact, e.g. '-1.2 GtCO2/yr'" },
                  description: { type: "string", description: "2-3 paragraph detailed plan description" },
                  status: { type: "string", enum: ["draft"], description: "Always draft" },
                  deadline: { type: "string", description: "ISO date for target completion (YYYY-MM-DD)" },
                  economic_cost: { type: "string", description: "Estimated cost, e.g. '$4.2 billion'" },
                  feasibility_score: { type: "string", enum: ["high", "medium", "low"] },
                  technical_readiness: { type: "string", enum: ["ready", "prototype", "research"] },
                  reasoning: { type: "string", description: "Why this plan was chosen given current data" },
                  key_milestones: { type: "array", items: { type: "string" }, description: "3-5 implementation milestones" },
                },
                required: ["name", "sector", "impact", "description", "status", "deadline", "economic_cost", "feasibility_score", "technical_readiness", "reasoning", "key_milestones"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_action_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI plan generation failed");
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
    console.error("ai-generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

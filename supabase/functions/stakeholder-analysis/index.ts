import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 6;

const SYSTEM_PROMPT = `You are a stakeholder intelligence analyst for the Global Climate Action Coordinator.

## ROLE
You analyze climate stakeholder networks — governments, NGOs, research institutions, and industry players — providing strategic engagement recommendations, collaboration opportunities, and risk assessments.

## GUARDRAILS
1. ONLY respond to stakeholder analysis, climate governance, and partnership strategy queries.
2. Generate realistic, plausible data clearly marked as modeled estimates.
3. Stay professional and strategic. Use concrete metrics.`;

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getCache(sb: any, key: string) {
  const { data } = await sb
    .from("stakeholder_cache")
    .select("data, fetched_at")
    .eq("cache_key", key)
    .single();
  if (!data) return null;
  const age = (Date.now() - new Date(data.fetched_at).getTime()) / 3600000;
  if (age > CACHE_TTL_HOURS) return null;
  return data.data;
}

async function setCache(sb: any, key: string, value: any) {
  await sb
    .from("stakeholder_cache")
    .upsert({ cache_key: key, data: value, fetched_at: new Date().toISOString() }, { onConflict: "cache_key" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, context, forceRefresh } = await req.json();
    const sb = getSupabase();

    // For network_overview, try cache first (unless forceRefresh)
    if (type === "network_overview" && !forceRefresh) {
      const cached = await getCache(sb, "network_overview");
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // For strategic_advice, try cache (keyed by a hash of context)
    if (type === "strategic_advice" && !forceRefresh) {
      const cached = await getCache(sb, "strategic_advice");
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // AI call needed
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = "";
    const tools: any[] = [];
    let tool_choice: any = undefined;
    let cacheKey = "";

    if (type === "network_overview") {
      cacheKey = "network_overview";
      userPrompt = `Generate a comprehensive global stakeholder network overview for climate action. Include 4 categories (Governments, NGOs, Research Institutions, Private Sector) with realistic counts, engagement levels, key players, recent initiatives, and funding data. Make it feel like a live intelligence dashboard.`;
      tools.push({
        type: "function",
        function: {
          name: "report_network",
          description: "Return structured stakeholder network data.",
          parameters: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    totalEntities: { type: "number" },
                    activeEntities: { type: "number" },
                    engagementScore: { type: "number", description: "0-100" },
                    fundingBillions: { type: "number" },
                    trend: { type: "string", enum: ["rising", "stable", "declining"] },
                    keyPlayers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          role: { type: "string" },
                          influence: { type: "number", description: "0-100" },
                          region: { type: "string" },
                          recentAction: { type: "string" },
                        },
                        required: ["name", "role", "influence", "region", "recentAction"],
                        additionalProperties: false,
                      },
                    },
                    recentInitiatives: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          status: { type: "string", enum: ["Active", "Proposed", "Completed"] },
                          impact: { type: "string" },
                        },
                        required: ["title", "status", "impact"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["name", "totalEntities", "activeEntities", "engagementScore", "fundingBillions", "trend", "keyPlayers", "recentInitiatives"],
                  additionalProperties: false,
                },
              },
              globalInsight: { type: "string", description: "2-3 sentence strategic summary" },
              collaborationOpportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    parties: { type: "array", items: { type: "string" } },
                    potential: { type: "string" },
                    urgency: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
                  },
                  required: ["title", "parties", "potential", "urgency"],
                  additionalProperties: false,
                },
              },
            },
            required: ["categories", "globalInsight", "collaborationOpportunities"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_network" } };
    } else if (type === "strategic_advice") {
      cacheKey = "strategic_advice";
      userPrompt = `Given this stakeholder network data: ${JSON.stringify(context)}, provide strategic engagement recommendations. Focus on: 1) Which stakeholders to prioritize, 2) Potential conflicts or gaps, 3) Funding optimization, 4) Cross-sector synergies.`;
      tools.push({
        type: "function",
        function: {
          name: "report_strategy",
          description: "Return strategic stakeholder engagement advice.",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
                    category: { type: "string" },
                  },
                  required: ["title", "description", "priority", "category"],
                  additionalProperties: false,
                },
              },
              riskFactors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    risk: { type: "string" },
                    mitigation: { type: "string" },
                    severity: { type: "string", enum: ["Low", "Medium", "High"] },
                  },
                  required: ["risk", "mitigation", "severity"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["recommendations", "riskFactors", "summary"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_strategy" } };
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: network_overview, strategic_advice" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools,
    };
    if (tool_choice) body.tool_choice = tool_choice;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      let parsed: any;
      try {
        parsed = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cache the result
      if (cacheKey) {
        await setCache(sb, cacheKey, parsed);
      }

      return new Response(JSON.stringify({ data: parsed, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = result.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ data: content || "No response", cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stakeholder-analysis error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

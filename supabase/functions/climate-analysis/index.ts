import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a climate data analysis engine for the Global Climate Action Coordinator.

## ROLE
You generate structured, realistic data backed climate assessments for any country or region. Your outputs power a global monitoring dashboard.

## GUARDRAILS
1. ONLY respond to climate/weather/environmental analysis requests. Reject anything else.
2. Do NOT fabricate exact real-time measurements. Generate realistic simulated data clearly marked as modeled estimates.
3. All numeric values must be plausible and internally consistent.
4. Always include confidence scores reflecting real data availability for each region.
5. Stay professional and scientific.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { region, type, context } = await req.json();
    if (!region || !type) {
      return new Response(JSON.stringify({ error: "region and type are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = "";
    const tools: any[] = [];
    let tool_choice: any = undefined;

    if (type === "climate_data") {
      userPrompt = `Generate a comprehensive climate assessment for "${region}". Include temperature anomaly, CO2 emissions, renewable adoption rate, risk level, summary, confidence score, last updated timestamp, and 3 data sources.`;
      tools.push({
        type: "function",
        function: {
          name: "report_climate_data",
          description: "Return structured climate data for a region.",
          parameters: {
            type: "object",
            properties: {
              region: { type: "string" },
              temperatureAnomaly: { type: "number", description: "Temperature anomaly in °C" },
              co2Emissions: { type: "number", description: "CO2 emissions in megatons" },
              renewableAdoption: { type: "number", description: "Renewable energy adoption percentage (0-100)" },
              riskLevel: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
              summary: { type: "string", description: "One sentence summary" },
              confidenceScore: { type: "number", description: "Data confidence 0-100" },
              lastUpdated: { type: "string", description: "ISO timestamp" },
              dataSources: { type: "array", items: { type: "string" }, description: "3 data source names" },
            },
            required: [
              "region",
              "temperatureAnomaly",
              "co2Emissions",
              "renewableAdoption",
              "riskLevel",
              "summary",
              "confidenceScore",
              "lastUpdated",
              "dataSources",
            ],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_climate_data" } };
    } else if (type === "action_plan") {
      userPrompt = `Based on this climate data for "${region}": ${JSON.stringify(context)}. Generate a strategic action plan with 3 interventions. Each should have feasibility scores for political, economic, and technical aspects. Set status to "Proposed".`;
      tools.push({
        type: "function",
        function: {
          name: "report_action_plan",
          description: "Return a structured action plan with interventions.",
          parameters: {
            type: "object",
            properties: {
              region: { type: "string" },
              projectedOutcome: { type: "string" },
              interventions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "number", description: "0-100 impact scale" },
                    cost: { type: "number", description: "Cost in billions USD" },
                    timeline: { type: "string" },
                    type: { type: "string", enum: ["Policy", "Technology", "Conservation"] },
                    feasibility: {
                      type: "object",
                      properties: {
                        political: { type: "number" },
                        economic: { type: "number" },
                        technical: { type: "number" },
                      },
                      required: ["political", "economic", "technical"],
                      additionalProperties: false,
                    },
                    status: { type: "string", enum: ["Proposed", "In Progress", "Completed", "Delayed"] },
                  },
                  required: [
                    "id",
                    "title",
                    "description",
                    "impact",
                    "cost",
                    "timeline",
                    "type",
                    "feasibility",
                    "status",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["region", "projectedOutcome", "interventions"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_action_plan" } };
    } else if (type === "simulation") {
      userPrompt = `Simulate the climate outcome for "${region}" if these interventions are implemented: ${JSON.stringify(context?.interventions)}. Current data: ${JSON.stringify(context?.currentData)}. Provide projected temperature, emissions, economic impact, and analysis.`;
      tools.push({
        type: "function",
        function: {
          name: "report_simulation",
          description: "Return simulation results.",
          parameters: {
            type: "object",
            properties: {
              projectedTemperature: { type: "number" },
              projectedEmissions: { type: "number" },
              economicImpact: { type: "number", description: "Net benefit/cost in billions" },
              analysis: { type: "string" },
            },
            required: ["projectedTemperature", "projectedEmissions", "economicImpact", "analysis"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_simulation" } };
    } else if (type === "weather_insights") {
      userPrompt = `Analyze this real-time weather data: ${JSON.stringify(context)}. Provide a "Global Climate Pulse" summary (2-3 sentences) and 3-4 regional alerts for the most critical locations.`;
      tools.push({
        type: "function",
        function: {
          name: "report_weather_insights",
          description: "Return weather insights with global pulse and regional alerts.",
          parameters: {
            type: "object",
            properties: {
              globalPulse: { type: "string" },
              regionalAlerts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    region: { type: "string" },
                    alert: { type: "string" },
                    severity: { type: "string", enum: ["Low", "Medium", "High"] },
                  },
                  required: ["region", "alert", "severity"],
                  additionalProperties: false,
                },
              },
            },
            required: ["globalPulse", "regionalAlerts"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "report_weather_insights" } };
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use: climate_data, action_plan, simulation, weather_insights" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    // Extract tool call arguments
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      let parsed: any;
      try {
        parsed =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return content if no tool call
    const content = result.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ data: content || "No response" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("climate-analysis error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

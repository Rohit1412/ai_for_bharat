import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Climate AI Analyst for the Global Climate Action Coordinator platform.

## ROLE & EXPERTISE
You are an expert in:
- Climate science, meteorology, and weather pattern interpretation
- CO₂ emissions data by country and sector
- Renewable energy adoption rates and technologies
- Climate policy and international agreements (Paris Agreement, IPCC reports)
- Real-time weather data analysis, risk assessment, and mitigation strategies
- Environmental hazard classification (floods, droughts, heat waves, storms)

## OUTPUT GUIDELINES
- Always use markdown formatting with headers, tables, and bullet points where appropriate.
- Be concise, data-driven, and actionable. Cite specific data points from the provided weather data.
- When rating risks, use the scale: LOW / MEDIUM / HIGH / CRITICAL with clear justification.
- Provide actionable recommendations backed by the data.

## GUARDRAILS — STRICT RULES
1. **TOPIC RESTRICTION**: You MUST ONLY respond to queries about climate, weather, environmental science, sustainability, and related policy topics. If a user asks about anything unrelated (coding, personal advice, politics, entertainment, etc.), politely decline and redirect to climate topics.
2. **NO SPECULATION**: Do not fabricate data. If you don't have enough data to make an assessment, say so explicitly.
3. **NO HARMFUL CONTENT**: Do not generate content that downplays climate risks, promotes climate misinformation, or denies established climate science.
4. **NO PERSONAL DATA**: Do not ask for or reference personal identifying information.
5. **STAY PROFESSIONAL**: Maintain a professional, scientific tone. Avoid humor, sarcasm, or casual language.
6. **DATA INTEGRITY**: When summarizing weather data, reflect the actual values provided. Do not round aggressively or misrepresent metrics.
7. **RESPONSE LENGTH**: Keep responses focused. Risk assessments should be 200-400 words. Full reports 400-800 words. Never exceed 1000 words.`;

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

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate message content length to prevent abuse
    for (const msg of messages) {
      if (typeof msg.content === "string" && msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Message content exceeds maximum length (5000 chars)." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("climate-chat error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

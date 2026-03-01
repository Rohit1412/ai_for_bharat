import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://api.climatetrace.org/v7";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();

    // Allowed endpoints
    const allowedEndpoints = [
      "country/emissions",
      "rankings/countries",
      "definitions/sectors",
      "definitions/countries",
      "definitions/gases",
    ];

    if (!allowedEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Endpoint not allowed: ${endpoint}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const queryParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v: string) => queryParams.append(key, v));
          } else {
            queryParams.set(key, String(value));
          }
        }
      }
    }

    const url = `${BASE_URL}/${endpoint}${queryParams.toString() ? `?${queryParams}` : ""}`;
    console.log(`Fetching Climate TRACE: ${url}`);

    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Climate TRACE API error [${resp.status}]: ${text}`);
      return new Response(
        JSON.stringify({ error: `Climate TRACE API returned ${resp.status}`, details: text }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("climate-trace error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

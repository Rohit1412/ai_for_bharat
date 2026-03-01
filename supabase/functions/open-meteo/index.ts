import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_URLS: Record<string, string> = {
  climate: "https://climate-api.open-meteo.com/v1/climate",
  "air-quality": "https://air-quality-api.open-meteo.com/v1/air-quality",
  archive: "https://archive-api.open-meteo.com/v1/archive",
  forecast: "https://api.open-meteo.com/v1/forecast",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiType, params } = await req.json();

    const baseUrl = API_URLS[apiType];
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: `API type not allowed: ${apiType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const queryParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            queryParams.set(key, (value as string[]).join(","));
          } else {
            queryParams.set(key, String(value));
          }
        }
      }
    }

    const url = `${baseUrl}${queryParams.toString() ? `?${queryParams}` : ""}`;
    console.log(`Fetching Open-Meteo: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Open-Meteo API error [${resp.status}]: ${text}`);
      return new Response(
        JSON.stringify({ error: `Open-Meteo API returned ${resp.status}`, details: text }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("open-meteo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

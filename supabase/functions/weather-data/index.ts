import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MINUTES = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { countries } = await req.json();
    if (!countries || !Array.isArray(countries) || countries.length === 0) {
      return new Response(JSON.stringify({ error: "countries array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
    const cutoff = new Date(Date.now() - CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("weather_cache")
      .select("country, data, fetched_at")
      .in("country", countries)
      .gte("fetched_at", cutoff);

    const cachedMap = new Map((cached || []).map((c: any) => [c.country, c.data]));
    const staleCountries = countries.filter((c: string) => !cachedMap.has(c));

    let freshData: any[] = [];

    if (staleCountries.length > 0) {
      const apiKey = Deno.env.get("VISUAL_CROSSING_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "VISUAL_CROSSING_API_KEY not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const locations = staleCountries.join("|");
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timelinemulti?key=${apiKey}&locations=${encodeURIComponent(locations)}&unitGroup=metric&include=current&contentType=json`;

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Visual Crossing API error: ${res.status} - ${errText}`);
      }

      const result = await res.json();
      const locationsData = result.locations || {};

      freshData = Object.values(locationsData).map((d: any) => {
        const current = d.currentConditions;
        return {
          country: d.address,
          resolvedAddress: d.resolvedAddress,
          temp: current?.temp,
          feelslike: current?.feelslike,
          humidity: current?.humidity,
          windspeed: current?.windspeed,
          winddir: current?.winddir,
          pressure: current?.pressure,
          visibility: current?.visibility,
          uvindex: current?.uvindex,
          conditions: current?.conditions,
          icon: current?.icon,
          cloudcover: current?.cloudcover,
          precip: current?.precip,
          snow: current?.snow,
          datetime: current?.datetime,
          sunrise: current?.sunrise,
          sunset: current?.sunset,
        };
      });

      // Upsert cache
      for (const entry of freshData) {
        await supabase.from("weather_cache").upsert(
          { country: entry.country, data: entry, fetched_at: new Date().toISOString() },
          { onConflict: "country" }
        );
      }
    }

    // Merge cached + fresh
    const weatherData = countries.map((c: string) => {
      if (cachedMap.has(c)) return cachedMap.get(c);
      return freshData.find((f) => f.country.toLowerCase() === c.toLowerCase()) || { country: c, error: "Not found" };
    });

    const fromCache = countries.length - staleCountries.length;

    return new Response(JSON.stringify({ data: weatherData, fromCache, totalCountries: countries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weather-data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

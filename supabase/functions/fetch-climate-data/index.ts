import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional month/year from request body, default to current
    let month: number, year: number;
    try {
      const body = await req.json();
      month = body.month || new Date().getMonth() + 1;
      year = body.year || new Date().getFullYear();
    } catch {
      const now = new Date();
      // Use previous month since current month data may not be available yet
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      month = prev.getMonth() + 1;
      year = prev.getFullYear();
    }

    const monthStr = String(year) + String(month).padStart(2, "0");
    const noaaUrl = `https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/mapping/tavg/${monthStr}/data.json`;

    console.log(`Fetching NOAA mapping data for ${monthStr}...`);
    const resp = await fetch(noaaUrl);

    if (!resp.ok) {
      // Try one more month back
      const fallback = new Date(year, month - 2, 1);
      const fallbackStr = String(fallback.getFullYear()) + String(fallback.getMonth() + 1).padStart(2, "0");
      const fallbackUrl = `https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/mapping/tavg/${fallbackStr}/data.json`;
      console.log(`Primary fetch failed (${resp.status}), trying fallback ${fallbackStr}...`);
      
      const resp2 = await fetch(fallbackUrl);
      if (!resp2.ok) {
        throw new Error(`NOAA API returned ${resp2.status} for both ${monthStr} and ${fallbackStr}`);
      }

      const data2 = await resp2.json();
      const result = await processAndSave(supabase, data2, fallback.getMonth() + 1, fallback.getFullYear());
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const result = await processAndSave(supabase, data, month, year);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-climate-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processAndSave(
  supabase: any,
  noaaData: any,
  month: number,
  year: number
) {
  const description = noaaData.description || {};
  const gridData = noaaData.data || {};

  const rows: any[] = [];
  const now = new Date().toISOString();

  for (const [key, val] of Object.entries(gridData)) {
    const entry = val as any;
    if (!entry?.coordinates) continue;

    rows.push({
      latitude: entry.coordinates.latitude,
      longitude: entry.coordinates.longitude,
      anomaly: entry.anomaly,
      rank: entry.rank || null,
      month,
      year,
      fetched_at: now,
    });
  }

  console.log(`Parsed ${rows.length} grid points from NOAA data`);

  // Delete existing data for this month/year, then insert fresh
  await supabase
    .from("noaa_temperature_grid")
    .delete()
    .eq("month", month)
    .eq("year", year);

  // Insert in batches of 500
  let inserted = 0;
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("noaa_temperature_grid")
      .insert(batch);

    if (error) {
      console.error(`Batch insert error at offset ${i}:`, error);
    } else {
      inserted += batch.length;
    }
  }

  return {
    title: description.title || `NOAA Temperature Anomaly ${year}-${month}`,
    units: description.units || "°C",
    base_period: description.base_period || "1991-2020",
    grid_points_total: rows.length,
    grid_points_inserted: inserted,
    month,
    year,
    fetched_at: now,
  };
}

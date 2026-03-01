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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get active thresholds
    const { data: thresholds, error: thErr } = await supabase
      .from("climate_thresholds")
      .select("*")
      .eq("is_active", true);

    if (thErr) throw thErr;
    if (!thresholds?.length) {
      return new Response(JSON.stringify({ message: "No active thresholds" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get latest metric per type
    const metricTypes = [...new Set(thresholds.map((t: any) => t.metric_type))];
    const latestMetrics: Record<string, { value: number; recorded_at: string }> = {};

    for (const mt of metricTypes) {
      const { data: metrics } = await supabase
        .from("climate_metrics")
        .select("value, recorded_at")
        .eq("metric_type", mt)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (metrics?.length) {
        latestMetrics[mt] = { value: Number(metrics[0].value), recorded_at: metrics[0].recorded_at };
      }
    }

    // 3. Check each threshold and create alerts if breached
    const alertsCreated: string[] = [];

    for (const threshold of thresholds as any[]) {
      const metric = latestMetrics[threshold.metric_type];
      if (!metric) continue;

      const value = metric.value;
      let level: "warning" | "critical" | null = null;

      if (threshold.direction === "above") {
        if (value >= threshold.critical_value) level = "critical";
        else if (value >= threshold.warning_value) level = "warning";
      } else {
        if (value <= threshold.critical_value) level = "critical";
        else if (value <= threshold.warning_value) level = "warning";
      }

      if (!level) continue;

      // Check if a similar unresolved alert exists (avoid duplicates)
      const { data: existing } = await supabase
        .from("alerts")
        .select("id")
        .eq("threshold_type", threshold.metric_type)
        .eq("resolved", false)
        .eq("level", level)
        .limit(1);

      if (existing?.length) continue;

      // Build recommended actions based on metric type
      const actions = getRecommendedActions(threshold.metric_type, level);

      const { error: insertErr } = await supabase.from("alerts").insert({
        level,
        title: `${level === "critical" ? "CRITICAL" : "WARNING"}: ${threshold.description}`,
        description: `Current ${threshold.metric_type.replace(/_/g, " ")} is ${value} ${threshold.unit}, ${level === "critical" ? "exceeding critical" : "approaching warning"} threshold of ${level === "critical" ? threshold.critical_value : threshold.warning_value} ${threshold.unit}.`,
        source: "automated",
        threshold_type: threshold.metric_type,
        threshold_value: level === "critical" ? threshold.critical_value : threshold.warning_value,
        current_value: value,
        recommended_actions: actions,
      });

      if (!insertErr) {
        alertsCreated.push(`${level}: ${threshold.metric_type} = ${value}`);
      }
    }

    return new Response(
      JSON.stringify({
        checked: thresholds.length,
        metricsFound: Object.keys(latestMetrics).length,
        alertsCreated: alertsCreated.length,
        details: alertsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-thresholds error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getRecommendedActions(metricType: string, level: string): string[] {
  const base: Record<string, string[]> = {
    atmospheric_co2: [
      "Review and accelerate emission reduction action plans",
      "Notify all stakeholders of elevated CO₂ levels",
      "Assess carbon capture deployment timelines",
    ],
    global_temp_anomaly: [
      "Convene emergency climate policy review",
      "Accelerate renewable energy deployment targets",
      "Activate heat wave preparedness protocols",
    ],
    methane_levels: [
      "Investigate methane emission hotspots via satellite data",
      "Enforce stricter fugitive emissions regulations",
      "Engage agricultural sector stakeholders on mitigation",
    ],
    sea_level_rise: [
      "Update coastal vulnerability assessments",
      "Notify low-lying region stakeholders",
      "Review sea wall and flood defense project timelines",
    ],
  };

  const actions = base[metricType] || ["Review current monitoring data", "Notify relevant stakeholders"];

  if (level === "critical") {
    actions.unshift("ESCALATE: Immediate executive briefing required");
  }

  return actions;
}

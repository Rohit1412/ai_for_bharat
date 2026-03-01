import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Lock, Clock } from "lucide-react";

const SharedView = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      // Validate the share link (using anon/public access)
      const { data: link, error: linkErr } = await supabase
        .from("share_links")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (linkErr || !link) {
        setError("This share link is invalid or has been deactivated.");
        setLoading(false);
        return;
      }

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError("This share link has expired.");
        setLoading(false);
        return;
      }

      setShareData(link);

      // Increment views count
      await supabase
        .from("share_links")
        .update({ views_count: (link.views_count || 0) + 1 })
        .eq("id", link.id);

      // Fetch page-specific data
      try {
        if (link.page === "action-plans") {
          const { data } = await supabase.from("action_plans").select("*").order("created_at", { ascending: false });
          setPageData(data);
        } else if (link.page === "dashboard") {
          const { data: metrics } = await supabase.from("climate_metrics").select("*").order("recorded_at", { ascending: false }).limit(20);
          const { data: alerts } = await supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(10);
          setPageData({ metrics, alerts });
        } else if (link.page === "analytics") {
          const { data: regional } = await supabase.from("regional_data").select("*");
          setPageData({ regional });
        }
      } catch {
        // Shared view may have limited access — show what we can
      }

      setLoading(false);
    };

    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading shared view...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 max-w-md text-center space-y-4">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Shared header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">ClimateAI Global Coordinator</h1>
              <p className="text-xs text-muted-foreground">Shared View — {shareData?.page?.replace("-", " ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{shareData?.views_count} views</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {shareData?.page === "action-plans" && pageData && (
          <>
            <h2 className="text-xl font-bold text-foreground">Action Plans</h2>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Sector</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Impact</th>
                    <th className="text-left p-4 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {pageData.map((plan: any) => (
                    <tr key={plan.id}>
                      <td className="p-4 font-medium text-foreground">{plan.name}</td>
                      <td className="p-4 text-muted-foreground text-xs">{plan.sector}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">{plan.status}</span></td>
                      <td className="p-4 font-mono text-xs text-foreground">{plan.impact || "—"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${plan.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{plan.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {shareData?.page === "dashboard" && pageData && (
          <>
            <h2 className="text-xl font-bold text-foreground">Climate Dashboard Snapshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pageData.metrics?.slice(0, 4).map((m: any) => (
                <div key={m.id} className="glass-card rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase">{m.metric_type.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">{m.value} <span className="text-sm font-normal text-muted-foreground">{m.unit}</span></p>
                </div>
              ))}
            </div>
            {pageData.alerts?.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Active Alerts</h3>
                <div className="space-y-2">
                  {pageData.alerts.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-2 h-2 rounded-full ${a.level === "critical" ? "bg-destructive" : a.level === "warning" ? "bg-warning" : "bg-info"}`} />
                      <span className="text-foreground">{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {shareData?.page === "analytics" && pageData?.regional && (
          <>
            <h2 className="text-xl font-bold text-foreground">Regional Emissions Data</h2>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Region</th>
                    <th className="text-left p-4 font-medium">Emissions</th>
                    <th className="text-left p-4 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {pageData.regional.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-4 text-foreground">{r.region_name}</td>
                      <td className="p-4 font-mono text-xs">{r.emissions} {r.unit}</td>
                      <td className="p-4"><span className={`text-xs font-mono ${Number(r.trend_percentage) < 0 ? "text-success" : "text-destructive"}`}>{r.trend_percentage}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center pt-8">
          This is a read-only shared view from ClimateAI Global Coordinator. Data shown is a snapshot and may not reflect real-time values.
        </p>
      </main>
    </div>
  );
};

export default SharedView;

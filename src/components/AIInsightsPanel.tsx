import { useState } from "react";
import { Brain, Sparkles, Loader2, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Insight {
  title: string;
  description: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  metric?: string;
}

interface InsightsData {
  headline: string;
  insights: Insight[];
  recommendation: string;
}

const severityIcons: Record<string, any> = {
  positive: CheckCircle2,
  neutral: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const severityStyles: Record<string, string> = {
  positive: "border-l-success bg-success/5",
  neutral: "border-l-info bg-info/5",
  warning: "border-l-warning bg-warning/5",
  critical: "border-l-destructive bg-destructive/5",
};

const severityIconStyles: Record<string, string> = {
  positive: "text-success",
  neutral: "text-info",
  warning: "text-warning",
  critical: "text-destructive",
};

const AIInsightsPanel = () => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ai-insights", {
        body: { type: "dashboard" },
      });
      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);
      setData(result as InsightsData);
    } catch (e: any) {
      setError(e.message || "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in-up animate-delay-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Climate Insights</h3>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Gemini</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={isLoading}
          className="text-xs gap-1"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : data ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {isLoading ? "Analyzing..." : data ? "Refresh" : "Generate"}
        </Button>
      </div>

      {!data && !isLoading && !error && (
        <div className="text-center py-6">
          <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Click Generate to get AI-powered insights from your live climate data</p>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center py-6 gap-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Analyzing climate data with Gemini...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive py-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{data.headline}</p>
          <div className="space-y-2">
            {data.insights.map((insight, i) => {
              const Icon = severityIcons[insight.severity] || Info;
              return (
                <div key={i} className={`border-l-2 rounded-r-lg p-3 ${severityStyles[insight.severity]}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${severityIconStyles[insight.severity]}`} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
            <p className="text-xs font-medium text-primary mb-1">🎯 Top Recommendation</p>
            <p className="text-xs text-muted-foreground">{data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;

import { useState } from "react";
import {
  FileText, Download, Calendar, Brain, Loader2, Sparkles,
  Search, Upload, Eye, Clock, BarChart3, AlertTriangle, TrendingUp,
  ChevronRight, X, FileUp
} from "lucide-react";
import { useReports } from "@/hooks/useClimateData";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import ExportMenu from "@/components/ExportMenu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const typeConfig: Record<string, { color: string; icon: typeof FileText }> = {
  Annual: { color: "bg-primary/15 text-primary", icon: BarChart3 },
  Quarterly: { color: "bg-info/15 text-info", icon: TrendingUp },
  Monthly: { color: "bg-warning/15 text-warning", icon: Clock },
  Alert: { color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  "AI-Generated": { color: "bg-accent text-accent-foreground", icon: Brain },
};

interface AIReport {
  title: string;
  executive_summary: string;
  key_findings: { finding: string; impact: string; category: string }[];
  recommendations: string[];
  risk_assessment: string;
}

const Reports = () => {
  const { data: reports, isLoading } = useReports();
  useRealtimeSubscription("reports", ["reports"]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const display = reports || [];
  const filtered = display.filter((r) => {
    const matchesType = typeFilter === "all" || r.report_type === typeFilter;
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || (r.summary?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const selected = selectedReport ? display.find((r) => r.id === selectedReport) : null;

  // Stats
  const totalReports = display.length;
  const typeCounts = display.reduce((acc, r) => {
    acc[r.report_type] = (acc[r.report_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const generateAIReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { type: "report" },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setAiReport(data as AIReport);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("reports").insert({
        title: file.name.replace(/\.[^/.]+$/, ""),
        report_type: "Monthly",
        summary: `Uploaded report: ${file.name}`,
        file_url: urlData.publicUrl,
      });
      if (insertError) throw insertError;
      toast({ title: "Report uploaded", description: file.name });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const impactColors: Record<string, string> = {
    high: "bg-destructive/15 text-destructive",
    medium: "bg-warning/15 text-warning",
    low: "bg-info/15 text-info",
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatDateLong = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalReports} reports · Live updates enabled
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={generateAIReport} disabled={isGenerating} variant="outline" size="sm" className="gap-1">
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
            {isGenerating ? "Generating..." : "AI Report"}
          </Button>
          <label>
            <input type="file" accept=".pdf,.doc,.docx,.xlsx,.csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <Button variant="outline" size="sm" className="gap-1 cursor-pointer" asChild disabled={isUploading}>
              <span>
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
                Upload
              </span>
            </Button>
          </label>
          {display.length > 0 && <ExportMenu data={display} filename="reports" />}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: totalReports, color: "text-primary" },
          { label: "Annual", value: typeCounts["Annual"] || 0, color: "text-primary" },
          { label: "Quarterly", value: typeCounts["Quarterly"] || 0, color: "text-info" },
          { label: "Alerts", value: typeCounts["Alert"] || 0, color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 bg-muted border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Annual">Annual</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Alert">Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Generated Report */}
      {aiReport && (
        <Card className="border-l-4 border-l-primary animate-fade-in-up">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{aiReport.title}</h2>
                <Badge variant="secondary" className="bg-primary/15 text-primary">AI-Generated</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAiReport(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Executive Summary</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{aiReport.executive_summary}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Key Findings</h3>
              <div className="space-y-2">
                {aiReport.key_findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                    <Badge className={`shrink-0 ${impactColors[f.impact] || "bg-muted text-muted-foreground"}`}>{f.impact}</Badge>
                    <div>
                      <p className="text-sm text-foreground">{f.finding}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Recommendations</h3>
              <div className="space-y-1.5">
                {aiReport.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-medium mt-0.5">{i + 1}</span>
                    <p className="text-muted-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
              <h3 className="text-sm font-medium text-warning mb-1">Risk Assessment</h3>
              <p className="text-xs text-muted-foreground">{aiReport.risk_assessment}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List + Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className={`space-y-2 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No reports found. Try generating one with AI or upload a file.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className={selected ? "h-[600px]" : ""}>
              <div className="space-y-2 pr-2">
                {filtered.map((report) => {
                  const config = typeConfig[report.report_type] || { color: "bg-muted text-muted-foreground", icon: FileText };
                  const Icon = config.icon;
                  const isSelected = selectedReport === report.id;
                  return (
                    <Card
                      key={report.id}
                      className={`border-border/50 cursor-pointer transition-all hover:border-primary/30 ${isSelected ? "border-primary/50 bg-primary/5" : ""}`}
                      onClick={() => setSelectedReport(isSelected ? null : report.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-foreground truncate">{report.title}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{report.summary || "No summary."}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(report.created_at)}
                                </span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>{report.report_type}</Badge>
                                {report.file_url && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">PDF</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <Card className="lg:col-span-3 border-border/50 animate-fade-in-up">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={typeConfig[selected.report_type]?.color || "bg-muted"}>{selected.report_type}</Badge>
                    {selected.file_url && <Badge variant="outline" className="bg-primary/10 text-primary">Has Attachment</Badge>}
                  </div>
                  <CardTitle className="text-lg">{selected.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {formatDateLong(selected.created_at)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selected.summary || "No summary available for this report."}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Report Type</p>
                    <p className="text-sm font-medium text-foreground">{selected.report_type}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(selected.created_at)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Report ID</p>
                    <p className="text-sm font-mono text-foreground truncate">{selected.id.slice(0, 8)}...</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Attachment</p>
                    <p className="text-sm font-medium text-foreground">{selected.file_url ? "Yes" : "None"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {selected.file_url && (
                  <Button size="sm" asChild>
                    <a href={selected.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3 mr-1" /> Download File
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;

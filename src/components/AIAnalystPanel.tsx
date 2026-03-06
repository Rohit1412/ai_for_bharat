import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Zap, FileText, AlertTriangle, TrendingUp, Plus, X, Pencil, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface WeatherEntry {
  country: string;
  temp?: number;
  humidity?: number;
  windspeed?: number;
  conditions?: string;
  uvindex?: number;
  precip?: number;
  feelslike?: number;
  error?: string;
}

interface AIAnalystPanelProps {
  weatherData: WeatherEntry[];
}

interface ReportType {
  id: string;
  label: string;
  icon: typeof AlertTriangle;
  prompt: string;
  isCustom?: boolean;
}

const PRESET_REPORTS: ReportType[] = [
  { id: "risk", label: "RISK ASSESSMENT", icon: AlertTriangle, prompt: "Analyze this weather data and provide a structured risk assessment. Identify extreme temperatures, dangerous UV levels, high winds, or precipitation risks. Rate each country LOW/MEDIUM/HIGH/CRITICAL. Be concise and data-driven." },
  { id: "trends", label: "PATTERN ANALYSIS", icon: TrendingUp, prompt: "Analyze the weather patterns across these countries. Identify clusters of similar conditions, regional patterns, notable outliers, and compare humidity/temperature correlations. Use tables where helpful." },
  { id: "summary", label: "SMART REPORT", icon: FileText, prompt: "Generate a comprehensive climate briefing from this weather data. Include: Executive summary, key metrics overview, notable conditions, and actionable recommendations for each region. Format professionally with headers." },
];

export default function AIAnalystPanel({ weatherData }: AIAnalystPanelProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [customReports, setCustomReports] = useState<ReportType[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const allReports = [...PRESET_REPORTS, ...customReports];

  const addCustomReport = () => {
    if (!customLabel.trim() || !customPrompt.trim()) return;

    if (editingId) {
      setCustomReports((prev) =>
        prev.map((r) => r.id === editingId ? { ...r, label: customLabel.toUpperCase(), prompt: customPrompt } : r)
      );
      setEditingId(null);
    } else {
      const newReport: ReportType = {
        id: `custom-${Date.now()}`,
        label: customLabel.toUpperCase(),
        icon: Send,
        prompt: customPrompt,
        isCustom: true,
      };
      setCustomReports((prev) => [...prev, newReport]);
    }
    setCustomLabel("");
    setCustomPrompt("");
    setShowCustomForm(false);
  };

  const editCustomReport = (id: string) => {
    const r = customReports.find((r) => r.id === id);
    if (!r) return;
    setCustomLabel(r.label);
    setCustomPrompt(r.prompt);
    setEditingId(id);
    setShowCustomForm(true);
  };

  const removeCustomReport = (id: string) => {
    setCustomReports((prev) => prev.filter((r) => r.id !== id));
    if (activeType === id) { setReport(null); setActiveType(null); }
  };

  const generateReport = async (typeId: string) => {
    const type = allReports.find((t) => t.id === typeId);
    if (!type || loading) return;

    const validData = weatherData.filter((w) => !w.error);
    if (validData.length === 0) return;

    setActiveType(typeId);
    setLoading(true);
    setReport("");

    const dataSummary = validData
      .map((w) => `${w.country}: ${w.temp}°C (feels ${w.feelslike}°C), humidity ${w.humidity}%, wind ${w.windspeed}km/h, UV ${w.uvindex}, precip ${w.precip}mm, ${w.conditions}`)
      .join("\n");

    const messages = [
      {
        role: "user",
        content: `${type.prompt}\n\nCurrent weather data:\n${dataSummary}`,
      },
    ];

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/climate-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed to generate report");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done: rdDone, value } = await reader.read();
        if (rdDone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setReport(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err: any) {
      setReport(`⚠️ ${err.message || "Failed to generate report."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-accent" />
        <span className="font-display text-sm tracking-widest text-accent">AI CLIMATE ANALYST</span>
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {weatherData.filter((w) => !w.error).length} locations active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {allReports.map((type) => (
          <div key={type.id} className="relative group">
            <button
              onClick={() => generateReport(type.id)}
              disabled={loading || weatherData.filter((w) => !w.error).length === 0}
              className={`w-full glass-panel p-3 flex items-center gap-2.5 text-left transition-all hover:border-accent/40 disabled:opacity-40 ${
                activeType === type.id ? "border-accent/50 bg-accent/5" : ""
              }`}
            >
              <type.icon className={`w-5 h-5 flex-shrink-0 ${activeType === type.id ? "text-accent" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <div className="font-display text-xs tracking-wider text-foreground truncate">{type.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{type.isCustom ? "Custom prompt" : "Auto-analyze data"}</div>
              </div>
              {loading && activeType === type.id && <Loader2 className="w-3 h-3 animate-spin text-accent ml-auto" />}
            </button>
            {type.isCustom && (
              <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                <button onClick={() => editCustomReport(type.id)} className="p-1 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => removeCustomReport(type.id)} className="p-1 rounded bg-muted/80 hover:bg-destructive/80 text-muted-foreground hover:text-destructive-foreground">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Custom Button */}
        <button
          onClick={() => { setShowCustomForm(!showCustomForm); setEditingId(null); setCustomLabel(""); setCustomPrompt(""); }}
          className="glass-panel p-3 flex items-center gap-2.5 text-left transition-all hover:border-primary/40 border-dashed"
        >
          <Plus className="w-5 h-5 text-primary" />
          <div>
            <div className="font-display text-xs tracking-wider text-foreground">CUSTOM ANALYSIS</div>
            <div className="text-[11px] text-muted-foreground">Add your own prompt</div>
          </div>
        </button>
      </div>

      {/* Custom Report Form */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xs tracking-widest text-primary">
                {editingId ? "EDIT CUSTOM ANALYSIS" : "NEW CUSTOM ANALYSIS"}
              </span>
              <button onClick={() => { setShowCustomForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Report name (e.g. FLOOD RISK)"
              maxLength={30}
              className="w-full bg-muted/30 border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Analysis instructions — e.g. 'Compare humidity levels across all countries and identify regions at risk of flooding. Rank them by severity.'"
              maxLength={500}
              rows={3}
              className="w-full bg-muted/30 border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{customPrompt.length}/500 chars</span>
              <button
                onClick={addCustomReport}
                disabled={!customLabel.trim() || !customPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary/20 text-primary text-xs font-display tracking-wider hover:bg-primary/30 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {editingId ? "SAVE" : "ADD"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Output */}
      <AnimatePresence mode="wait">
        {report !== null && (
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-4 max-h-[400px] overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="font-display text-xs tracking-wider text-accent">
                {allReports.find((t) => t.id === activeType)?.label || "REPORT"}
              </span>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-accent ml-auto" />}
            </div>
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_table]:text-sm text-sm">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
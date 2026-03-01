import { useState } from "react";
import { Upload, FileCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

function validateClimateData(raw: string, metricType: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [], rowCount: 0 };

  try {
    const rows = raw.trim().split("\n").filter(Boolean);
    if (rows.length < 2) {
      result.errors.push("Need at least a header row and one data row");
      result.valid = false;
      return result;
    }

    const header = rows[0].toLowerCase().split(",").map(s => s.trim());
    const needsCols = ["value"];
    for (const col of needsCols) {
      if (!header.includes(col)) {
        result.errors.push(`Missing required column: "${col}"`);
        result.valid = false;
      }
    }
    if (!result.valid) return result;

    const valueIdx = header.indexOf("value");
    const dateIdx = header.indexOf("date") !== -1 ? header.indexOf("date") : header.indexOf("recorded_at");
    const unitIdx = header.indexOf("unit");

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(s => s.trim());
      const val = parseFloat(cols[valueIdx]);
      if (isNaN(val)) {
        result.errors.push(`Row ${i}: invalid numeric value "${cols[valueIdx]}"`);
        result.valid = false;
        continue;
      }
      // Range checks per metric type
      if (metricType === "atmospheric_co2" && (val < 200 || val > 1000)) {
        result.warnings.push(`Row ${i}: CO₂ value ${val} ppm seems unusual (expected 200-1000)`);
      }
      if (metricType === "global_temp_anomaly" && (val < -5 || val > 10)) {
        result.warnings.push(`Row ${i}: temp anomaly ${val}°C seems unusual (expected -5 to 10)`);
      }
      if (metricType === "methane_levels" && (val < 500 || val > 5000)) {
        result.warnings.push(`Row ${i}: methane ${val} ppb seems unusual (expected 500-5000)`);
      }
      result.rowCount++;
    }
  } catch {
    result.errors.push("Failed to parse CSV data");
    result.valid = false;
  }

  return result;
}

const metricOptions = [
  { value: "atmospheric_co2", label: "Atmospheric CO₂ (ppm)" },
  { value: "global_temp_anomaly", label: "Temperature Anomaly (°C)" },
  { value: "methane_levels", label: "Methane Levels (ppb)" },
  { value: "sea_level_rise", label: "Sea Level Rise (mm/yr)" },
];

const DataUpload = () => {
  const [metricType, setMetricType] = useState("atmospheric_co2");
  const [csvData, setCsvData] = useState("");
  const [source, setSource] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleValidate = () => {
    const result = validateClimateData(csvData, metricType);
    setValidation(result);
  };

  const handleUpload = async () => {
    if (!validation?.valid || validation.rowCount === 0) return;

    setUploading(true);
    try {
      const rows = csvData.trim().split("\n").filter(Boolean);
      const header = rows[0].toLowerCase().split(",").map(s => s.trim());
      const valueIdx = header.indexOf("value");
      const dateIdx = header.indexOf("date") !== -1 ? header.indexOf("date") : header.indexOf("recorded_at");
      const unitIdx = header.indexOf("unit");

      const unitMap: Record<string, string> = {
        atmospheric_co2: "ppm",
        global_temp_anomaly: "°C",
        methane_levels: "ppb",
        sea_level_rise: "mm/yr",
      };

      const records = rows.slice(1).map(row => {
        const cols = row.split(",").map(s => s.trim());
        return {
          metric_type: metricType,
          value: parseFloat(cols[valueIdx]),
          unit: unitIdx !== -1 ? cols[unitIdx] : unitMap[metricType] || "",
          recorded_at: dateIdx !== -1 && cols[dateIdx] ? new Date(cols[dateIdx]).toISOString() : new Date().toISOString(),
          source: source || "stakeholder_upload",
        };
      }).filter(r => !isNaN(r.value));

      const { error } = await supabase.from("climate_metrics").insert(records);
      if (error) throw error;

      toast({ title: "Data uploaded", description: `${records.length} records ingested successfully` });
      queryClient.invalidateQueries({ queryKey: ["climate-metrics"] });
      setCsvData("");
      setSource("");
      setValidation(null);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvData(ev.target?.result as string || "");
      setValidation(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Upload Climate Data</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload local measurement data (CSV format). Data is validated before ingestion. Required column: <code className="text-foreground">value</code>. Optional: <code className="text-foreground">date</code>, <code className="text-foreground">unit</code>.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Metric Type</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {metricOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data Source</Label>
          <Input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., Local monitoring station" className="bg-muted border-border" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">CSV Data</Label>
        <Textarea
          value={csvData}
          onChange={e => { setCsvData(e.target.value); setValidation(null); }}
          placeholder={"value,date,unit\n421.5,2026-01-15,ppm\n422.1,2026-02-15,ppm"}
          className="min-h-[120px] bg-muted border-border font-mono text-xs"
        />
        <div className="flex items-center gap-2">
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-muted file:text-foreground hover:file:bg-accent" />
        </div>
      </div>

      {validation && (
        <div className={`rounded-lg p-3 text-xs space-y-1 ${validation.valid ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
          <div className="flex items-center gap-1.5 font-medium">
            {validation.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
            {validation.valid ? `Validation passed — ${validation.rowCount} rows ready` : "Validation failed"}
          </div>
          {validation.errors.map((e, i) => <p key={`e${i}`} className="text-destructive ml-5">{e}</p>)}
          {validation.warnings.map((w, i) => <p key={`w${i}`} className="text-warning ml-5">{w}</p>)}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleValidate} disabled={!csvData.trim()} size="sm">
          <FileCheck className="w-3.5 h-3.5 mr-1.5" /> Validate
        </Button>
        <Button onClick={handleUpload} disabled={!validation?.valid || uploading} size="sm">
          <Upload className="w-3.5 h-3.5 mr-1.5" /> {uploading ? "Uploading..." : "Upload Data"}
        </Button>
      </div>
    </div>
  );
};

export default DataUpload;

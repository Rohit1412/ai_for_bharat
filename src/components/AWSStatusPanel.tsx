import { Cloud, Database, Zap, HardDrive, Bell, Brain, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAWSHealth } from "@/hooks/useKarnatakaData";
import { getActiveAIService } from "@/lib/aiService";

const AWS_REGION = import.meta.env.VITE_AWS_REGION || "ap-south-1";
const AWS_API_URL = import.meta.env.VITE_AWS_API_URL || "";
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET_DATA || "viriva-data-dev";
const DYNAMO_TABLE = import.meta.env.VITE_DYNAMODB_TABLE_INTERVENTIONS || "viriva-interventions-dev";
const SNS_TOPIC = import.meta.env.VITE_SNS_TOPIC_ALERTS || "";

interface ServiceRowProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  detail: string;
  status: "active" | "inactive" | "loading";
}

function ServiceRow({ icon: Icon, name, detail, status }: ServiceRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{detail}</p>
      </div>
      {status === "loading" ? (
        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin shrink-0" />
      ) : status === "active" ? (
        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
      ) : (
        <XCircle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
      )}
    </div>
  );
}

const AWSStatusPanel = () => {
  const { data: awsHealthy, isLoading: healthLoading } = useAWSHealth();
  const aiProvider = getActiveAIService();

  const lambdaStatus = healthLoading ? "loading" : awsHealthy ? "active" : AWS_API_URL ? "inactive" : "inactive";

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <Cloud className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AWS Services</h3>
          <p className="text-[10px] text-muted-foreground">Region: {AWS_REGION} (Mumbai)</p>
        </div>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/15 text-orange-400">
          POWERED BY AWS
        </span>
      </div>

      <div className="divide-y divide-border/30">
        <ServiceRow
          icon={Zap}
          name="Lambda + API Gateway"
          detail={AWS_API_URL ? AWS_API_URL.replace("https://", "").slice(0, 35) + "..." : "Configure VITE_AWS_API_URL"}
          status={lambdaStatus}
        />
        <ServiceRow
          icon={Database}
          name="DynamoDB"
          detail={`${DYNAMO_TABLE} · viriva-alerts-dev · viriva-farms-dev`}
          status={awsHealthy ? "active" : "inactive"}
        />
        <ServiceRow
          icon={HardDrive}
          name="S3"
          detail={`${S3_BUCKET} · viriva-exports-dev`}
          status={awsHealthy ? "active" : "inactive"}
        />
        <ServiceRow
          icon={Bell}
          name="SNS Alerts"
          detail={SNS_TOPIC ? SNS_TOPIC.split(":").slice(-1)[0] : "viriva-alerts-dev"}
          status={awsHealthy ? "active" : "inactive"}
        />
        <ServiceRow
          icon={Brain}
          name={aiProvider === "bedrock" ? "Bedrock Claude 3.5 Sonnet" : "Gemini 2.0 Flash (Primary)"}
          detail={
            aiProvider === "bedrock"
              ? "anthropic.claude-3-5-sonnet-20241022-v2:0"
              : aiProvider === "gemini"
              ? "Bedrock as fallback when Gemini unavailable"
              : "Configure VITE_GEMINI_API_KEY or VITE_AWS_API_URL"
          }
          status={aiProvider !== "none" ? "active" : "inactive"}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {awsHealthy ? "✓ Backend connected" : AWS_API_URL ? "⚠ Backend unreachable" : "○ Using embedded data"}
        </p>
        <div className="flex gap-1 flex-wrap justify-end">
          {["Lambda", "DynamoDB", "S3", "SNS", "Bedrock", "Amplify"].map((svc) => (
            <span key={svc} className="px-1.5 py-0.5 rounded text-[8px] bg-orange-500/10 text-orange-400 font-medium">
              {svc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AWSStatusPanel;

/**
 * ClimateAI Global Coordinator — AWS Lambda Backend (TypeScript)
 * Powered by: AWS Lambda + API Gateway + DynamoDB + S3 + SNS + Gemini AI
 *
 * Routes:
 *   GET  /health                    – health check
 *   GET  /api/interventions         – list climate interventions
 *   POST /api/chat                  – AI chat via Gemini
 *   POST /api/action-plan/generate  – generate action plan via Gemini
 *   GET  /api/alerts                – get region alerts from DynamoDB
 *   POST /api/alerts/create         – create alert
 *   POST /api/alerts/notify         – send SNS notification
 *   GET  /api/kpis                  – Karnataka KPI data
 *   POST /api/data/validate         – validate climate data via Gemini
 *   POST /api/data/upload           – upload data to S3
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// ── Config ──────────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION ?? "us-east-1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const ALERTS_TABLE = process.env.ALERTS_TABLE ?? "viriva-alerts";
const INTERVENTIONS_TABLE = process.env.INTERVENTIONS_TABLE ?? "viriva-interventions";
const ACTION_PLANS_TABLE = process.env.ACTION_PLANS_TABLE ?? "viriva-action-plans";
const CHAT_HISTORY_TABLE = process.env.CHAT_HISTORY_TABLE ?? "viriva-chat-history";
const S3_DATA_BUCKET = process.env.S3_BUCKET_DATA ?? "viriva-data-dev";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN ?? "";

// ── AWS Clients ──────────────────────────────────────────────────────────────

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3 = new S3Client({ region: REGION });
const sns = new SNSClient({ region: REGION });

// ── Gemini helper ─────────────────────────────────────────────────────────────

async function invokeGemini(
  prompt: string,
  systemMessage = "You are ClimateAI, an expert climate action coordinator.",
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: systemMessage }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini no content: ${JSON.stringify(data).slice(0, 200)}`);
  return text;
}

// ── Response helpers ─────────────────────────────────────────────────────────

function ok(body: unknown, status = 200): APIGatewayProxyResult {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function err(message: string, status = 500): APIGatewayProxyResult {
  return ok({ success: false, error: message }, status);
}

function parseBody<T>(event: APIGatewayProxyEvent): T {
  return JSON.parse(event.body ?? "{}") as T;
}

// ── Static fallback data ─────────────────────────────────────────────────────

const INTERVENTIONS_FALLBACK = [
  { id: "int_1", name: "Solar Agri-Pumps",       carbon_reduction_tco2e: 250, cost_range: "₹60K–₹85K",  equity_score: 85, water_savings_percent: 25, timeline_months: 2,  priority: "high"     },
  { id: "int_2", name: "Direct Seeded Rice",      carbon_reduction_tco2e: 380, cost_range: "₹15K–₹25K",  equity_score: 90, water_savings_percent: 30, timeline_months: 3,  priority: "critical" },
  { id: "int_3", name: "Residue-to-Biogas",       carbon_reduction_tco2e: 180, cost_range: "₹50K–₹95K",  equity_score: 75, water_savings_percent: 0,  timeline_months: 4,  priority: "medium"   },
  { id: "int_4", name: "Dairy Methane Digesters", carbon_reduction_tco2e: 120, cost_range: "₹80K–₹1.1L", equity_score: 70, water_savings_percent: 5,  timeline_months: 5,  priority: "medium"   },
  { id: "int_5", name: "Reforestation",           carbon_reduction_tco2e: 150, cost_range: "₹5K–₹15K",   equity_score: 95, water_savings_percent: 10, timeline_months: 12, priority: "low"      },
];

const ALERTS_FALLBACK = [
  { id: "a1", region: "Raichur",       severity: "high",     message: "Methane spike in paddy fields (Sentinel-5P)",               recommended_action: "Switch 15% paddy to DSR" },
  { id: "a2", region: "Chikkaballapur",severity: "critical", message: "Groundwater depth 8.2m — threshold exceeded",               recommended_action: "Deploy solar agri-pumps with drip irrigation" },
  { id: "a3", region: "Karnataka",     severity: "medium",   message: "Temp 2.1°C above seasonal avg — heat stress for rabi crops", recommended_action: "Issue heat advisory; recommend protective irrigation" },
];

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleHealth(): Promise<APIGatewayProxyResult> {
  return ok({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "climateai-backend",
    region: REGION,
    version: "2.0.0",
    aws_services: ["lambda", "bedrock", "dynamodb", "s3", "sns"],
  });
}

async function handleRoot(): Promise<APIGatewayProxyResult> {
  return ok({
    service: "ClimateAI Global Coordinator — AWS Backend",
    version: "2.0.0",
    region: REGION,
    aws_services: ["Lambda", "API Gateway", "DynamoDB", "S3", "SNS", "Bedrock"],
    ai_model: GEMINI_MODEL,
    endpoints: ["/health", "/api/chat", "/api/action-plan/generate",
                "/api/interventions", "/api/alerts", "/api/kpis",
                "/api/data/validate", "/api/data/upload"],
  });
}

async function handleChat(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { question, language = "english", context } = parseBody<{
    question: string;
    language?: string;
    context?: Record<string, unknown>;
  }>(event);

  if (!question) return err("question is required", 400);

  const languageNote = language === "kannada" ? "Respond in KANNADA." : "Respond in clear English.";
  const contextNote = context ? `\nContext: ${JSON.stringify(context)}` : "";

  const prompt = `You are ClimateAI, an expert climate action coordinator for India.
${languageNote}
User question: ${question}${contextNote}

Provide a concise, practical answer (under 200 words) based on verified climate science.
Include India-specific government schemes or subsidies when relevant.`;

  try {
    const answer = await invokeGemini(
      prompt,
      "You are ClimateAI – a knowledgeable, action-oriented climate assistant."
    );

    // Persist to DynamoDB (non-critical)
    try {
      await dynamo.send(new PutCommand({
        TableName: CHAT_HISTORY_TABLE,
        Item: {
          chat_id: crypto.randomUUID(),
          question,
          answer,
          timestamp: Date.now(),
          language,
          source: "bedrock-claude",
        },
      }));
    } catch { /* non-critical */ }

    return ok({ success: true, answer, powered_by: "aws-bedrock", model: GEMINI_MODEL });
  } catch (e) {
    return err(`Chat error: ${(e as Error).message}`);
  }
}

async function handleGenerateActionPlan(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { intervention_ids, region = "Karnataka", budget_limit } = parseBody<{
    intervention_ids: string[];
    region?: string;
    budget_limit?: number;
  }>(event);

  const prompt = `You are a climate action planner for rural India.
Region: ${region}
Selected interventions: ${intervention_ids.join(", ")}
Budget limit: ${budget_limit ?? "No limit"}

Generate a ranked action plan as JSON:
{
  "ranked_portfolio": [{"rank": 1, "name": "...", "reason": "...", "co2_reduction": 0, "cost": 0}],
  "trade_off_analysis": "...",
  "timeline": "...",
  "recommendations": ["..."],
  "confidence_scores": {"climate_impact": 0.9, "feasibility": 0.8, "equity": 0.85}
}`;

  try {
    const explanation = await invokeGemini(
      prompt,
      "You are an expert climate action planner. Return valid JSON only."
    );

    const planId = `plan-${Date.now()}`;

    try {
      await dynamo.send(new PutCommand({
        TableName: ACTION_PLANS_TABLE,
        Item: {
          plan_id: planId,
          region,
          selected_interventions: intervention_ids,
          ai_explanation: explanation,
          created_at: Date.now(),
          status: "generated",
        },
      }));
    } catch { /* non-critical */ }

    return ok({
      success: true,
      action_plan_id: planId,
      explanation,
      region,
      interventions_count: intervention_ids.length,
      powered_by: "aws-bedrock",
    });
  } catch (e) {
    return err(`Plan generation error: ${(e as Error).message}`);
  }
}

async function handleGetInterventions(): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamo.send(new ScanCommand({ TableName: INTERVENTIONS_TABLE, Limit: 20 }));
    if (result.Items?.length) {
      return ok({ success: true, interventions: result.Items });
    }
  } catch { /* fall through to static */ }

  return ok({ success: true, interventions: INTERVENTIONS_FALLBACK });
}

async function handleGetAlerts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const region = event.queryStringParameters?.region ?? "Karnataka";

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: ALERTS_TABLE,
      KeyConditionExpression: "region = :r",
      ExpressionAttributeValues: { ":r": region },
      ScanIndexForward: false,
      Limit: 10,
    }));
    if (result.Items?.length) {
      return ok({ success: true, region, alerts: result.Items });
    }
  } catch { /* fall through to static */ }

  return ok({ success: true, region, alerts: ALERTS_FALLBACK });
}

async function handleCreateAlert(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { metric, threshold, region } = parseBody<{
    metric: string;
    threshold: number;
    region: string;
  }>(event);

  try {
    const item = {
      id: `alert-${Date.now()}`,
      region,
      metric,
      threshold: String(threshold),
      created_at: Date.now(),
      status: "active",
    };
    await dynamo.send(new PutCommand({ TableName: ALERTS_TABLE, Item: item }));
    return ok({ success: true, alert_id: item.id });
  } catch (e) {
    return err((e as Error).message);
  }
}

async function handleNotifyAlert(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { alert_id, message } = parseBody<{ alert_id: string; message: string }>(event);

  if (!SNS_TOPIC_ARN) return ok({ success: false, message: "SNS_TOPIC_ARN not configured" });

  try {
    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `ClimateAI Alert: ${alert_id}`,
      Message: message,
    }));
    return ok({ success: true, alert_id });
  } catch (e) {
    return err((e as Error).message);
  }
}

async function handleGetKPIs(): Promise<APIGatewayProxyResult> {
  return ok({
    emissions_trend:  { current: 45.2, target: 40.0, unit: "MtCO2e",  change_percent: -12.0 },
    carbon_budget:    { current: 1.8,  total:  2.5,  unit: "GtCO2e",  remaining_percent: 72.0 },
    temp_rise_2030:   { projection: 1.4, target: 1.2, unit: "°C",     change_percent: 16.7 },
    water_risk_score: { current: 78,   scale:  100,  unit: "Score",   change_percent: 5.0 },
    total_paddy_ha:   450000,
    annual_methane_tco2e: 20100000,
    active_projects:  20,
    projected_impact_tco2e: -2800000,
  });
}

async function handleValidateData(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const data = parseBody<Record<string, unknown>>(event);
  try {
    const prompt = `Validate this climate data and assign confidence scores (0–100):
${JSON.stringify(data, null, 2)}

Return JSON: {"validated_fields": {}, "issues": [], "overall_confidence_score": 0, "recommendations": []}`;

    const result = await invokeGemini(prompt, "You are a climate data validator. Return JSON only.");
    return ok({ success: true, validation_result: result });
  } catch (e) {
    return err((e as Error).message);
  }
}

async function handleUploadToS3(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { fileName, content, contentType = "application/json" } = parseBody<{
    fileName: string;
    content: string;
    contentType?: string;
  }>(event);

  try {
    await s3.send(new PutObjectCommand({
      Bucket: S3_DATA_BUCKET,
      Key: `uploads/${fileName}`,
      Body: Buffer.from(content, "utf-8"),
      ContentType: contentType,
    }));
    const url = `https://${S3_DATA_BUCKET}.s3.${REGION}.amazonaws.com/uploads/${fileName}`;
    return ok({ success: true, url, bucket: S3_DATA_BUCKET });
  } catch (e) {
    return err((e as Error).message);
  }
}

// ── Main Lambda handler ───────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEvent & { requestContext?: { http?: { method: string; path: string } }; rawPath?: string },
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // Support both HTTP API (v2) and REST API (v1) event formats
  const httpMethod = event.httpMethod ?? event.requestContext?.http?.method ?? "GET";
  const rawPath = event.rawPath ?? event.path ?? "/";
  // Strip stage and function name prefix (e.g. /default/climateai-backend/health → /health)
  const path = rawPath.replace(/^(\/[^/]+)?\/climateai-backend/, "") || "/";

  // CORS preflight
  if (httpMethod === "OPTIONS") {
    return ok({}, 200);
  }

  try {
    if (path === "/" || path === "")        return handleRoot();
    if (path === "/health")                 return handleHealth();
    if (path === "/api/kpis")              return handleGetKPIs();
    if (path === "/api/interventions")      return handleGetInterventions();
    if (path === "/api/alerts" && httpMethod === "GET")    return handleGetAlerts(event);
    if (path === "/api/alerts/create")      return handleCreateAlert(event);
    if (path === "/api/alerts/notify")      return handleNotifyAlert(event);
    if (path === "/api/chat")               return handleChat(event);
    if (path === "/api/action-plan/generate") return handleGenerateActionPlan(event);
    if (path === "/api/data/validate")      return handleValidateData(event);
    if (path === "/api/data/upload")        return handleUploadToS3(event);

    return err(`Route not found: ${httpMethod} ${path}`, 404);
  } catch (e) {
    return err(`Internal server error: ${(e as Error).message}`);
  }
};

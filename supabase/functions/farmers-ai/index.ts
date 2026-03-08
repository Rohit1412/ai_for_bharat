import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { state, month, queryType, context } = await req.json();
    if (!state || !queryType) {
      return new Response(JSON.stringify({ error: "state and queryType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const language = context?.language || "English";
    const langInstruction = language !== "English"
      ? `\n\n**IMPORTANT: Write the ENTIRE report in ${language} language. Use ${language} script throughout. Keep technical terms, crop names, scheme names, and table headers in ${language}. Numbers and currency symbols (₹) can remain in standard form.**`
      : "";

    let prompt = "";

    if (queryType === "full_analysis") {
      prompt = `Provide a COMPLETE agricultural advisory report for **${state}**, India for the month of **${month || "current season"}**.${langInstruction}

Structure your response with these sections:

---

# 🌾 Top 5 Recommended Crops for ${month}

For each crop use this format:

### 1. [Crop Name] ([Hindi/Local Name])
| Parameter | Detail |
|-----------|--------|
| Sowing Window | ... |
| Water Needs | Low / Medium / High |
| Expected Yield | X–Y quintals/acre |
| Input Cost | ₹X,000/acre |
| Market Price (MSP/Mandi) | ₹X,XXX/quintal |
| Profit Potential | ⭐ / ⭐⭐ / ⭐⭐⭐ |

**${state}-specific tips:** 2-3 sentences.

---

(Repeat for all 5 crops)

## 📊 Crop Comparison Table
| Crop | Cost/Acre | Revenue/Acre | Profit/Acre | Risk |
|------|-----------|-------------|-------------|------|
| ... | ... | ... | ... | ... |

---

# 🌦️ Climate & Weather Analysis for ${month}

## Temperature & Conditions
3-4 bullet points on current weather patterns.

## Rainfall & Water
| Parameter | Value |
|-----------|-------|
| Annual Rainfall | ... mm |
| ${month} Expected | ... mm |
| Groundwater Status | Good / Moderate / Critical |

## Soil Types by Region
| Region | Soil Type | pH Range | Best Crops |
|--------|----------|----------|------------|
| ... | ... | ... | ... |

## ⚠️ Climate Risks
Specific risks for ${state} in ${month} with severity.

## Irrigation Methods
| Method | Suitability | Water Savings | Cost/Acre |
|--------|------------|---------------|-----------|
| ... | ... | ... | ... |

---

# 💰 Cost & Economics

## Input Cost Breakdown (Top Recommended Crop)
| Expense | Cost/Acre (₹) | Cost/Hectare (₹) |
|---------|---------------|-------------------|
| Seeds | ... | ... |
| Fertilizer | ... | ... |
| Pesticides | ... | ... |
| Labor | ... | ... |
| Irrigation | ... | ... |
| Equipment | ... | ... |
| Transport | ... | ... |
| **TOTAL** | **₹...** | **₹...** |

## Revenue & Profit
| Metric | Per Acre | Per Hectare |
|--------|----------|-------------|
| Yield | ... | ... |
| Revenue | ₹... | ₹... |
| Net Profit | ₹... | ₹... |
| **ROI** | **...%** | **...%** |

---

# 🏛️ Government Schemes & Subsidies
| Scheme | Benefit | Eligibility |
|--------|---------|-------------|
| ... | ... | ... |

List 5-6 relevant central and ${state} state schemes.

---

# ✅ Action Plan for ${month}
A numbered step-by-step action plan (6-8 steps) for a farmer in ${state} this month.

Use clean markdown with headers, tables, bold text, bullet points. Be specific to ${state}. Use 2024-25 data. No JSON. No code blocks.`;
    } else if (queryType === "crop_recommendation") {
      prompt = `You are an expert Indian agronomist. Recommend the TOP 5 crops for **${state}** in **${month || "the current season"}**.

For EACH crop, provide this exact structure:

## 🌾 1. [Crop Name] ([Hindi/Local Name])
| Parameter | Value |
|-----------|-------|
| Sowing Window | e.g. Jun–Jul |
| Water Needs | Low / Medium / High |
| Expected Yield | X–Y quintals/acre |
| Input Cost | ₹X,000/acre |
| Market Price (MSP/Mandi) | ₹X,XXX/quintal |
| Profit Potential | ⭐ Low / ⭐⭐ Medium / ⭐⭐⭐ High |

**${state}-specific tips:** 2-3 sentences of region-specific planting advice.

---

(Repeat for all 5 crops)

## 📊 Quick Comparison
| Crop | Cost/Acre | Revenue/Acre | Profit/Acre | Risk Level |
|------|-----------|-------------|-------------|------------|
| ... | ... | ... | ... | ... |

## 🏛️ Applicable Government Schemes
| Scheme | Benefit | How to Apply |
|--------|---------|-------------|
| PM-KISAN | ₹6,000/year | Through local panchayat |

## 🌱 Soil Preparation for ${month}
Concise, actionable soil prep advice for ${state}.

Use clean markdown. No JSON. No code blocks.`;
    } else if (queryType === "climate_analysis") {
      prompt = `Provide a comprehensive climate analysis for farming in **${state}**, India during **${month || "current season"}**.

## 🌡️ ${month} Season Overview for ${state}
Temperature range, humidity, wind patterns — 3-4 key bullet points.

## 💧 Rainfall & Water Availability
| Parameter | Value |
|-----------|-------|
| Annual Rainfall | ... mm |
| ${month} Expected | ... mm |
| Major Rivers/Sources | ... |
| Groundwater Status | Good / Moderate / Critical |

## 🌍 Soil Characteristics by Region
| Region/Zone | Dominant Soil | pH Range | Best Suited Crops |
|-------------|--------------|----------|-------------------|
| ... | ... | ... | ... |

## ⚠️ Climate Risks & Alerts
- Specific risks for ${state} in ${month} (drought, flood, pest outbreaks, heat stress)
- Probability and severity for each

## 💦 Irrigation Recommendations
| Method | Suitability | Water Savings | Cost |
|--------|------------|---------------|------|
| Drip | ... | ... | ... |
| Sprinkler | ... | ... | ... |
| Flood | ... | ... | ... |

## ✅ Best Practices for ${month}
5-6 actionable bullet points specific to ${state}.

Clean markdown only. No JSON.`;
    } else if (queryType === "cost_calculation") {
      const crop = context?.crop || "general crops";
      prompt = `Provide a detailed cost-benefit analysis for growing **${crop}** in **${state}**, India.

## 💰 Input Cost Breakdown — ${crop} in ${state}

| Expense Category | Cost/Acre (₹) | Cost/Hectare (₹) | Notes |
|-----------------|---------------|-------------------|-------|
| Seeds / Seedlings | ... | ... | Variety recommendation |
| Fertilizer (NPK) | ... | ... | Dosage per acre |
| Organic Manure / FYM | ... | ... | ... |
| Pesticides & Herbicides | ... | ... | Key chemicals |
| Labor (Sowing to Harvest) | ... | ... | Person-days needed |
| Irrigation / Electricity | ... | ... | Method assumed |
| Equipment / Tractor Rental | ... | ... | ... |
| Transport to Mandi | ... | ... | ... |
| **TOTAL INPUT COST** | **₹...** | **₹...** | |

## 📈 Revenue & Profitability

| Metric | Per Acre | Per Hectare |
|--------|----------|-------------|
| Expected Yield | ... quintals | ... quintals |
| MSP (if applicable) | ₹.../quintal | — |
| Avg Mandi Price | ₹.../quintal | — |
| Gross Revenue | ₹... | ₹... |
| Net Profit | ₹... | ₹... |
| **Profit Margin** | **...%** | **...%** |
| ROI | ...% | ...% |

## 📉 Break-even Analysis
- Minimum yield needed to break even
- Minimum price needed to break even

## 💡 Cost Optimization Tips for ${state}
5 practical, actionable tips to reduce costs.

## 🏛️ Subsidy & Support
Applicable subsidies for ${crop} farming in ${state} (seed subsidy, equipment, soil testing, etc.)

Use realistic 2024-25 market data. Clean markdown only. No JSON.`;
    } else if (queryType === "karnataka_specific") {
      prompt = `You are an expert on Karnataka agriculture. Provide detailed information for farmers in Karnataka, India.

${state !== "Karnataka" ? `Note: The user is asking about ${state}, but with special focus on Karnataka regions.` : ""}

Format in clean markdown with the following sections:

## 🗺️ Regional Zones
Cover Coastal, Malnad, North Karnataka, and South Karnataka with major crops for each.

## 💧 Irrigation Sources
Dams, borewells, rivers - with details.

## 📊 Market Information (APMC Yards)
Current rates for major crops in table format.

## 🏛️ Karnataka Government Schemes
| Scheme | Benefit | Eligibility |
|--------|---------|-------------|

## ✅ Best Practices by Zone
Zone-specific farming advice.

## ⚠️ Major Challenges
Key challenges faced by Karnataka farmers.

Include Kannada terms where relevant. Do NOT return JSON.`;
    } else {
      prompt = `Answer this farming query for ${state}, India: ${context?.question || queryType}

Provide practical advice suitable for Indian farmers, considering local conditions, costs in INR, and regional factors. Use markdown formatting with headers, bullet points, and tables. Do NOT return JSON.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are KISAN MITRA, an expert Indian agriculture advisor with deep knowledge of all Indian states, agro-climatic zones, MSP rates, mandi prices, soil types, and government schemes. Provide accurate, data-driven farming advice using INR currency, Hindi/local crop names in parentheses, and region-specific recommendations. Format ALL responses in clean, well-structured markdown with clear headers (##), tables, bold text, and bullet points. Use realistic 2024-25 data. NEVER return JSON, code blocks, or generic advice — always be state-specific and actionable.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response from AI.";

    return new Response(JSON.stringify({ text, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("farmers-ai error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

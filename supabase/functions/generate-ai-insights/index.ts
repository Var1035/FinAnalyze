import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FinancialData {
  total_revenue: number;
  total_expenses: number;
  outstanding_receivables: number;
  outstanding_payables: number;
  transactions: Array<{
    type: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

async function generateInsightsWithMistral(financialData: FinancialData) {
  const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

  if (!mistralApiKey) {
    console.warn("MISTRAL_API_KEY not found, using rule-based insights");
    return generateRuleBasedInsights(financialData);
  }

  try {
    const profitMargin = ((financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue) * 100;
    const cashFlowRatio = (financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue;
    const receivablesRatio = financialData.outstanding_receivables / financialData.total_revenue;

    const categoryExpenses: { [key: string]: number } = {};
    financialData.transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      });

    const topExpenseCategory = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => `${name}: ₹${amount.toFixed(0)}`);

    const prompt = `You are a financial advisor for small and medium enterprises (SMEs). Analyze the following financial data and provide 4-6 specific, actionable insights.

Financial Data:
- Total Revenue: ₹${financialData.total_revenue.toFixed(0)}
- Total Expenses: ₹${financialData.total_expenses.toFixed(0)}
- Net Profit: ₹${(financialData.total_revenue - financialData.total_expenses).toFixed(0)}
- Profit Margin: ${profitMargin.toFixed(1)}%
- Outstanding Receivables: ₹${financialData.outstanding_receivables.toFixed(0)} (${(receivablesRatio * 100).toFixed(1)}% of revenue)
- Outstanding Payables: ₹${financialData.outstanding_payables.toFixed(0)}
- Cash Flow Ratio: ${(cashFlowRatio * 100).toFixed(1)}%
- Top Expense Categories: ${topExpenseCategory.join(', ')}

For each insight, provide:
1. A specific title (5-10 words)
2. A detailed description (2-3 sentences with specific numbers and recommendations)
3. The type: "cash_flow", "expense", "credit", or "receivables"
4. Severity: "low" (positive), "medium" (needs attention), "high" (important), or "critical" (urgent)

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "insight_type": "string",
      "severity": "string"
    }
  ]
}`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights || [];
  } catch (error) {
    console.error("Mistral API error:", error);
    return generateRuleBasedInsights(financialData);
  }
}

function generateRuleBasedInsights(financialData: FinancialData) {
  const profitMargin = ((financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue) * 100;
  const cashFlowRatio = (financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue;
  const receivablesRatio = financialData.outstanding_receivables / financialData.total_revenue;

  const insights = [];

  if (cashFlowRatio > 0.2) {
    insights.push({
      insight_type: "cash_flow",
      title: "Strong Cash Flow Position",
      description: `Your business maintains healthy cash reserves with a ${(cashFlowRatio * 100).toFixed(1)}% net cash flow margin. This indicates excellent financial stability and growth potential.`,
      severity: "low",
    });
  } else if (cashFlowRatio > 0) {
    insights.push({
      insight_type: "cash_flow",
      title: "Moderate Cash Flow",
      description: `Your cash flow margin of ${(cashFlowRatio * 100).toFixed(1)}% is positive but could be improved. Consider reviewing expenses and optimizing pricing strategies.`,
      severity: "medium",
    });
  } else {
    insights.push({
      insight_type: "cash_flow",
      title: "Cash Flow Concern",
      description: "Your expenses exceed revenue, creating negative cash flow. Immediate action is needed to reduce costs or increase sales.",
      severity: "critical",
    });
  }

  if (profitMargin < 10) {
    insights.push({
      insight_type: "expense",
      title: "Profit Margin Below Industry Average",
      description: `Your profit margin of ${profitMargin.toFixed(1)}% is below the typical industry standard. Review operational expenses, negotiate better supplier rates, and optimize resource allocation.`,
      severity: "high",
    });
  } else if (profitMargin >= 20) {
    insights.push({
      insight_type: "expense",
      title: "Excellent Profit Margins",
      description: `Your ${profitMargin.toFixed(1)}% profit margin exceeds industry standards. This strong performance indicates efficient operations and good pricing strategy.`,
      severity: "low",
    });
  }

  if (receivablesRatio > 0.2) {
    insights.push({
      insight_type: "receivables",
      title: "High Outstanding Receivables",
      description: `Outstanding receivables represent ${(receivablesRatio * 100).toFixed(1)}% of revenue. Consider implementing stricter payment terms, offering early payment discounts, or using invoice factoring.`,
      severity: "medium",
    });
  }

  const categoryExpenses: { [key: string]: number } = {};
  financialData.transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  const topExpenseCategory = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])[0];

  if (topExpenseCategory && (topExpenseCategory[1] / financialData.total_expenses) > 0.3) {
    insights.push({
      insight_type: "expense",
      title: `High ${topExpenseCategory[0]} Expenses`,
      description: `${topExpenseCategory[0]} expenses account for ${((topExpenseCategory[1] / financialData.total_expenses) * 100).toFixed(1)}% of total costs. Review and optimize spending in this category for potential savings.`,
      severity: "medium",
    });
  }

  if (cashFlowRatio >= 0.15 && profitMargin >= 12) {
    insights.push({
      insight_type: "credit",
      title: "Excellent Credit Readiness",
      description: "Your financial profile indicates strong creditworthiness. You may qualify for working capital loans with favorable terms. Consider exploring financing options for business expansion.",
      severity: "low",
    });
  } else if (cashFlowRatio >= 0.05) {
    insights.push({
      insight_type: "credit",
      title: "Good Credit Potential",
      description: "Your financial metrics show good potential for credit approval. Maintain consistent payment history and consider building your credit profile for better loan terms.",
      severity: "medium",
    });
  }

  return insights;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { financialData }: { financialData: FinancialData } = await req.json();

    const insights = await generateInsightsWithMistral(financialData);

    return new Response(
      JSON.stringify({ insights }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate insights" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { fileType, fileName, transactionData, isDemo } = await req.json();

    const uploadId = crypto.randomUUID();

    let transactions: Transaction[] = [];

    if (isDemo) {
      transactions = generateDemoTransactions();
    } else if (transactionData) {
      transactions = parseTransactionData(transactionData, fileType);
    } else {
      throw new Error("No transaction data provided");
    }

    const { error: uploadError } = await supabaseClient
      .from("financial_uploads")
      .insert({
        id: uploadId,
        user_id: user.id,
        file_type: isDemo ? 'demo' : fileType,
        original_filename: fileName || 'demo-data.json',
        parsed_data: transactions,
        file_size: JSON.stringify(transactions).length,
        processing_status: 'processing',
        created_at: new Date().toISOString(),
      });

    if (uploadError) throw uploadError;

    const metrics = computeFinancialMetrics(transactions, user.id);

    const { error: metricsError } = await supabaseClient
      .from("financial_metrics")
      .upsert({
        ...metrics,
        updated_at: new Date().toISOString(),
        computed_at: new Date().toISOString(),
      });

    if (metricsError) throw metricsError;

    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .delete()
      .eq("user_id", user.id);

    const { error: insertTransactionError } = await supabaseClient
      .from("transactions")
      .insert(
        transactions.map(t => ({
          user_id: user.id,
          transaction_date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
        }))
      );

    if (insertTransactionError) throw insertTransactionError;

    await supabaseClient
      .from("financial_uploads")
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq("id", uploadId);

    try {
      const insightsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-ai-insights`;
      const insightsResponse = await fetch(insightsUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          financialData: {
            total_revenue: metrics.total_revenue,
            total_expenses: metrics.total_expenses,
            outstanding_receivables: metrics.receivables,
            outstanding_payables: metrics.payables,
            transactions: transactions,
          },
        }),
      });

      if (insightsResponse.ok) {
        const { insights } = await insightsResponse.json();

        await supabaseClient.from("ai_insights").delete().eq("user_id", user.id);

        await supabaseClient.from("ai_insights").insert(
          insights.map((insight: any) => ({
            user_id: user.id,
            insight_text: insight.description,
            insight_type: insight.insight_type,
            severity: insight.severity,
            title: insight.title,
            llm_model: 'mistral-small-latest',
          }))
        );
      }
    } catch (err) {
      console.error("Error generating AI insights:", err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadId,
        metrics,
        transactionCount: transactions.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing upload:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process upload" }),
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

function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const categories = {
    credit: ['Sales Revenue', 'Service Income', 'Investment Returns', 'Loan Received'],
    debit: ['Vendor Payment', 'Salary', 'Rent', 'Utilities', 'Marketing', 'Raw Materials', 'Equipment', 'Other'],
  };

  const now = new Date();
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const isCredit = Math.random() > 0.4;
    const type = isCredit ? 'credit' : 'debit';
    const categoryList = categories[type];
    const category = categoryList[Math.floor(Math.random() * categoryList.length)];

    let amount: number;
    if (isCredit) {
      amount = Math.floor(Math.random() * 200000) + 50000;
    } else {
      amount = Math.floor(Math.random() * 150000) + 10000;
    }

    transactions.push({
      date: date.toISOString().split('T')[0],
      description: `${category} transaction`,
      amount,
      type,
      category,
    });
  }

  return transactions;
}

function parseTransactionData(data: any, fileType: string): Transaction[] {
  const transactions: Transaction[] = [];

  try {
    const rows = Array.isArray(data) ? data : [data];

    rows.forEach((row: any) => {
      const amount = parseFloat(row.amount || row.Amount || row.value || '0');
      const description = row.description || row.Description || row.narration || row.Narration || 'Transaction';
      const date = row.date || row.Date || row.transaction_date || new Date().toISOString().split('T')[0];

      let type: 'credit' | 'debit' = 'debit';
      if (row.type && row.type.toLowerCase() === 'credit') {
        type = 'credit';
      } else if (row.Type && row.Type.toLowerCase() === 'credit') {
        type = 'credit';
      } else if (amount > 0 && (description.toLowerCase().includes('revenue') || description.toLowerCase().includes('income') || description.toLowerCase().includes('sales'))) {
        type = 'credit';
      }

      const category = categorizeTransaction(description, type);

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type,
        category,
      });
    });
  } catch (err) {
    console.error("Error parsing transaction data:", err);
  }

  return transactions;
}

function categorizeTransaction(description: string, type: 'credit' | 'debit'): string {
  const desc = description.toLowerCase();

  if (type === 'credit') {
    if (desc.includes('sales') || desc.includes('revenue')) return 'Sales Revenue';
    if (desc.includes('service')) return 'Service Income';
    if (desc.includes('investment') || desc.includes('interest')) return 'Investment Returns';
    if (desc.includes('loan') || desc.includes('credit')) return 'Loan Received';
    return 'Other Income';
  } else {
    if (desc.includes('salary') || desc.includes('wage')) return 'Salary';
    if (desc.includes('rent') || desc.includes('lease')) return 'Rent';
    if (desc.includes('utility') || desc.includes('electricity') || desc.includes('water')) return 'Utilities';
    if (desc.includes('marketing') || desc.includes('advertising')) return 'Marketing';
    if (desc.includes('vendor') || desc.includes('supplier')) return 'Vendor Payment';
    if (desc.includes('raw material') || desc.includes('inventory')) return 'Raw Materials';
    if (desc.includes('equipment') || desc.includes('machinery')) return 'Equipment';
    return 'Other';
  }
}

function computeFinancialMetrics(transactions: Transaction[], userId: string) {
  const creditTransactions = transactions.filter(t => t.type === 'credit');
  const debitTransactions = transactions.filter(t => t.type === 'debit');

  const total_revenue = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
  const total_expenses = debitTransactions.reduce((sum, t) => sum + t.amount, 0);
  const cash_inflow = total_revenue;
  const cash_outflow = total_expenses;

  const receivables = Math.floor(total_revenue * 0.12);
  const payables = Math.floor(total_expenses * 0.08);
  const loan_obligations = Math.floor(total_revenue * 0.15);

  const net_profit = total_revenue - total_expenses;
  const profit_margin = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

  const health_score = calculateHealthScore(profit_margin, receivables, total_revenue, total_expenses);
  const credit_score = calculateCreditScore(net_profit, total_revenue, loan_obligations, receivables);

  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const data_period_start = dates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  const data_period_end = dates[dates.length - 1]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

  return {
    user_id: userId,
    total_revenue: Math.round(total_revenue),
    total_expenses: Math.round(total_expenses),
    cash_inflow: Math.round(cash_inflow),
    cash_outflow: Math.round(cash_outflow),
    receivables: Math.round(receivables),
    payables: Math.round(payables),
    loan_obligations: Math.round(loan_obligations),
    profit_margin: Math.round(profit_margin * 100) / 100,
    health_score: Math.round(health_score),
    credit_score: Math.round(credit_score),
    data_period_start,
    data_period_end,
    transaction_count: transactions.length,
  };
}

function calculateHealthScore(
  profitMargin: number,
  receivables: number,
  revenue: number,
  expenses: number
): number {
  let score = 50;

  if (profitMargin >= 20) score += 20;
  else if (profitMargin >= 10) score += 10;
  else if (profitMargin >= 0) score += 5;
  else score -= 20;

  const receivablesRatio = revenue > 0 ? (receivables / revenue) * 100 : 0;
  if (receivablesRatio < 10) score += 15;
  else if (receivablesRatio < 20) score += 10;
  else if (receivablesRatio < 30) score += 5;
  else score -= 10;

  const cashFlow = revenue - expenses;
  if (cashFlow > 0) {
    const cashFlowRatio = (cashFlow / revenue) * 100;
    if (cashFlowRatio >= 20) score += 15;
    else if (cashFlowRatio >= 10) score += 10;
    else score += 5;
  } else {
    score -= 15;
  }

  return Math.min(Math.max(score, 0), 100);
}

function calculateCreditScore(
  netProfit: number,
  revenue: number,
  loanObligations: number,
  receivables: number
): number {
  let score = 50;

  if (netProfit > 0) {
    const profitRatio = (netProfit / revenue) * 100;
    if (profitRatio >= 15) score += 25;
    else if (profitRatio >= 10) score += 15;
    else if (profitRatio >= 5) score += 10;
  } else {
    score -= 20;
  }

  const debtRatio = revenue > 0 ? (loanObligations / revenue) * 100 : 0;
  if (debtRatio < 20) score += 15;
  else if (debtRatio < 40) score += 10;
  else if (debtRatio < 60) score += 5;
  else score -= 10;

  const receivablesRatio = revenue > 0 ? (receivables / revenue) * 100 : 0;
  if (receivablesRatio < 15) score += 10;
  else if (receivablesRatio < 25) score += 5;
  else score -= 5;

  return Math.min(Math.max(score, 0), 100);
}

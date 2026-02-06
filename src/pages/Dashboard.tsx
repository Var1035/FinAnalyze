
import React, { useEffect, useState, useCallback } from 'react';
import { api, MetricsData, UploadHistoryItem } from '../services/api';

// ... (existing imports)

// ... inside Dashboard component ...


import MetricCard from '../components/MetricCard';
import { FinancialBarChart } from '../components/Charts';
import GettingStarted from '../components/GettingStarted';
import BankConnectModal from '../components/BankConnectModal';
import ExplanationModal from '../components/ExplanationModal';
import { useLanguage } from '../contexts/LanguageContext';
import { getAIExplanation, ExplanationContext } from '../services/aiExplanation';
import { generateInvestorReport } from '../utils/pdfGenerator';
import { DollarSign, TrendingUp, TrendingDown, Activity, Plus, RefreshCw, AlertCircle, FileText, Calendar, CheckCircle, Download, Sparkles, Shield } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// GST Demo Data Type
interface GSTData {
  gstin: string;
  period: string;
  total_taxable_value: number;
  gst_collected: number;
  gst_paid: number;
  pending_liability: number;
  compliance_status: string;
  compliance_reason: string;
  gstr_1_status: string;
  gstr_3b_status: string;
  last_filed_date: string;
  delay_days: number;
  is_demo: boolean;
}

interface DashboardProps {
  onUploadNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onUploadNew }) => {
  const { t, language } = useLanguage();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  const [bankConnected, setBankConnected] = useState(false);

  // Industry Selection
  const [industry, setIndustry] = useState(() => localStorage.getItem('fin_industry') || 'Retail');

  // Update industry persistence
  useEffect(() => {
    localStorage.setItem('fin_industry', industry);
  }, [industry]);

  // AI Explanation Modal State
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationTitle, setExplanationTitle] = useState('');
  const [explanationStatus, setExplanationStatus] = useState<'Positive' | 'Neutral' | 'Negative'>('Neutral');
  const [explanationText, setExplanationText] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | undefined>();
  const [currentSection, setCurrentSection] = useState<ExplanationContext['section'] | null>(null);

  // GST Demo State
  const [gstData, setGstData] = useState<GSTData | null>(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  // Bookkeeping State
  interface BookkeepingData {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    monthly_income: { month: string; amount: number }[];
    monthly_expenses: { month: string; amount: number }[];
    expense_categories: { category: string; amount: number }[];
    cash_transactions: number;
    non_cash_transactions: number;
    total_transactions: number;
    has_sufficient_data: boolean;
  }
  const [bookkeepingData, setBookkeepingData] = useState<BookkeepingData | null>(null);
  const [bookkeepingLoading, setBookkeepingLoading] = useState(false);

  // Forecast State
  interface ForecastData {
    has_sufficient_data: boolean;
    message?: string;
    monthly_projections: {
      month: string;
      projected_revenue: number;
      projected_expenses: number;
      projected_profit: number;
      net_cash_movement: number;
    }[];
    summary: {
      total_3month_revenue: number;
      total_3month_expenses: number;
      total_3month_profit: number;
      avg_monthly_revenue: number;
      avg_monthly_expenses: number;
    };
    disclaimer?: string;
  }
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Working Capital State
  interface WorkingCapitalData {
    receivables: number;
    payables: number;
    working_capital_gap: number;
    risk_level: string;
    key_observations: string[];
    has_sufficient_data: boolean;
  }
  const [workingCapitalData, setWorkingCapitalData] = useState<WorkingCapitalData | null>(null);
  const [workingCapitalLoading, setWorkingCapitalLoading] = useState(false);

  // Inventory State
  interface InventoryData {
    total_items: number;
    total_quantity: number;
    total_value: number;
    top_items: { item_name: string; quantity: number; total_value: number }[];
    has_data: boolean;
  }
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Loan State
  interface LoanData {
    total_outstanding: number;
    total_monthly_emi: number;
    loan_count: number;
    loans: { lender: string; outstanding_amount: number; monthly_emi: number }[];
    has_data: boolean;
  }
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [loanLoading, setLoanLoading] = useState(false);

  // Persistence Keys
  const STORAGE_KEY = 'fin_health_metrics';
  const BANK_CONN_KEY = 'bank_connected_status';

  const fetchMetrics = async (forceRefresh = false) => {
    setLoading(true);
    try {
      let data = null;

      // 1. Try to load from local storage first (if not forcing refresh)
      if (!forceRefresh) {
        const cached = localStorage.getItem(STORAGE_KEY);
        const cachedBank = localStorage.getItem(BANK_CONN_KEY);

        if (cachedBank) setBankConnected(JSON.parse(cachedBank));

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed) {
              setMetrics(parsed);
              data = parsed; // Mark as having data
            }
          } catch (e) {
            console.error("Cache parse error", e);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }

      // 2. Fetch from API (Always fetch in background if cached, or primary if not)
      if (!data || forceRefresh) {
        const apiData = await api.getMetrics();
        setMetrics(apiData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiData));
      } else {
        // If we loaded from cache, still refresh in background to get latest
        refreshInBackground();
      }

      // 3. Fetch upload history
      const history = await api.getUploadHistory();
      setUploadHistory(history);

      setError(null);
    } catch (err: any) {
      console.error("Fetch metrics error:", err);
      // Only set error if we don't have metrics (cached or otherwise)
      if (!metrics) {
        setError('Failed to load financial metrics.');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshInBackground = async () => {
    try {
      const data = await api.getMetrics();
      console.log("Background refresh success:", data);
      setMetrics(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Background refresh failed", e);
    }
  }

  // Fetch GST Demo Data from Mockoon
  const fetchGSTData = async () => {
    setGstLoading(true);
    setGstError(null);
    try {
      const token = (await (await import('../lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        setGstError('Please login to view GST data');
        return;
      }
      



   const response = await fetch(
  `${API_BASE_URL}/api/gst/overview`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch GST overview');
}

const data = await response.json();
setGstData(data);

  // Fetch Bookkeeping Summary
 const response = await fetch(
  `${API_BASE_URL}/api/bookkeeping/summary`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch bookkeeping summary');
}

const data = await response.json();
setBookkeeping(data);

  // Fetch Forecast Data
 const response = await fetch(
  `${API_BASE_URL}/api/forecast/3month`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch forecast');
}

const data = await response.json();
setForecast(data);


  useEffect(() => {
    fetchMetrics();
    fetchGSTData();
    fetchBookkeeping();
    fetchForecast();
    fetchWorkingCapital();
    fetchInventory();
    fetchLoan();
  }, []);

  // Fetch Working Capital Health
  const fetchWorkingCapital = async () => {
    setWorkingCapitalLoading(true);
    try {
      const token = (await (await import('../lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/working-capital/health`, {
        headers: { 'Authorization': `Bearer ${token}`,
                 'content-Type': 'application/json',
                   }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkingCapitalData(data);
        console.log('Working capital data loaded:', data);
      }
    } catch (err) {
      console.warn('Working capital fetch error:', err);
    } finally {
      setWorkingCapitalLoading(false);
    }
  };

  // Fetch Inventory Summary
  const response = await fetch(
  `${API_BASE_URL}/api/inventory/summary`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch inventory data');
}

const data = await response.json();
setInventory(data);


  // Fetch Loan Summary
  const response = await fetch(
  `${API_BASE_URL}/api/loans/summary`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch loan summary');
}

const data = await response.json();
setLoans(data);


  const handleBankConnect = () => {
    setBankConnected(true);
    localStorage.setItem(BANK_CONN_KEY, 'true');
  };

  const hasSufficientData = metrics && (
    metrics.total_revenue > 0 ||
    metrics.total_expenses > 0 ||
    metrics.cash_inflow > 0 ||
    metrics.total_receivables > 0 ||
    metrics.total_payables > 0
  );

  // Deterministic Rule-Based AI Insights
  const getAIInsights = () => {
    if (!metrics) return null;

    if (!hasSufficientData) {
      return ["Upload financial data to generate insights."];
    }

    const insights: string[] = [];
    const { net_profit, cash_inflow, cash_outflow, profit_margin, total_revenue, total_expenses, total_receivables, total_payables } = metrics;

    // 1. Profitability Rule (Strict Numeric)
    if (total_revenue > 0 || total_expenses > 0) {
      if (net_profit > 0) {
        insights.push(`Your business is profitable with a net profit of ₹${net_profit.toLocaleString()} (${profit_margin.toFixed(1)}% margin).`);
      } else if (net_profit < 0) {
        insights.push(`Your expenses exceed revenue, resulting in a net loss of ₹${Math.abs(net_profit).toLocaleString()}.`);
      } else {
        insights.push(`Business is breaking even with equal revenue and expenses.`);
      }
    }

    // 2. Profit Margin Rule
    if (total_revenue > 0 && profit_margin < 10 && profit_margin >= 0) {
      insights.push(`Profit margin is low at ${profit_margin.toFixed(1)}%. Cost control may improve sustainability.`);
    }

    // 3. Cash Flow Rule (Strict Numeric)
    if (cash_inflow > 0 || cash_outflow > 0) {
      if (cash_outflow > cash_inflow) {
        insights.push(`Warning: Cash outflow (₹${cash_outflow.toLocaleString()}) exceeds inflow (₹${cash_inflow.toLocaleString()}). Liquidity pressure detected.`);
      } else if (cash_inflow > cash_outflow) {
        insights.push(`Cash inflow exceeds outflow, indicating healthy liquidity.`);
      }
    }

    // 4. Receivables Rule
    if (total_receivables > 0) {
      insights.push(`Outstanding receivables of ₹${total_receivables.toLocaleString()} may impact cash flow.`);
    }

    // 5. Payables Rule
    if (total_payables > 0) {
      insights.push(`Pending payables of ₹${total_payables.toLocaleString()} require attention.`);
    }

    if (insights.length === 0) {
      return ["Upload more data to generate specific insights."];
    }

    return insights;
  };

  // AI Explanation Handler
  const handleExplain = useCallback(async (section: ExplanationContext['section']) => {
    if (!metrics || !hasSufficientData) return;

    // Determine status based on section
    let status: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';

    if (section === 'Financial Health') {
      if ((metrics.net_profit || 0) > 0) status = 'Positive';
      else if ((metrics.total_expenses || 0) > (metrics.total_revenue || 0)) status = 'Negative';
    } else if (section === 'Credit Readiness') {
      // Based on profit and cash flow
      if ((metrics.net_profit || 0) > 0 && (metrics.cash_inflow || 0) > (metrics.cash_outflow || 0)) {
        status = 'Positive';
      } else if ((metrics.net_profit || 0) < 0) {
        status = 'Negative';
      }
    } else if (section === 'Cost Optimization') {
      // Cost optimization is advisory
      status = 'Neutral';
    } else if (section === 'AI Insights') {
      if ((metrics.net_profit || 0) > 0) status = 'Positive';
      else if ((metrics.net_profit || 0) < 0) status = 'Negative';
    } else if (section === 'GST Compliance') {
      // GST status based on gstData
      if (gstData) {
        if (gstData.compliance_status === 'Good') status = 'Positive';
        else if (gstData.compliance_status === 'At Risk') status = 'Negative';
      }
    }

    // Calculate derived metrics for context
    // GST Compliance logic
    if (section === 'GST Compliance' && gstData) {
      if (gstData.compliance_status === 'Good') status = 'Positive';
      else if (gstData.compliance_status === 'At Risk') status = 'Negative';
    }

    // Set modal state
    setExplanationTitle(section);
    setExplanationStatus(status);
    setCurrentSection(section);
    setExplanationLoading(true);
    setExplanationError(undefined);
    setExplanationText('');
    setShowExplanationModal(true);

    // Build context
    // Construct metric extensions
    const metric_extensions = {
      inventory_total: inventoryData?.total_value,
      inventory_items: inventoryData?.total_items,
      loan_outstanding: loanData?.total_outstanding,
      loan_emi: loanData?.total_monthly_emi,
      working_capital_gap: workingCapitalData?.working_capital_gap,
      risk_level: workingCapitalData?.risk_level
    };

    const result = await getAIExplanation({
      section,
      status,
      industry,
      key_metrics: {
        total_revenue: metrics.total_revenue,
        total_expenses: metrics.total_expenses,
        net_profit: metrics.net_profit,
        profit_margin: metrics.profit_margin,
        cash_flow_status: metrics.cash_inflow > metrics.cash_outflow ? 'positive' : 'negative',
        receivables_ratio: (metrics.total_receivables / metrics.total_revenue) * 100,
        payables_ratio: (metrics.total_payables / metrics.total_expenses) * 100,
      },
      metric_extensions,
      language
    });

    setExplanationLoading(false);
    if (result.error) {
      setExplanationError(result.error);
    } else {
      setExplanationText(result.explanation);
    }
  }, [metrics, hasSufficientData, language]);

  // Retry explanation
  const handleRetryExplanation = useCallback(() => {
    if (currentSection) {
      handleExplain(currentSection);
    }
  }, [currentSection, handleExplain]);

  // Credit Readiness Explanations (Deterministic, Rule-Based)
  const getCreditExplanations = (): { text: string; type: 'positive' | 'warning' | 'neutral' }[] => {
    if (!metrics || !hasSufficientData) return [];

    const explanations: { text: string; type: 'positive' | 'warning' | 'neutral' }[] = [];
    const { net_profit, cash_inflow, cash_outflow, total_payables, total_receivables } = metrics;

    // Positive signals
    if (net_profit > 0 && cash_inflow > cash_outflow) {
      explanations.push({ text: "Positive operating signals support basic credit readiness.", type: 'positive' });
    }

    // Warning signals
    if (net_profit < 0) {
      explanations.push({ text: "Negative profitability may limit credit eligibility.", type: 'warning' });
    }

    if (cash_outflow > cash_inflow) {
      explanations.push({ text: "Cash outflow exceeds inflow, indicating liquidity pressure.", type: 'warning' });
    }

    if (total_payables > 0) {
      explanations.push({ text: "Outstanding payables may impact short-term credit capacity.", type: 'neutral' });
    }

    if (total_receivables > 0 && net_profit > 0) {
      explanations.push({ text: "Receivables collection may improve credit position.", type: 'neutral' });
    }

    return explanations;
  };

  // Dashboard export replaced by PDF generation utility

  const aiInsights = getAIInsights();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-accent border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-secondary animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Error Loading Dashboard</h3>
        <p className="text-secondary mb-6">{error}</p>
        <button
          onClick={() => fetchMetrics(true)}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={18} /> Retry
        </button>
      </div>
    );
  }

  // Format data for charts
  const cashFlowData = [
    {
      name: 'Cash Flow',
      Inflow: metrics?.cash_inflow || 0,
      Outflow: metrics?.cash_outflow || 0,
    }
  ];

  const liquidityData = [
    {
      name: 'Liquidity',
      Receivables: metrics?.total_receivables || 0,
      Payables: metrics?.total_payables || 0,
    }
  ];

  const profitabilityData = [
    {
      name: 'Profitability',
      Revenue: metrics?.total_revenue || 0,
      Expenses: metrics?.total_expenses || 0,
      Profit: metrics?.net_profit || 0
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-secondary mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Industry Selector */}
          <div className="relative hidden md:block group">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-border rounded-lg pl-3 pr-8 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-primary shadow-sm hover:border-blue-300 transition-colors"
            >
              <option value="Retail">Retail</option>
              <option value="Services">Services</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          <button onClick={() => fetchMetrics(true)} className="p-2 text-secondary hover:text-primary transition-colors" title={t('dashboard.refresh')}>
            <RefreshCw size={20} />
          </button>
          {hasSufficientData && (
            <button
              onClick={() => generateInvestorReport({
                metrics,
                forecast: forecastData?.monthly_projections || [],
                workingCapital: workingCapitalData,
                inventory: inventoryData,
                loan: loanData,
                aiInsights: getAIInsights() || [],
                industry: industry
              })}
              className="btn-secondary flex items-center gap-2 shrink-0 bg-white border-border hover:bg-gray-50 text-primary"
            >
              <Download size={18} />
              Export Report
            </button>
          )}
          <button onClick={onUploadNew} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={20} />
            {t('dashboard.uploadNew')}
          </button>
        </div>
      </div>

      {/* Stage 1: Cold Start Guide */}
      {!hasSufficientData && (
        <GettingStarted
          onUploadClick={onUploadNew}
          onBankConnectClick={() => setShowBankModal(true)}
        />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('metrics.totalRevenue')}
          value={`₹${(metrics?.total_revenue || 0).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          className="border-l-4 border-l-blue-500"
        />
        <MetricCard
          title={t('metrics.totalReceivables')}
          value={`₹${(metrics?.total_receivables || 0).toLocaleString()}`}
          icon={<Activity size={24} />}
          className="border-l-4 border-l-purple-500"
        />
        <MetricCard
          title={t('metrics.netProfit')}
          value={`₹${(metrics?.net_profit || 0).toLocaleString()}`}
          subValue={hasSufficientData && metrics?.profit_margin ? `${metrics.profit_margin.toFixed(1)}% ${t('metrics.profitMargin')}` : undefined}
          icon={<TrendingUp size={24} />}
          className="border-l-4 border-l-green-500"
        />
        <MetricCard
          title={t('metrics.cashInflow')}
          value={`₹${(metrics?.cash_inflow || 0).toLocaleString()}`}
          icon={<TrendingDown size={24} className="text-green-500" />}
          className="border-l-4 border-l-teal-500"
        />
      </div>

      {/* Stage 2: Financial Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Financial Health Summary */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col card-hover">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            {t('cards.financialHealth')}
          </h3>
          {hasSufficientData ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${(metrics?.net_profit || 0) > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : (metrics?.total_expenses || 0) > (metrics?.total_revenue || 0)
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                  {(metrics?.net_profit || 0) > 0 ? t('status.goodStanding') : (metrics?.total_expenses || 0) > (metrics?.total_revenue || 0) ? t('status.needsAttention') : t('status.neutral')}
                </div>
              </div>
              <p className="text-sm text-secondary">
                {(metrics?.net_profit || 0) > 0
                  ? 'Your business is generating positive net profit. Maintain current revenue streams.'
                  : (metrics?.total_expenses || 0) > (metrics?.total_revenue || 0)
                    ? 'Expenses are exceeding revenue. Review cost structures immediately.'
                    : 'Revenue and expenses are balanced.'}
              </p>
              {/* AI Explain Button */}
              <button
                onClick={() => handleExplain('Financial Health')}
                className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Sparkles size={14} />
                Explain with AI
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mb-3">
                <Activity size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-primary mb-1">{t('status.inactive')}</p>
              <p className="text-xs text-secondary">{t('status.uploadToActivate')}</p>
            </div>
          )}
        </div>

        {/* Credit Readiness */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col card-hover">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            {t('cards.creditReadiness')}
          </h3>
          {hasSufficientData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">{t('creditReadiness.eligibility')}</span>
                <span className="text-sm font-bold text-primary">{t('creditReadiness.preliminary')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full w-[60%] transition-all duration-700"></div>
              </div>
              <p className="text-xs text-secondary mt-2">
                {t('creditReadiness.potential')}: <span className="font-semibold text-primary">{t('creditReadiness.workingCapitalLoan')}</span>
              </p>
              {/* Credit Readiness Explanations */}
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                {getCreditExplanations().map((exp, idx) => (
                  <p key={idx} className={`text-xs flex items-start gap-2 ${exp.type === 'positive' ? 'text-green-600 dark:text-green-400' : exp.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${exp.type === 'positive' ? 'bg-green-500' : exp.type === 'warning' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
                    {exp.text}
                  </p>
                ))}
              </div>
              {/* AI Explain Button */}
              <button
                onClick={() => handleExplain('Credit Readiness')}
                className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Sparkles size={14} />
                Explain with AI
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <p className="text-sm text-secondary mb-1">{t('creditReadiness.uploadToUnlock')}</p>
              <p className="text-xs text-muted">{t('creditReadiness.dataRequired')}</p>
            </div>
          )}
        </div>

        {/* Cost Optimization - Always Visible */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm card-hover">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Cost Optimization
          </h3>
          <ul className="space-y-3">
            <li className="text-sm text-secondary flex gap-3 items-start p-2.5 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
              <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
              <span>Review recurring subscription costs</span>
            </li>
            <li className="text-sm text-secondary flex gap-3 items-start p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>Negotiate supplier payment terms (Net-45)</span>
            </li>
            <li className="text-sm text-secondary flex gap-3 items-start p-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
              <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
              <span>Monitor receivable collection cycles</span>
            </li>
          </ul>
          {/* AI Explain Button */}
          {hasSufficientData && (
            <button
              onClick={() => handleExplain('Cost Optimization')}
              className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Sparkles size={14} />
              Explain with AI
            </button>
          )}
        </div>
      </div>

      {/* Stage 3: AI Insights (Data-Gated) */}
      {metrics && aiInsights && aiInsights.length > 0 && (
        <div className="relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/50 dark:via-blue-950/50 dark:to-purple-950/50 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 mb-8 overflow-hidden animate-fade-in">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-lg font-bold text-primary">AI Insights</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-indigo-300">Deterministic</span>
              </div>
              <ul className="space-y-2">
                {aiInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
              {/* AI Explain Button */}
              <button
                onClick={() => handleExplain('AI Insights')}
                className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <Sparkles size={14} />
                Get Detailed Explanation
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-gray-900/30 rounded-lg">
              <span className="text-xs font-medium text-secondary">Powered by</span>
              <span className="font-bold text-primary">  Mistral AI (with deterministic financial rules)</span>
            </div>
          </div>
        </div>
      )}

      {/* GST Compliance Demo Section */}
      {hasSufficientData && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">GST Compliance</h3>
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                  Demo Integration (Simulated via Mockoon)
                </span>
              </div>
            </div>
            {gstData && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${gstData.compliance_status === 'Good'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {gstData.compliance_status === 'Good' ? '✅' : '⚠️'} {gstData.compliance_status}
              </span>
            )}
          </div>

          {gstLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="text-amber-500 animate-spin" />
              <span className="ml-2 text-secondary">Loading GST demo data...</span>
            </div>
          ) : gstError ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle size={32} className="text-amber-500 mb-2" />
              <p className="text-secondary text-sm">{gstError}</p>
              <p className="text-xs text-muted mt-1">Ensure Mockoon is running on port 3001</p>
              <button
                onClick={fetchGSTData}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : gstData ? (
            <div className="space-y-4">
              {/* GST Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <p className="text-xs text-secondary mb-1">GSTIN</p>
                  <p className="font-mono text-sm font-bold text-primary">{gstData.gstin}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <p className="text-xs text-secondary mb-1">Period</p>
                  <p className="text-sm font-semibold text-primary">{gstData.period}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <p className="text-xs text-secondary mb-1">GST Collected</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">₹{gstData.gst_collected.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <p className="text-xs text-secondary mb-1">GST Paid</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₹{gstData.gst_paid.toLocaleString()}</p>
                </div>
              </div>

              {/* Alerts Row */}
              <div className="flex flex-wrap gap-3">
                {gstData.pending_liability > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Pending Liability: ₹{gstData.pending_liability.toLocaleString()}
                    </span>
                  </div>
                )}
                {gstData.delay_days > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                    <Calendar size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Filing Delay: {gstData.delay_days} days
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                  <FileText size={16} className="text-gray-500" />
                  <span className="text-sm text-secondary">
                    GSTR-1: <span className="font-medium text-primary">{gstData.gstr_1_status}</span> |
                    GSTR-3B: <span className="font-medium text-primary">{gstData.gstr_3b_status}</span>
                  </span>
                </div>
              </div>

              {/* AI Explain Button */}
              <button
                onClick={() => handleExplain('GST Compliance')}
                className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <Sparkles size={14} />
                Explain with AI
              </button>
            </div>
          ) : (
            <p className="text-sm text-secondary text-center py-4">No GST data available</p>
          )}
        </div>
      )}

      {/* Bookkeeping Summary Section */}
      {hasSufficientData && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Bookkeeping Summary</h3>
                <span className="text-xs text-secondary">Auto-generated from uploaded data</span>
              </div>
            </div>
          </div>

          {bookkeepingLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="text-emerald-500 animate-spin" />
              <span className="ml-2 text-secondary">Loading bookkeeping summary...</span>
            </div>
          ) : bookkeepingData && bookkeepingData.has_sufficient_data ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Total Income</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{bookkeepingData.total_income.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">₹{bookkeepingData.total_expenses.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Net Balance</p>
                  <p className={`text-lg font-bold ${bookkeepingData.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ₹{bookkeepingData.net_balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Expense Categories */}
              {bookkeepingData.expense_categories.length > 0 && (
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-primary mb-3">Top Expense Categories</h4>
                  <div className="space-y-2">
                    {bookkeepingData.expense_categories.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-secondary">{cat.category}</span>
                        <span className="text-sm font-medium text-primary">₹{cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction Stats */}
              <div className="flex items-center gap-4 text-xs text-secondary">
                <span>📊 {bookkeepingData.total_transactions} transactions analyzed</span>
                <span>💳 {bookkeepingData.cash_transactions} cash transactions</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-secondary">Insufficient data for bookkeeping summary</p>
              <p className="text-xs text-muted mt-1">Upload more financial documents to generate summary</p>
            </div>
          )}
        </div>
      )}

      {/* 3-Month Financial Forecast Section */}
      {hasSufficientData && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20 border border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">3-Month Financial Forecast</h3>
                <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-medium">
                  Rule-based estimate for planning purposes
                </span>
              </div>
            </div>
          </div>

          {forecastLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="text-violet-500 animate-spin" />
              <span className="ml-2 text-secondary">Generating forecast...</span>
            </div>
          ) : forecastData && forecastData.has_sufficient_data ? (
            <div className="space-y-4">
              {/* Monthly Projections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecastData.monthly_projections.map((proj, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                    <p className="text-xs text-secondary mb-2">{proj.month}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary">Revenue</span>
                        <span className="text-xs font-medium text-green-600">₹{proj.projected_revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary">Expenses</span>
                        <span className="text-xs font-medium text-red-600">₹{proj.projected_expenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                        <span className="text-xs font-medium text-primary">Net Profit</span>
                        <span className={`text-xs font-bold ${proj.projected_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{proj.projected_profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-primary mb-3">3-Month Total Projection</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-secondary">Total Revenue</p>
                    <p className="text-sm font-bold text-green-600">₹{forecastData.summary.total_3month_revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Total Expenses</p>
                    <p className="text-sm font-bold text-red-600">₹{forecastData.summary.total_3month_expenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Total Profit</p>
                    <p className={`text-sm font-bold ${forecastData.summary.total_3month_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{forecastData.summary.total_3month_profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              {forecastData.disclaimer && (
                <p className="text-xs text-muted italic text-center">{forecastData.disclaimer}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-secondary">Not enough historical data to forecast</p>
              <p className="text-xs text-muted mt-1">Upload at least 3 months of financial data</p>
            </div>
          )}
        </div>
      )}

      {/* Working Capital Health Section */}
      {hasSufficientData && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/20 dark:via-sky-950/20 dark:to-blue-950/20 border border-cyan-200/50 dark:border-cyan-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Working Capital Health</h3>
                <span className="text-xs text-secondary">Cash flow position analysis</span>
              </div>
            </div>
            {workingCapitalData && workingCapitalData.has_sufficient_data && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${workingCapitalData.risk_level === 'Low'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : workingCapitalData.risk_level === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {workingCapitalData.risk_level === 'Low' ? '✅' : workingCapitalData.risk_level === 'Medium' ? '⚠️' : '🚨'} {workingCapitalData.risk_level} Risk
              </span>
            )}
          </div>

          {workingCapitalLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="text-cyan-500 animate-spin" />
              <span className="ml-2 text-secondary">Analyzing working capital...</span>
            </div>
          ) : workingCapitalData && workingCapitalData.has_sufficient_data ? (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Receivables</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{workingCapitalData.receivables.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Payables</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">₹{workingCapitalData.payables.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-secondary mb-1">Working Capital Gap</p>
                  <p className={`text-lg font-bold ${workingCapitalData.working_capital_gap <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ₹{Math.abs(workingCapitalData.working_capital_gap).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Observations */}
              {workingCapitalData.key_observations.length > 0 && (
                <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-primary mb-2">Key Observations</h4>
                  <ul className="space-y-1">
                    {workingCapitalData.key_observations.slice(0, 4).map((obs, idx) => (
                      <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-secondary">Not enough data to assess working capital</p>
              <p className="text-xs text-muted mt-1">Upload sales and purchase data to analyze</p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Snapshot Section */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/20 dark:via-gray-950/20 dark:to-zinc-950/20 border border-slate-200/50 dark:border-slate-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-lg">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Inventory Snapshot</h3>
            <span className="text-xs text-secondary">Optional data extension</span>
          </div>
        </div>

        {inventoryLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw size={20} className="text-slate-500 animate-spin" />
            <span className="ml-2 text-secondary text-sm">Loading inventory...</span>
          </div>
        ) : inventoryData && inventoryData.has_data ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
              <p className="text-xs text-secondary mb-1">Total Items</p>
              <p className="text-xl font-bold text-primary">{inventoryData.total_items}</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
              <p className="text-xs text-secondary mb-1">Total Inventory Value</p>
              <p className="text-xl font-bold text-primary">₹{inventoryData.total_value.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-secondary">
            <p>Inventory data not provided</p>
            <p className="text-xs text-muted mt-1">Upload inventory CSV to see snapshot</p>
          </div>
        )}
      </div>

      {/* Loan & Credit Obligations Section */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-950/20 dark:via-pink-950/20 dark:to-red-950/20 border border-rose-200/50 dark:border-rose-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Loan & Credit Obligations</h3>
            <span className="text-xs text-secondary">Optional data extension</span>
          </div>
        </div>

        {loanLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw size={20} className="text-rose-500 animate-spin" />
            <span className="ml-2 text-secondary text-sm">Loading loan data...</span>
          </div>
        ) : loanData && loanData.has_data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                <p className="text-xs text-secondary mb-1">Outstanding Amount</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">₹{loanData.total_outstanding.toLocaleString()}</p>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 text-center">
                <p className="text-xs text-secondary mb-1">Monthly EMI Burden</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">₹{loanData.total_monthly_emi.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-secondary text-center">{loanData.loan_count} loan(s) tracked</p>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-secondary">
            <p>No loan obligations uploaded</p>
            <p className="text-xs text-muted mt-1">Upload loan CSV to track obligations</p>
          </div>
        )}
      </div>

      {/* Bank Connection Demo Modal Trigger - Only show here if data exists */}
      {hasSufficientData && (
        <div className="bg-card p-6 rounded-xl border border-dashed border-border mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              {bankConnected ? "Primary Bank Account" : "Connect Bank Account"}
            </h3>
            <p className="text-sm text-secondary">
              {bankConnected
                ? "Status: Connected – Awaiting synchronization of recent transactions."
                : "Securely connect your primary bank account via Account Aggregator (Demo)."
              }
            </p>
          </div>
          <button
            onClick={() => setShowBankModal(true)}
            disabled={bankConnected}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-opacity whitespace-nowrap
            ${bankConnected
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-primary text-white hover:opacity-90"}`}
            style={bankConnected ? {} : { backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {bankConnected ? "Connected via AA" : "Connect via AA"}
          </button>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm card-hover">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Revenue & Profitability
          </h3>
          {hasSufficientData ? (
            <FinancialBarChart
              data={profitabilityData}
              xKey="name"
              bars={[
                { key: 'Revenue', color: 'var(--chart-1)', name: 'Revenue' },
                { key: 'Expenses', color: 'var(--chart-3)', name: 'Expenses' },
                { key: 'Profit', color: 'var(--success)', name: 'Net Profit' }
              ]}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-secondary bg-secondary/20 rounded-lg">
              No data available to render charts
            </div>
          )}
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm card-hover">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            Cash Flow
          </h3>
          {hasSufficientData ? (
            <FinancialBarChart
              data={cashFlowData}
              xKey="name"
              bars={[
                { key: 'Inflow', color: 'var(--chart-4)', name: 'Cash Inflow' },
                { key: 'Outflow', color: 'var(--chart-5)', name: 'Cash Outflow' }
              ]}
            />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-sm text-secondary bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border-2 border-dashed border-border">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-medium text-primary mb-1">No Chart Data</p>
              <p className="text-xs">Upload financial data to view charts</p>
            </div>
          )}
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm card-hover lg:col-span-2">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            Liquidity: Receivables vs Payables
          </h3>
          {hasSufficientData ? (
            <FinancialBarChart
              data={liquidityData}
              xKey="name"
              bars={[
                { key: 'Receivables', color: 'var(--chart-2)', name: 'Receivables' },
                { key: 'Payables', color: 'var(--error)', name: 'Payables' }
              ]}
            />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-sm text-secondary bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border-2 border-dashed border-border">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-medium text-primary mb-1">No Chart Data</p>
              <p className="text-xs">Upload financial data to view charts</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Window Indicator */}
      {hasSufficientData && (
        <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
          <Calendar size={20} className="text-blue-600" />
          <div>
            <p className="text-sm font-medium text-primary">{t('dataWindow.analysisBasedOn')}</p>
            <p className="text-xs text-secondary">
              {uploadHistory.length > 0
                ? `${uploadHistory.length} ${t('dataWindow.filesProcessed')} • ${t('dataWindow.latest')}: ${new Date(uploadHistory[0]?.created_at).toLocaleDateString()}`
                : 'Data from your uploaded financial documents'
              }
            </p>
          </div>
        </div>
      )}

      {/* Upload History Section */}
      {uploadHistory.length > 0 && (
        <div className="mb-8 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary">{t('cards.uploadHistory')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-primary">{t('history.fileName')}</th>
                  <th className="px-4 py-2 text-left font-semibold text-primary">{t('history.type')}</th>
                  <th className="px-4 py-2 text-left font-semibold text-primary">{t('history.uploadDate')}</th>
                  <th className="px-4 py-2 text-center font-semibold text-primary">{t('history.status')}</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-secondary font-medium">{item.filename}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize
                        ${item.file_type === 'bank' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' :
                          item.file_type === 'sales' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                        {item.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        <span className="text-xs font-medium">Completed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BankConnectModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onConnect={handleBankConnect}
      />

      {/* DEBUG SECTION - REMOVE IN PRODUCTION */}
      <div className="mt-12 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-700 font-mono text-xs">
        <h4 className="font-bold text-red-500 mb-2">🚧 DEBUG INFO (Frontend State)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-primary">Local Storage Keys:</p>
            <ul className="list-disc pl-4 text-secondary">
              <li>Has Metrics: {localStorage.getItem('fin_health_metrics') ? 'Yes' : 'No'}</li>
              <li>Has Bank Conn: {localStorage.getItem('bank_connected_status') ? 'Yes' : 'No'}</li>
            </ul>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Clear Cache & Reload
            </button>
          </div>
          <div>
            <p className="font-semibold text-primary">Raw Metrics State:</p>
            <pre className="mt-1 p-2 bg-black/5 dark:bg-black/30 rounded overflow-auto max-h-32 text-primary">
              {JSON.stringify(metrics, null, 2)}
            </pre>
            <p className="mt-2 font-semibold text-primary">Calculated Check:</p>
            <p className="text-secondary">Sufficient Data: {hasSufficientData ? 'TRUE' : 'FALSE'}</p>
          </div>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <ExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
        title={explanationTitle}
        status={explanationStatus}
        explanation={explanationText}
        isLoading={explanationLoading}
        error={explanationError}
        onRetry={handleRetryExplanation}
      />

    </div>
  );
};

export default Dashboard;

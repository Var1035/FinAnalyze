import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Overview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('financial-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_metrics',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [metricsRes, transactionsRes] = await Promise.all([
        supabase.from('financial_metrics').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }).limit(30),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32"></div>
        ))}
      </div>
    );
  }

  const monthlyData = calculateMonthlyData(transactions);
  const categoryData = calculateCategoryData(transactions);
  const healthScore = metrics.health_score;
  const scoreColor = healthScore >= 70 ? 'var(--success)' : healthScore >= 40 ? 'var(--warning)' : 'var(--error)';
  const netProfit = metrics.total_revenue - metrics.total_expenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Financial Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time business performance metrics (computed server-side)
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`₹${formatNumber(metrics.total_revenue)}`}
          subtitle="Cash Inflow"
          positive={true}
          gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)"
        />
        <MetricCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`₹${formatNumber(metrics.total_expenses)}`}
          subtitle="Cash Outflow"
          positive={false}
          gradient="linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)"
        />
        <MetricCard
          icon={Wallet}
          label="Net Profit"
          value={`₹${formatNumber(netProfit)}`}
          subtitle={`${metrics.profit_margin.toFixed(1)}% margin`}
          positive={netProfit > 0}
          gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)"
        />
        <MetricCard
          icon={DollarSign}
          label="Receivables"
          value={`₹${formatNumber(metrics.receivables)}`}
          subtitle={`${metrics.transaction_count} txns`}
          positive={true}
          gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 p-6 rounded-2xl card-hover animate-slide-up"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Cash Flow Trend
            </h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--error)' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>Outflow</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Line type="monotone" dataKey="inflow" stroke="var(--success)" strokeWidth={3} name="Inflow" dot={{ fill: 'var(--success)', r: 5 }} />
              <Line type="monotone" dataKey="outflow" stroke="var(--error)" strokeWidth={3} name="Outflow" dot={{ fill: 'var(--error)', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className="p-6 rounded-2xl card-hover animate-slide-up"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            animationDelay: '0.1s',
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Financial Health Score
          </h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="var(--bg-secondary)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={scoreColor}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(healthScore / 100) * 440} 440`}
                  strokeLinecap="round"
                  className="score-circle"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: scoreColor }}>
                  {healthScore}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  out of 100
                </span>
              </div>
            </div>
            <p className="mt-6 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {healthScore >= 70 ? 'Excellent financial health' : healthScore >= 40 ? 'Good financial position' : 'Needs attention'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-2xl card-hover animate-slide-up"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            animationDelay: '0.2s',
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Expense by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="p-6 rounded-2xl card-hover animate-slide-up"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            animationDelay: '0.3s',
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Key Metrics (Server-Computed)
          </h3>
          <div className="space-y-4">
            <MetricRow
              label="Profit Margin"
              value={`${metrics.profit_margin.toFixed(1)}%`}
              target="15%"
              progress={metrics.profit_margin}
            />
            <MetricRow
              label="Credit Score"
              value={`${metrics.credit_score}/100`}
              target="70/100"
              progress={metrics.credit_score}
            />
            <MetricRow
              label="Loan Obligations"
              value={`₹${formatNumber(metrics.loan_obligations)}`}
              target={`₹${formatNumber(metrics.total_revenue * 0.2)}`}
              progress={(metrics.loan_obligations / metrics.total_revenue) * 100}
            />
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl card-hover animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          animationDelay: '0.4s',
        }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tx.type === 'credit' ? 'var(--success)' : 'var(--error)', opacity: 0.1 }}
                >
                  {tx.type === 'credit' ? (
                    <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <TrendingDown className="w-5 h-5" style={{ color: 'var(--error)' }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {tx.description}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(tx.transaction_date).toLocaleDateString()} • {tx.category}
                  </p>
                </div>
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: tx.type === 'credit' ? 'var(--success)' : 'var(--error)' }}
              >
                {tx.type === 'credit' ? '+' : '-'}₹{formatNumber(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

function MetricCard({ icon: Icon, label, value, subtitle, positive, gradient }: any) {
  return (
    <div
      className="p-6 rounded-2xl card-hover relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{ background: gradient }}
      ></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
          >
            <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {value}
        </h3>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function MetricRow({ label, value, target, progress }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {value} / {target}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
    </div>
  );
}

function calculateMonthlyData(transactions: any[]) {
  const months: { [key: string]: { inflow: number; outflow: number } } = {};

  transactions.forEach((tx) => {
    const month = new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short' });
    if (!months[month]) {
      months[month] = { inflow: 0, outflow: 0 };
    }
    if (tx.type === 'credit') {
      months[month].inflow += tx.amount;
    } else {
      months[month].outflow += tx.amount;
    }
  });

  return Object.entries(months).map(([month, data]) => ({
    month,
    inflow: Math.round(data.inflow),
    outflow: Math.round(data.outflow),
  })).reverse().slice(0, 6);
}

function calculateCategoryData(transactions: any[]) {
  const categories: { [key: string]: number } = {};

  transactions
    .filter(t => t.type === 'debit')
    .forEach((tx) => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function formatNumber(num: number) {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

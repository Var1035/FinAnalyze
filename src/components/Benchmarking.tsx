import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const industryBenchmarks: { [key: string]: any } = {
  Retail: { profitMargin: 8, expenseRatio: 75, growthRate: 12 },
  Manufacturing: { profitMargin: 12, expenseRatio: 70, growthRate: 10 },
  Agriculture: { profitMargin: 15, expenseRatio: 65, growthRate: 8 },
  Distribution: { profitMargin: 6, expenseRatio: 80, growthRate: 15 },
  Services: { profitMargin: 20, expenseRatio: 60, growthRate: 18 },
  Technology: { profitMargin: 25, expenseRatio: 55, growthRate: 25 },
  'Food & Beverage': { profitMargin: 10, expenseRatio: 72, growthRate: 14 },
  Other: { profitMargin: 15, expenseRatio: 68, growthRate: 12 },
};

export default function Benchmarking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [profileRes, financialRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('financial_metrics').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (financialRes.data) setFinancialData(financialRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile || !financialData) {
    return <div className="skeleton h-96"></div>;
  }

  const industry = profile.industry_type;
  const benchmark = industryBenchmarks[industry] || industryBenchmarks.Other;

  const yourProfitMargin = ((financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue) * 100;
  const yourExpenseRatio = (financialData.total_expenses / financialData.total_revenue) * 100;

  const comparisonData = [
    {
      metric: 'Profit Margin',
      yours: Math.round(yourProfitMargin),
      industry: benchmark.profitMargin,
    },
    {
      metric: 'Expense Ratio',
      yours: Math.round(yourExpenseRatio),
      industry: benchmark.expenseRatio,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Industry Benchmarking
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Compare your performance with {industry} industry standards
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Your Industry
          </h3>
          <div className="text-center py-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
            >
              <BarChart3 className="w-10 h-10" style={{ color: 'var(--accent)' }} />
            </div>
            <h4 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {industry}
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Benchmarked against {industry.toLowerCase()} industry averages
            </p>
          </div>
        </div>

        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Industry Average Growth
          </h3>
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-12 h-12" style={{ color: 'var(--success)' }} />
            </div>
            <h4 className="text-5xl font-bold mb-2" style={{ color: 'var(--success)' }}>
              {benchmark.growthRate}%
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Average annual growth rate
            </p>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl card-hover"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Performance Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="metric" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
            <Legend />
            <Bar dataKey="yours" fill="var(--accent)" name="Your Business" radius={[8, 8, 0, 0]} />
            <Bar dataKey="industry" fill="var(--chart-2)" name="Industry Average" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <MetricComparison
          title="Profit Margin"
          yours={yourProfitMargin}
          industry={benchmark.profitMargin}
          unit="%"
          description="Net profit as percentage of revenue"
        />
        <MetricComparison
          title="Expense Ratio"
          yours={yourExpenseRatio}
          industry={benchmark.expenseRatio}
          unit="%"
          description="Operating expenses as percentage of revenue"
          lowerIsBetter={true}
        />
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.1, border: '1px solid var(--accent)' }}
      >
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Benchmarking Insights
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {yourProfitMargin > benchmark.profitMargin
                ? `Your profit margin is ${(yourProfitMargin - benchmark.profitMargin).toFixed(1)}% above the industry average. Excellent performance!`
                : `Consider strategies to improve your profit margin to match the industry average of ${benchmark.profitMargin}%.`}
              {' '}
              {yourExpenseRatio < benchmark.expenseRatio
                ? 'Your expense management is better than industry average.'
                : 'Review your operational costs to optimize expense ratio.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricComparison({ title, yours, industry, unit, description, lowerIsBetter = false }: any) {
  const difference = yours - industry;
  const isPositive = lowerIsBetter ? difference < 0 : difference > 0;
  const percentage = Math.abs((difference / industry) * 100);

  return (
    <div
      className="p-6 rounded-2xl card-hover"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h4 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Your Business
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            {yours.toFixed(1)}
            {unit}
          </p>
        </div>
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Industry Avg.
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>
            {industry}
            {unit}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {isPositive ? (
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
        ) : (
          <TrendingDown className="w-5 h-5" style={{ color: 'var(--error)' }} />
        )}
        <span
          className="font-semibold"
          style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}
        >
          {percentage.toFixed(1)}% {isPositive ? 'better' : 'below'} industry average
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </div>
  );
}

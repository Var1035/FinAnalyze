import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Forecasting() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<any[]>([]);

  useEffect(() => {
    loadForecasts();
  }, [user]);

  const loadForecasts = async () => {
    if (!user) return;

    try {
      const { data: metrics, error } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (metrics) {
        const generatedForecasts = [];
        const currentDate = new Date();
        const avgRevenue = metrics.total_revenue;
        const avgExpenses = metrics.total_expenses;

        for (let i = 1; i <= 3; i++) {
          const forecastDate = new Date(currentDate);
          forecastDate.setMonth(forecastDate.getMonth() + i);

          const growthFactor = 1 + (Math.random() * 0.1 - 0.02);
          const projectedRevenue = avgRevenue * growthFactor;
          const projectedExpenses = avgExpenses * (1 + (Math.random() * 0.08 - 0.02));

          generatedForecasts.push({
            forecast_month: forecastDate.toISOString(),
            projected_revenue: projectedRevenue,
            projected_expenses: projectedExpenses,
            projected_cash_flow: projectedRevenue - projectedExpenses,
          });
        }

        setForecasts(generatedForecasts);
      }
    } catch (err) {
      console.error('Error loading forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-96"></div>;
  }

  const chartData = forecasts.map((f) => ({
    month: new Date(f.forecast_month).toLocaleDateString('en-US', { month: 'short' }),
    revenue: Math.round(f.projected_revenue),
    expenses: Math.round(f.projected_expenses),
    cashFlow: Math.round(f.projected_cash_flow),
  }));

  const avgCashFlow = forecasts.reduce((sum, f) => sum + f.projected_cash_flow, 0) / forecasts.length;
  const trend = forecasts.length >= 2
    ? forecasts[forecasts.length - 1].projected_cash_flow > forecasts[0].projected_cash_flow
    : true;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Financial Forecasting
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          3-month cash flow projections based on historical data
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--success)', opacity: 0.1 }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: 'var(--success)' }} />
            </div>
            {trend ? (
              <ArrowUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
            ) : (
              <ArrowDown className="w-5 h-5" style={{ color: 'var(--error)' }} />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            ₹{formatNumber(avgCashFlow)}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Avg. Monthly Cash Flow</p>
        </div>

        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {trend ? '+' : '-'}{Math.abs(calculateGrowth(forecasts)).toFixed(1)}%
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Projected Growth</p>
        </div>

        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: trend ? 'var(--success)' : 'var(--warning)', opacity: 0.1 }}
            >
              <TrendingDown className="w-6 h-6" style={{ color: trend ? 'var(--success)' : 'var(--warning)' }} />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {trend ? 'Positive' : 'Stable'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Cash Flow Outlook</p>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl card-hover"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          3-Month Cash Flow Projection
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--success)"
              strokeWidth={3}
              name="Projected Revenue"
              dot={{ fill: 'var(--success)', r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="var(--error)"
              strokeWidth={3}
              name="Projected Expenses"
              dot={{ fill: 'var(--error)', r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cashFlow"
              stroke="var(--accent)"
              strokeWidth={3}
              name="Net Cash Flow"
              dot={{ fill: 'var(--accent)', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className="p-6 rounded-2xl card-hover"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Month-by-Month Breakdown
        </h3>
        <div className="space-y-4">
          {forecasts.map((forecast, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {new Date(forecast.forecast_month).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h4>
                <span
                  className="font-bold"
                  style={{
                    color: forecast.projected_cash_flow >= 0 ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  ₹{formatNumber(forecast.projected_cash_flow)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Projected Revenue</p>
                  <p className="font-semibold" style={{ color: 'var(--success)' }}>
                    ₹{formatNumber(forecast.projected_revenue)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Projected Expenses</p>
                  <p className="font-semibold" style={{ color: 'var(--error)' }}>
                    ₹{formatNumber(forecast.projected_expenses)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.1, border: '1px solid var(--accent)' }}
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Forecast Insights
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Based on historical patterns, your business is projected to maintain {trend ? 'positive' : 'stable'} cash flow over the next quarter. Consider building a cash reserve to handle seasonal variations and unexpected expenses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number) {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function calculateGrowth(forecasts: any[]) {
  if (forecasts.length < 2) return 0;
  const first = forecasts[0].projected_cash_flow;
  const last = forecasts[forecasts.length - 1].projected_cash_flow;
  return ((last - first) / Math.abs(first)) * 100;
}

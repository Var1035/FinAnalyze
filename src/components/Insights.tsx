import { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Insights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();

    const channel = supabase
      .channel('insights-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_insights',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadInsights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (err) {
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const [financialRes, transactionsRes] = await Promise.all([
        supabase.from('financial_metrics').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }).limit(100),
      ]);

      if (!financialRes.data) {
        throw new Error('No financial data found');
      }

      const financialData = {
        total_revenue: financialRes.data.total_revenue,
        total_expenses: financialRes.data.total_expenses,
        outstanding_receivables: financialRes.data.receivables,
        outstanding_payables: financialRes.data.payables,
        transactions: transactionsRes.data?.map(t => ({
          type: t.type,
          amount: t.amount,
          category: t.category,
          date: t.transaction_date,
        })) || [],
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-insights`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ financialData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const { insights: newInsights } = await response.json();

      await supabase.from('ai_insights').delete().eq('user_id', user.id);

      const { error: insertError } = await supabase.from('ai_insights').insert(
        newInsights.map((insight: any) => ({
          user_id: user.id,
          insight_text: insight.description,
          insight_type: insight.insight_type,
          severity: insight.severity,
          title: insight.title,
          llm_model: 'mistral-small-latest',
        }))
      );

      if (insertError) throw insertError;

      await loadInsights();
    } catch (err: any) {
      console.error('Error generating insights:', err);
      alert(err.message || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32"></div>
        ))}
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6" style={{ color: 'var(--error)' }} />;
      case 'high':
        return <AlertTriangle className="w-6 h-6" style={{ color: 'var(--warning)' }} />;
      case 'medium':
        return <Info className="w-6 h-6" style={{ color: 'var(--accent)' }} />;
      default:
        return <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'var(--error)';
      case 'high':
        return 'var(--warning)';
      case 'medium':
        return 'var(--accent)';
      default:
        return 'var(--success)';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            AI-Powered Insights
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Smart recommendations based on your financial data
          </p>
        </div>
        <button
          onClick={generateNewInsights}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Regenerate Insights'}
        </button>
      </div>

      <div
        className="p-6 rounded-2xl animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid var(--accent)',
        }}
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--accent)' }}>
              Real-Time AI Analysis
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We've analyzed your financial data and generated {insights.length} actionable insights. These insights update automatically as your data changes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className="p-6 rounded-2xl card-hover cursor-pointer animate-slide-up"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              animationDelay: `${idx * 0.1}s`,
            }}
            onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: getSeverityColor(insight.severity), opacity: 0.1 }}
              >
                {getSeverityIcon(insight.severity)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {insight.title}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: getSeverityColor(insight.severity),
                      color: 'white',
                      opacity: 0.9,
                    }}
                  >
                    {insight.severity.toUpperCase()}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)' }}>
                  {insight.insight_text}
                </p>

                {expandedId === insight.id && (
                  <div className="mt-4 pt-4 border-t animate-slide-down" style={{ borderColor: 'var(--border)' }}>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Recommended Actions:
                    </h4>
                    <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                      {getRecommendedActions(insight.insight_type).map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No insights yet
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Click "Regenerate Insights" to generate AI-powered recommendations
          </p>
          <button onClick={generateNewInsights} className="btn-primary">
            Generate Insights
          </button>
        </div>
      )}
    </div>
  );
}

function getRecommendedActions(insightType: string): string[] {
  const actions: { [key: string]: string[] } = {
    cash_flow: [
      'Maintain a cash reserve equal to 3-6 months of operating expenses',
      'Review payment terms with customers to improve collection cycles',
      'Consider setting up automated payment reminders for clients',
      'Monitor daily cash positions and forecast weekly cash requirements',
    ],
    expense: [
      'Conduct a detailed audit of all recurring expenses',
      'Negotiate better rates with existing vendors or explore alternatives',
      'Implement expense approval workflows to control spending',
      'Review and optimize software subscriptions and licenses',
    ],
    credit: [
      'Ensure timely payment of all existing obligations',
      'Keep credit utilization below 30% of available limits',
      'Maintain updated financial documentation for loan applications',
      'Consider diversifying funding sources',
    ],
    receivables: [
      'Implement stricter credit checks for new customers',
      'Offer early payment discounts (e.g., 2% discount for payment within 10 days)',
      'Send payment reminders before and after due dates',
      'Consider invoice financing or factoring for immediate cash flow',
    ],
  };

  return actions[insightType] || [
    'Review this area regularly',
    'Consult with a financial advisor for specific guidance',
    'Track relevant metrics monthly',
  ];
}

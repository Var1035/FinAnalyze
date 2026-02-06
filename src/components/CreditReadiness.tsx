import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, TrendingUp, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreditReadiness() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: financialData, error } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setData(financialData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="skeleton h-96"></div>;
  }

  const creditScore = data.credit_score;
  const scoreColor = creditScore >= 70 ? 'var(--success)' : creditScore >= 40 ? 'var(--warning)' : 'var(--error)';

  const factors = [
    { label: 'Cash Flow Stability', status: creditScore >= 60, weight: 25 },
    { label: 'Revenue Consistency', status: creditScore >= 50, weight: 20 },
    { label: 'Expense Management', status: creditScore >= 55, weight: 20 },
    { label: 'Outstanding Obligations', status: creditScore >= 45, weight: 15 },
    { label: 'Business History', status: true, weight: 10 },
    { label: 'Documentation', status: true, weight: 10 },
  ];

  const loanOptions = [
    {
      type: 'Working Capital Loan',
      range: '₹5L - ₹25L',
      interest: '12-15% p.a.',
      tenure: '1-3 years',
      suitable: creditScore >= 60,
    },
    {
      type: 'Invoice Financing',
      range: '₹10L - ₹50L',
      interest: '14-18% p.a.',
      tenure: '3-12 months',
      suitable: creditScore >= 50,
    },
    {
      type: 'Business Term Loan',
      range: '₹10L - ₹1Cr',
      interest: '11-14% p.a.',
      tenure: '3-5 years',
      suitable: creditScore >= 70,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Credit & Loan Readiness
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your creditworthiness and financing options
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Credit Readiness Score
          </h3>
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="var(--bg-secondary)"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={scoreColor}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(creditScore / 100) * 553} 553`}
                  strokeLinecap="round"
                  className="score-circle"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold" style={{ color: scoreColor }}>
                  {creditScore}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  out of 100
                </span>
              </div>
            </div>
            <p className="mt-4 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>
              {creditScore >= 70 ? 'Excellent' : creditScore >= 40 ? 'Good' : 'Fair'}
            </p>
            <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              {creditScore >= 70
                ? 'Highly likely to get approved'
                : creditScore >= 40
                ? 'Good chance of approval'
                : 'May need improvement'}
            </p>
          </div>
        </div>

        <div
          className="lg:col-span-2 p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Score Factors
          </h3>
          <div className="space-y-4">
            {factors.map((factor, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {factor.status ? (
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                    )}
                    <span style={{ color: 'var(--text-primary)' }}>{factor.label}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {factor.weight}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: factor.status ? `${factor.weight * 4}%` : '0%',
                      background: factor.status ? 'var(--success)' : 'var(--error)',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recommended Loan Options
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {loanOptions.map((option, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl card-hover ${option.suitable ? '' : 'opacity-60'}`}
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
                >
                  <Building2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                {option.suitable && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'var(--success)', color: 'white' }}
                  >
                    Suitable
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                {option.type}
              </h4>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-semibold">{option.range}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-semibold">{option.interest}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenure:</span>
                  <span className="font-semibold">{option.tenure}</span>
                </div>
              </div>
              <button
                disabled={!option.suitable}
                className={`w-full mt-4 ${option.suitable ? 'btn-primary' : 'btn-secondary'}`}
              >
                {option.suitable ? 'Learn More' : 'Not Eligible'}
              </button>
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
              Tips to Improve Your Credit Score
            </h4>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• Maintain consistent positive cash flow</li>
              <li>• Pay all obligations on time</li>
              <li>• Keep accurate and updated financial records</li>
              <li>• Reduce outstanding receivables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

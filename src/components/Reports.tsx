import { useState, useEffect } from 'react';
import { FileText, Download, Eye, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Reports({ profile }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setFinancialData(data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !financialData) {
    return <div className="skeleton h-96"></div>;
  }

  const reports = [
    {
      title: 'Investor-Ready Financial Summary',
      description: 'Comprehensive financial overview for potential investors',
      icon: FileText,
      available: true,
    },
    {
      title: 'Credit Application Package',
      description: 'Documents ready for loan applications',
      icon: DollarSign,
      available: true,
    },
    {
      title: 'Tax Preparation Report',
      description: 'Organized data for tax filing',
      icon: AlertCircle,
      available: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Reports & Documents
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Generate professional reports for various purposes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reports.map((report, idx) => {
          const Icon = report.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl card-hover ${!report.available ? 'opacity-60' : ''}`}
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
              >
                <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {report.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {report.description}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={!report.available}
                  onClick={() => setShowReport(true)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  disabled={!report.available}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showReport && (
        <div
          className="p-8 rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Investor-Ready Financial Summary
            </h3>
            <button onClick={() => setShowReport(false)} className="btn-secondary">
              Close
            </button>
          </div>

          <div
            className="p-8 rounded-xl space-y-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {profile?.business_name}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Financial Health Assessment Report
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Period: {new Date(financialData.data_period_start).toLocaleDateString()} -{' '}
                {new Date(financialData.data_period_end).toLocaleDateString()}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ReportSection title="Business Overview">
                <ReportRow label="Business Name" value={profile?.business_name} />
                <ReportRow label="Industry" value={profile?.industry_type} />
                <ReportRow label="Annual Turnover" value={profile?.annual_turnover_range} />
                <ReportRow label="GST Registered" value={profile?.gst_registered ? 'Yes' : 'No'} />
              </ReportSection>

              <ReportSection title="Financial Metrics">
                <ReportRow label="Total Revenue" value={`₹${formatNumber(financialData.total_revenue)}`} />
                <ReportRow label="Total Expenses" value={`₹${formatNumber(financialData.total_expenses)}`} />
                <ReportRow label="Net Profit" value={`₹${formatNumber(financialData.total_revenue - financialData.total_expenses)}`} />
                <ReportRow
                  label="Profit Margin"
                  value={`${(((financialData.total_revenue - financialData.total_expenses) / financialData.total_revenue) * 100).toFixed(1)}%`}
                />
              </ReportSection>

              <ReportSection title="Working Capital">
                <ReportRow label="Receivables" value={`₹${formatNumber(financialData.receivables)}`} />
                <ReportRow label="Payables" value={`₹${formatNumber(financialData.payables)}`} />
                <ReportRow
                  label="Net Position"
                  value={`₹${formatNumber(financialData.receivables - financialData.payables)}`}
                />
              </ReportSection>

              <ReportSection title="Health Scores">
                <ReportRow label="Financial Health" value={`${financialData.health_score}/100`} />
                <ReportRow label="Credit Readiness" value={`${financialData.credit_score}/100`} />
                <ReportRow
                  label="Overall Rating"
                  value={financialData.health_score >= 70 ? 'Excellent' : financialData.health_score >= 40 ? 'Good' : 'Fair'}
                />
              </ReportSection>
            </div>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Key Highlights
              </h4>
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• Strong revenue generation with consistent cash flow</li>
                <li>• Healthy profit margins compared to industry standards</li>
                <li>• Excellent credit readiness score</li>
                <li>• Well-managed working capital position</li>
                <li>• Compliant with GST and regulatory requirements</li>
              </ul>
            </div>

            <div className="text-center text-sm pt-6" style={{ color: 'var(--text-muted)' }}>
              Generated on {new Date().toLocaleDateString()} | SME FinHealth Platform
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, children }: any) {
  return (
    <div>
      <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReportRow({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function formatNumber(num: number) {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

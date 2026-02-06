import { Shield, AlertTriangle, CheckCircle, FileText, Calendar } from 'lucide-react';

export default function GSTCompliance() {
  const complianceItems = [
    {
      title: 'GST Return Filing (GSTR-3B)',
      status: 'compliant',
      dueDate: '20th of every month',
      lastFiled: '2024-01-20',
      message: 'Last return filed on time',
    },
    {
      title: 'Input Tax Credit (ITC)',
      status: 'warning',
      dueDate: 'Monthly reconciliation',
      lastFiled: '2024-01-15',
      message: 'Potential ITC mismatch detected worth ₹12,450',
    },
    {
      title: 'Invoice Compliance',
      status: 'compliant',
      dueDate: 'Ongoing',
      lastFiled: '2024-02-01',
      message: 'All invoices follow GST format',
    },
    {
      title: 'E-way Bill Generation',
      status: 'compliant',
      dueDate: 'Per shipment',
      lastFiled: '2024-02-01',
      message: 'E-way bills generated for all eligible shipments',
    },
  ];

  const upcomingDeadlines = [
    { task: 'GSTR-1 Filing', date: '2024-02-11', priority: 'high' },
    { task: 'GSTR-3B Filing', date: '2024-02-20', priority: 'medium' },
    { task: 'Annual Return (GSTR-9)', date: '2024-12-31', priority: 'low' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          GST & Compliance
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your GST compliance and regulatory requirements
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--success)', opacity: 0.1 }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            85%
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Overall Compliance Score</p>
        </div>

        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--warning)', opacity: 0.1 }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--warning)' }} />
          </div>
          <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            1
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Issues Requiring Attention</p>
        </div>

        <div
          className="p-6 rounded-2xl card-hover"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
          >
            <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            12
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Returns Filed This Year</p>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl card-hover"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Compliance Status
        </h3>
        <div className="space-y-4">
          {complianceItems.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {item.status === 'compliant' ? (
                    <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  ) : (
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                  )}
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.message}
                    </p>
                    <div className="flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span>Due: {item.dueDate}</span>
                      <span>Last Filed: {item.lastFiled}</span>
                    </div>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: item.status === 'compliant' ? 'var(--success)' : 'var(--warning)',
                    color: 'white',
                  }}
                >
                  {item.status === 'compliant' ? 'Compliant' : 'Attention'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-6 rounded-2xl card-hover"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {upcomingDeadlines.map((deadline, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {deadline.task}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(deadline.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor:
                    deadline.priority === 'high'
                      ? 'var(--error)'
                      : deadline.priority === 'medium'
                      ? 'var(--warning)'
                      : 'var(--accent)',
                  color: 'white',
                  opacity: 0.9,
                }}
              >
                {deadline.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.1, border: '1px solid var(--accent)' }}
      >
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Compliance Recommendation
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Review the ITC mismatch of ₹12,450 before the next filing deadline. Consider reconciling your purchase records with GSTR-2B to claim the correct input tax credit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

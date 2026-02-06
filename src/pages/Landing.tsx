import { TrendingUp, Shield, LineChart, FileText, ArrowRight } from 'lucide-react';

interface LandingProps {
  onLogin: () => void;
  onDemo: () => void;
}

export default function Landing({ onLogin, onDemo }: LandingProps) {
  const features = [
    {
      icon: TrendingUp,
      title: 'Financial Health Analysis',
      description: 'Get instant insights into your business financial performance with AI-powered analysis',
    },
    {
      icon: LineChart,
      title: 'Cash Flow & Risk Insights',
      description: 'Understand your cash flow patterns and identify potential risks before they impact your business',
    },
    {
      icon: Shield,
      title: 'GST & Compliance Awareness',
      description: 'Stay compliant with automated GST checks and regulatory requirement monitoring',
    },
    {
      icon: FileText,
      title: 'Credit & Loan Readiness',
      description: 'Know your credit readiness score and get matched with the right financing options',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <nav className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                SME FinHealth
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={onLogin} className="btn-secondary">
                Login
              </button>
              <button onClick={onDemo} className="btn-primary">
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center animate-fade-in">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Understand Your Business Finances.
            <br />
            <span style={{ color: 'var(--accent)' }}>Make Better Decisions.</span>
          </h1>
          <p
            className="text-xl mb-8 max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            AI-powered financial health assessment platform designed specifically for small and medium enterprises.
            Get actionable insights, compliance checks, and credit readiness in minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={onDemo} className="btn-primary flex items-center gap-2 text-lg">
              Try Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={onLogin} className="btn-secondary text-lg">
              Login
            </button>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl card-hover animate-slide-up"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
              >
                <feature.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <div
            className="inline-block px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              TRUSTED BY 500+ SMEs
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Why SME Owners Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                15min
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Average time to complete analysis
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                85%
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Improved loan approval rates
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                100%
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Data security and privacy
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="border-t mt-20 py-8"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            2024 SME FinHealth. Built for hackathon demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}

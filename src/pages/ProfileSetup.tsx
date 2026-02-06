import { useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    industryType: 'Services',
    annualTurnoverRange: '0-10L',
    gstRegistered: false,
    preferredLanguage: 'English',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        business_name: formData.businessName,
        industry_type: formData.industryType,
        annual_turnover_range: formData.annualTurnoverRange,
        gst_registered: formData.gstRegistered,
        preferred_language: formData.preferredLanguage,
        setup_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      onComplete();
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-2xl animate-scale-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
          >
            <Building2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Tell Us About Your Business
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Help us personalize your financial health assessment
          </p>
        </div>

        <div
          className="p-8 rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Industry Type
              </label>
              <select
                value={formData.industryType}
                onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
              >
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Distribution">Distribution</option>
                <option value="Services">Services</option>
                <option value="Technology">Technology</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Annual Turnover Range
              </label>
              <select
                value={formData.annualTurnoverRange}
                onChange={(e) => setFormData({ ...formData, annualTurnoverRange: e.target.value })}
              >
                <option value="0-10L">0 - 10 Lakhs</option>
                <option value="10L-50L">10 - 50 Lakhs</option>
                <option value="50L-1Cr">50 Lakhs - 1 Crore</option>
                <option value="1Cr-5Cr">1 - 5 Crores</option>
                <option value="5Cr-10Cr">5 - 10 Crores</option>
                <option value="10Cr+">10 Crores+</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gstRegistered}
                  onChange={(e) => setFormData({ ...formData, gstRegistered: e.target.checked })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>My business is GST registered</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Preferred Language
              </label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

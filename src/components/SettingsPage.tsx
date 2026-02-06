import { useState } from 'react';
import { Settings, Moon, Sun, Trash2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage({ profile, onUpdate }: any) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleResetData = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('financial_metrics').delete().eq('user_id', user.id),
        supabase.from('ai_insights').delete().eq('user_id', user.id),
        supabase.from('financial_uploads').delete().eq('user_id', user.id),
      ]);

      alert('All data has been reset successfully');
      setShowDeleteModal(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to reset data');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your account and preferences
        </p>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Business Profile
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Business Name
              </label>
              <input type="text" value={profile?.business_name || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Industry Type
              </label>
              <input type="text" value={profile?.industry_type || ''} disabled />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Annual Turnover Range
              </label>
              <input type="text" value={profile?.annual_turnover_range || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                GST Registration
              </label>
              <input type="text" value={profile?.gst_registered ? 'Registered' : 'Not Registered'} disabled />
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              To update your business profile, please contact support.
            </p>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          {theme === 'light' ? (
            <Sun className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          ) : (
            <Moon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          )}
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Appearance
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Theme Mode
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Currently using {theme} mode
            </p>
          </div>
          <button onClick={toggleTheme} className="btn-primary flex items-center gap-2">
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                Switch to Dark
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                Switch to Light
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-6 h-6" style={{ color: 'var(--error)' }} />
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Data Management
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Reset Financial Data
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              This will delete all your financial data, transactions, insights, and forecasts. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ backgroundColor: 'var(--error)', color: 'white' }}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.1, border: '1px solid var(--accent)' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Demo Environment
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This is a demonstration platform built for hackathon purposes. In a production environment, you would have additional settings for data export, integrations, notifications, and more.
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div
            className="max-w-md w-full p-8 rounded-2xl animate-scale-in"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--error)' }} />
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Confirm Data Reset
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete all your financial data? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                style={{ backgroundColor: 'var(--error)', color: 'white' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Upload, Building2, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DataInputProps {
  onComplete: () => void;
}

interface UploadedFile {
  type: string;
  file: File;
  data: any[] | null;
}

export default function DataInput({ onComplete }: DataInputProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingStatus, setProcessingStatus] = useState('');

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let data: any[] | null = null;

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSV(text);
      }

      setUploadedFiles(prev => {
        const filtered = prev.filter(f => f.type !== type);
        return [...filtered, { type, file, data }];
      });
    }
  };

  const hasUploadedFiles = uploadedFiles.length > 0;

  const handleProcessFiles = async () => {
    if (!user || uploadedFiles.length === 0) return;
    setLoading(true);
    setProcessingStatus('Processing uploaded files...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const allTransactions: any[] = [];
      uploadedFiles.forEach(uf => {
        if (uf.data && Array.isArray(uf.data)) {
          allTransactions.push(...uf.data);
        }
      });

      setProcessingStatus('Sending data to server...');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-financial-upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDemo: allTransactions.length === 0,
          fileType: 'csv',
          fileName: uploadedFiles.map(f => f.file.name).join(', '),
          transactionData: allTransactions.length > 0 ? allTransactions : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process data');
      }

      setProcessingStatus('Computing financial metrics...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStatus('Generating AI insights...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStatus('Complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete();
    } catch (err: any) {
      console.error('Error processing files:', err);
      alert(err.message || 'Failed to process files');
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const handleBankConsent = async () => {
    if (!user) return;
    setShowModal(false);
    setLoading(true);
    setProcessingStatus('Connecting to bank...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingStatus('Processing financial data on server...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-financial-upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDemo: true,
          fileType: 'demo',
          fileName: 'demo-bank-data.json',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process data');
      }

      const result = await response.json();
      console.log('Backend processing result:', result);

      setProcessingStatus('Computing financial metrics...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStatus('Generating AI insights...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStatus('Complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete();
    } catch (err: any) {
      console.error('Error processing data:', err);
      alert(err.message || 'Failed to process data');
      setLoading(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-3xl animate-scale-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.1 }}
          >
            <Upload className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Upload Your Financial Data
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Connect your bank or upload documents for AI-powered analysis
          </p>
        </div>

        <div
          className="p-8 rounded-2xl mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Upload Documents
          </h3>

          <div className="space-y-4">
            <label
              className="block p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--accent)]"
              style={{ borderColor: uploadedFiles.some(f => f.type === 'bank') ? 'var(--success)' : 'var(--border)' }}
            >
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'bank')}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              <div className="flex items-center gap-3">
                {uploadedFiles.some(f => f.type === 'bank') ? (
                  <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--success)' }} />
                ) : (
                  <Upload className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Bank Statement
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    CSV or Excel format
                  </p>
                </div>
              </div>
            </label>

            <label
              className="block p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--accent)]"
              style={{ borderColor: uploadedFiles.some(f => f.type === 'sales') ? 'var(--success)' : 'var(--border)' }}
            >
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'sales')}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              <div className="flex items-center gap-3">
                {uploadedFiles.some(f => f.type === 'sales') ? (
                  <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--success)' }} />
                ) : (
                  <Upload className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Sales & Purchase Data
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    CSV or Excel format
                  </p>
                </div>
              </div>
            </label>
          </div>

          {hasUploadedFiles && !loading && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleProcessFiles}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Process Files & Continue
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                {uploadedFiles.length} file(s) ready to process
              </p>
            </div>
          )}
        </div>

        <div
          className="p-8 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                className="px-4"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                OR
              </span>
            </div>
          </div>

          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Connect Bank Account
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Securely connect your bank for automatic data sync
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Connect Bank (Demo)
          </button>
        </div>

        {loading && (
          <div className="mt-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-center font-semibold" style={{ color: 'var(--text-primary)' }}>
              {processingStatus}
            </p>
            <p className="text-center text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Backend processing in progress...
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div
            className="max-w-lg w-full p-8 rounded-2xl animate-scale-in"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Bank Connection Consent
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6" style={{ color: 'var(--text-secondary)' }}>
              <p>By connecting your bank account, you consent to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Read-only access to your transaction history</li>
                <li>Secure data encryption during transfer</li>
                <li>Server-side processing and analysis</li>
                <li>AI-powered financial insights generation</li>
                <li>No storage of bank credentials</li>
              </ul>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--accent)', opacity: 0.1, border: '1px solid var(--accent)' }}
              >
                <p className="text-sm" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Demo Environment
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  This will generate realistic demo data and process it through our real backend pipeline for demonstration purposes.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleBankConsent} className="btn-primary flex-1">
                I Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

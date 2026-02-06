
import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { api } from '../services/api';
import { ArrowRight, CheckCircle, AlertTriangle, Loader2, Table, AlertCircle, MapPin } from 'lucide-react';

interface UploadPageProps {
    onSuccess: () => void;
}

interface ColumnMapping {
    [column: string]: {
        standard: string;
        confidence: number;
    };
}

interface MappingResult {
    mapping: ColumnMapping;
    unmapped: string[];
    min_confidence: number;
    original_columns: string[];
}

interface ParsedRow {
    [key: string]: any;
}

interface UploadResult {
    message: string;
    upload_id: string;
    rows_parsed: number;
    parsed_data: ParsedRow[];
    metrics: Record<string, number>;
    column_mapping?: MappingResult;
    confidence?: number;
}

const Upload: React.FC<UploadPageProps> = ({ onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<'bank' | 'sales' | 'purchase' | 'inventory' | 'loan'>('bank');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for parsed data display
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [showMappingConfirmation, setShowMappingConfirmation] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        setUploadResult(null);
        setShowMappingConfirmation(false);

        try {
            const res = await api.uploadFile(file, type) as unknown as UploadResult;

            console.log('=== UPLOAD RESPONSE ===');
            console.log('Rows parsed:', res.rows_parsed);
            console.log('Confidence:', res.confidence);
            console.log('Column mapping:', res.column_mapping);
            console.log('Parsed data:', res.parsed_data);
            console.log('Metrics:', res.metrics);

            setUploadResult(res);

            // Check confidence - show confirmation if < 100%
            if (res.confidence !== undefined && res.confidence < 100) {
                setShowMappingConfirmation(true);
                setSuccess(`File parsed with ${res.confidence}% confidence. Please review the column mapping below.`);
            } else {
                setSuccess(`✅ ${res.message} - ${res.rows_parsed} rows parsed with 100% confidence`);
            }

            // Fetch fresh metrics
            try {
                const metrics = await api.getMetrics();
                localStorage.setItem('fin_health_metrics', JSON.stringify(metrics));
            } catch (fetchErr) {
                console.warn('Failed to pre-fetch metrics:', fetchErr);
            }

        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmMapping = () => {
        setShowMappingConfirmation(false);
        setSuccess(`✅ Column mapping confirmed. ${uploadResult?.rows_parsed} rows processed successfully.`);
    };

    const handleContinue = () => {
        onSuccess();
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-10 animate-slide-down">
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Financial Health Assessment</h1>
                <p className="text-lg text-secondary max-w-xl mx-auto">
                    Upload your financial documents to get an instant AI-powered analysis of your business health.
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm animate-fade-in">
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-primary mb-2">1. Select Document Type</label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {(['bank', 'sales', 'purchase', 'inventory', 'loan'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all duration-200
                  ${type === t
                                        ? 'border-accent bg-blue-50/10 text-accent ring-1 ring-accent/50'
                                        : 'border-border text-secondary hover:border-gray-300 hover:bg-secondary/50'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-semibold text-primary mb-2">2. Upload File</label>
                    <FileUploader
                        onFileSelect={setFile}
                        selectedFile={file}
                        onClear={() => { setFile(null); setUploadResult(null); setShowMappingConfirmation(false); }}
                    />
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50/50 border border-red-200 flex items-start gap-3 text-red-700 animate-slide-up">
                        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-medium">Upload Failed</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-slide-up
                        ${showMappingConfirmation
                            ? 'bg-yellow-50/50 border border-yellow-200 text-yellow-800'
                            : 'bg-green-50/50 border border-green-200 text-green-700'}`}>
                        {showMappingConfirmation ? (
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        ) : (
                            <CheckCircle className="shrink-0 mt-0.5" size={18} />
                        )}
                        <p className="text-sm">{success}</p>
                    </div>
                )}

                {/* Column Mapping Confirmation UI */}
                {showMappingConfirmation && uploadResult?.column_mapping && (
                    <div className="mb-8 p-6 bg-yellow-50/30 border border-yellow-200 rounded-xl animate-slide-up">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={20} className="text-yellow-600" />
                            <h3 className="text-lg font-semibold text-primary">
                                Column Mapping Detection ({uploadResult.confidence}% Confidence)
                            </h3>
                        </div>

                        <p className="text-sm text-secondary mb-4">
                            We detected the following column mapping. Please confirm it's correct before proceeding.
                        </p>

                        <div className="bg-white rounded-lg border border-yellow-200 overflow-hidden mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-yellow-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-primary border-b">Your Column</th>
                                        <th className="px-4 py-2 text-left font-semibold text-primary border-b">Detected As</th>
                                        <th className="px-4 py-2 text-center font-semibold text-primary border-b">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(uploadResult.column_mapping.mapping).map(([col, info]) => (
                                        <tr key={col} className="border-b border-gray-100">
                                            <td className="px-4 py-2 font-mono text-secondary">{col}</td>
                                            <td className="px-4 py-2">
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                    {info.standard}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`font-semibold ${info.confidence === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {info.confidence}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {uploadResult.column_mapping.unmapped.length > 0 && (
                            <div className="text-xs text-muted mb-4">
                                <strong>Unmapped columns:</strong> {uploadResult.column_mapping.unmapped.join(', ')}
                            </div>
                        )}

                        <button
                            onClick={handleConfirmMapping}
                            className="w-full py-3 rounded-xl font-bold text-white bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center gap-2 transition-all"
                        >
                            <CheckCircle size={18} />
                            Confirm Mapping & Continue
                        </button>
                    </div>
                )}

                {/* Display Parsed Data */}
                {uploadResult && uploadResult.parsed_data && uploadResult.parsed_data.length > 0 && !showMappingConfirmation && (
                    <div className="mb-8 animate-slide-up">
                        <div className="flex items-center gap-2 mb-4">
                            <Table size={20} className="text-accent" />
                            <h3 className="text-lg font-semibold text-primary">
                                Parsed Data ({uploadResult.rows_parsed} rows)
                            </h3>
                        </div>

                        {/* Metrics Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {Object.entries(uploadResult.metrics).map(([key, value]) => (
                                <div key={key} className="bg-blue-50/50 rounded-lg p-3 text-center">
                                    <div className="text-xs text-secondary capitalize">{key.replace(/_/g, ' ')}</div>
                                    <div className="text-lg font-bold text-primary">
                                        {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Data Table */}
                        <div className="border border-border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto max-h-64">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {Object.keys(uploadResult.parsed_data[0]).map((key) => (
                                                <th key={key} className="px-4 py-2 text-left font-semibold text-primary border-b capitalize">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadResult.parsed_data.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="border-b border-border/50 hover:bg-gray-50/50">
                                                {Object.entries(row).map(([key, val], i) => (
                                                    <td key={i} className="px-4 py-2 text-secondary">
                                                        {key === 'amount' && typeof val === 'number'
                                                            ? `₹${val.toLocaleString()}`
                                                            : val !== null && val !== '' ? String(val) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {uploadResult.parsed_data.length > 10 && (
                                <div className="px-4 py-2 bg-gray-50 text-center text-xs text-muted">
                                    Showing first 10 of {uploadResult.parsed_data.length} rows
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload or Continue Button */}
                {!uploadResult ? (
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
            ${!file || loading
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-accent hover:bg-accent-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                Analyze Financials
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                ) : !showMappingConfirmation && (
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <CheckCircle size={20} />
                        Continue to Dashboard
                        <ArrowRight size={20} />
                    </button>
                )}
            </div>

            <p className="text-center text-xs text-muted mt-8">
                Supported formats: .CSV, .XLSX (Max 10MB) <br />
                Securely processed. No data is shared with third parties.
            </p>
        </div>
    );
};

export default Upload;

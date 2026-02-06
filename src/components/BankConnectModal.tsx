
import React, { useState } from 'react';
import { X, Building, ShieldCheck, Loader2 } from 'lucide-react';

interface BankConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect?: () => void;
}

const BankConnectModal: React.FC<BankConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConnect = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const handleVerify = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 1500);
    };

    const handleFinish = () => {
        setStep(1); // Reset
        if (onConnect) onConnect();
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 animate-scale-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building className="text-blue-600" size={20} />
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Connect Bank</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">

                    {/* Step 1: Consent */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Secure Connection</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    We use the <b>Account Aggregator (AA)</b> framework to securely fetch your financial data. You have full control over consent.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Data Requested:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">Bank Statements (12 Months)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Purpose:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">Financial Health Assessment</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Validity:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">One-time Fetch</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Proceed to Consent"}
                            </button>
                            <p className="text-xs text-center text-slate-400 mt-2 italic">Demo Mode: No real connection made</p>
                        </div>
                    )}

                    {/* Step 2: OTP Simulation */}
                    {step === 2 && (
                        <div className="space-y-6 text-center">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Verifying Identity</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                Simulating bank OTP verification...
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div key={i} className="w-12 h-12 border-2 border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-xl font-bold">
                                        •
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleVerify}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Verify & Connect"}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600 animate-scale-in">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connected!</h4>
                                <p className="text-slate-500">Your bank account has been successfully linked.</p>
                            </div>
                            <button
                                onClick={handleFinish}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
import { CheckCircle2 } from 'lucide-react'; // Ensure import

export default BankConnectModal;

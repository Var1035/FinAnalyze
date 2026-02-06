
import React from 'react';
import { Upload, ArrowRight, Sparkles } from 'lucide-react';

interface GettingStartedProps {
    onUploadClick: () => void;
    onBankConnectClick: () => void;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ onUploadClick, onBankConnectClick }) => {
    return (
        <div className="mb-10 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={20} className="text-amber-500" />
                        <h2 className="text-2xl font-bold text-primary">Getting Started</h2>
                    </div>
                    <p className="text-secondary">Complete these steps to unlock your full financial assessment.</p>
                </div>
                <span className="hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full border border-blue-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Stage 1: Activation
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1: Upload Data - Primary CTA */}
                <div
                    onClick={onUploadClick}
                    className="group relative p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/25 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/30"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4">
                            <Upload size={120} strokeWidth={1} />
                        </div>
                    </div>

                    {/* Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-lg shadow-inner">
                                1
                            </div>
                            <h3 className="font-bold text-xl text-white">Upload Data</h3>
                        </div>
                        <p className="text-sm text-blue-100 mb-6 leading-relaxed">
                            Upload your latest bank statement, sales, or purchase records (CSV/XLSX) to begin analysis.
                        </p>
                        <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                            Start Upload <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Step 2: Add Products - Coming Soon */}
                <div className="relative p-6 bg-card rounded-2xl border border-border cursor-not-allowed opacity-60">
                    <div className="absolute top-4 right-4 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full">
                        COMING SOON
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center font-bold text-lg">
                            2
                        </div>
                        <h3 className="font-bold text-lg text-gray-400">Add Products</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                        List your key products and dealers to map your supply chain network.
                    </p>
                    <div className="h-6"></div>
                </div>

                {/* Step 3: Connect Bank - Demo */}
                <div
                    onClick={onBankConnectClick}
                    className="group relative p-6 bg-card rounded-2xl border-2 border-dashed border-border hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full dark:bg-green-900/40 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        DEMO
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-500 flex items-center justify-center font-bold text-lg group-hover:border-green-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            3
                        </div>
                        <h3 className="font-bold text-lg text-primary">Connect Bank</h3>
                    </div>
                    <p className="text-sm text-secondary mb-6 leading-relaxed">
                        Securely link your primary operating account via Account Aggregator.
                    </p>
                    <div className="flex items-center gap-2 text-secondary font-medium text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        Try Demo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GettingStarted;


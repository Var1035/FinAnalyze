
import React from 'react';
import { X, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    status: 'Positive' | 'Neutral' | 'Negative';
    explanation: string;
    isLoading: boolean;
    error?: string;
    onRetry?: () => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
    isOpen,
    onClose,
    title,
    status,
    explanation,
    isLoading,
    error,
    onRetry
}) => {
    if (!isOpen) return null;

    // Format inline text with bold, italic, and highlights
    const formatInlineText = (text: string): React.ReactNode => {
        // Handle **bold**, *italic*, and `highlighted` text
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
            // Match **bold**
            const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
            // Match *italic*
            const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
            // Match `highlighted` or terms like "₹" amounts
            const highlightMatch = remaining.match(/`([^`]+)`/);
            // Match currency amounts
            const currencyMatch = remaining.match(/(₹[\d,]+(?:\.\d+)?)/);

            // Find earliest match
            const matches = [
                boldMatch && { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) },
                italicMatch && { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) },
                highlightMatch && { type: 'highlight', match: highlightMatch, index: remaining.indexOf(highlightMatch[0]) },
                currencyMatch && { type: 'currency', match: currencyMatch, index: remaining.indexOf(currencyMatch[0]) },
            ].filter(Boolean).sort((a, b) => (a?.index ?? Infinity) - (b?.index ?? Infinity));

            if (matches.length > 0 && matches[0]) {
                const earliest = matches[0];
                const matchIndex = earliest.index;

                // Add text before match
                if (matchIndex > 0) {
                    parts.push(<span key={key++}>{remaining.slice(0, matchIndex)}</span>);
                }

                // Add formatted match
                const matchContent = earliest.match[1];
                switch (earliest.type) {
                    case 'bold':
                        parts.push(<strong key={key++} className="font-bold text-primary">{matchContent}</strong>);
                        remaining = remaining.slice(matchIndex + earliest.match[0].length);
                        break;
                    case 'italic':
                        parts.push(<em key={key++} className="italic text-indigo-600 dark:text-indigo-400">{matchContent}</em>);
                        remaining = remaining.slice(matchIndex + earliest.match[0].length);
                        break;
                    case 'highlight':
                        parts.push(
                            <span key={key++} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded font-medium text-sm">
                                {matchContent}
                            </span>
                        );
                        remaining = remaining.slice(matchIndex + earliest.match[0].length);
                        break;
                    case 'currency':
                        parts.push(
                            <span key={key++} className="font-semibold text-green-600 dark:text-green-400">
                                {earliest.match[0]}
                            </span>
                        );
                        remaining = remaining.slice(matchIndex + earliest.match[0].length);
                        break;
                }
            } else {
                // No more matches, add remaining text
                parts.push(<span key={key++}>{remaining}</span>);
                break;
            }
        }

        return parts.length > 0 ? <>{parts}</> : text;
    };

    const getStatusColor = () => {
        switch (status) {
            case 'Positive': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'Positive': return '✅';
            case 'Negative': return '⚠️';
            default: return '📊';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary">{title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor()}`}>
                                    {getStatusIcon()} {status}
                                </span>
                                <span className="text-xs text-secondary">AI Explanation</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} className="text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                            <p className="text-secondary text-sm">Generating explanation...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <p className="text-secondary text-center mb-4">{error}</p>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="text-secondary leading-relaxed">
                                {explanation.split('\n').map((line, idx) => {
                                    // Format section headers (lines ending with colon or all caps)
                                    if (line.match(/^(#{1,3}\s+|[A-Z\s]{5,}:?$|.+:$)/) && line.length < 60) {
                                        const headerText = line.replace(/^#{1,3}\s*/, '').replace(/:$/, '');
                                        return (
                                            <h4 key={idx} className="font-bold text-primary mt-4 mb-2 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                                                {headerText}
                                            </h4>
                                        );
                                    }
                                    // Format numbered lists
                                    if (line.match(/^\d+[.)]/)) {
                                        const content = line.replace(/^\d+[.)]\s*/, '');
                                        return (
                                            <div key={idx} className="flex gap-3 mb-3 items-start">
                                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                    {line.match(/^(\d+)/)?.[1]}
                                                </span>
                                                <span className="flex-1 text-primary">{formatInlineText(content)}</span>
                                            </div>
                                        );
                                    }
                                    // Format bullet points
                                    if (line.match(/^[-•*]\s/)) {
                                        const content = line.replace(/^[-•*]\s*/, '');
                                        return (
                                            <div key={idx} className="flex gap-3 mb-2 ml-3 items-start">
                                                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mt-2 flex-shrink-0"></span>
                                                <span className="flex-1">{formatInlineText(content)}</span>
                                            </div>
                                        );
                                    }
                                    // Regular paragraphs with inline formatting
                                    if (line.trim()) {
                                        return <p key={idx} className="mb-3 text-[15px] leading-relaxed">{formatInlineText(line)}</p>;
                                    }
                                    return <div key={idx} className="h-2" />;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <Sparkles size={14} />
                            <span>Powered by Mistral AI (with deterministic financial rules)</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExplanationModal;

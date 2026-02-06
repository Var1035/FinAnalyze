import { Language } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

// Types for the explanation request
export interface ExplanationContext {
    section: 'Financial Health' | 'Credit Readiness' | 'Cost Optimization' | 'AI Insights' | 'GST Compliance';
    status: 'Positive' | 'Neutral' | 'Negative';
    industry?: string;
    key_metrics: {
        total_revenue: number;
        total_expenses: number;
        net_profit: number;
        profit_margin: number;
        cash_flow_status: 'positive' | 'negative' | 'neutral';
        receivables_ratio: number;
        payables_ratio: number;
    };
    metric_extensions?: {
        inventory_total?: number;
        inventory_items?: number;
        loan_outstanding?: number;
        loan_emi?: number;
        working_capital_gap?: number;
        risk_level?: string;
    };
    language: Language;
}

export interface ExplanationResponse {
    explanation: string;
    error?: string;
}

// Cache for explanations to avoid repeat API calls
const explanationCache: Map<string, string> = new Map();

function getCacheKey(context: ExplanationContext): string {
    return `${context.section}-${context.status}-${context.language}-${context.industry || 'General'}-${JSON.stringify(context.key_metrics)}-${JSON.stringify(context.metric_extensions || {})}`;
}

// function getLanguageName removed as unused

function getLanguageInstruction(lang: Language): string {
    switch (lang) {
        case 'hi': return 'Respond ONLY in Hindi (हिंदी). Use simple Hindi suitable for small business owners. Do not mix English words.';
        case 'te': return 'Respond ONLY in Telugu (తెలుగు). Use simple Telugu suitable for small business owners. Do not mix English words.';
        default: return 'Respond ONLY in simple business English. Avoid technical jargon.';
    }
}

export async function getAIExplanation(context: ExplanationContext): Promise<ExplanationResponse> {
    // Check cache first
    const cacheKey = getCacheKey(context);
    const cached = explanationCache.get(cacheKey);
    if (cached) {
        return { explanation: cached };
    }

    const languageInstruction = getLanguageInstruction(context.language);
    const industryInfo = context.industry ? `Industry: ${context.industry}` : 'Industry: General Small Business';

    const systemPrompt = `You are a financial explanation assistant for small business owners.
You MUST:
- Explain results clearly
- Use simple business language
- Avoid technical jargon
- Be practical and actionable
- NEVER invent numbers
- NEVER contradict provided metrics
- Context: ${industryInfo}
- ${languageInstruction}`;

    let metricsText = `Metrics:
- Total Revenue: ₹${context.key_metrics.total_revenue.toLocaleString()}
- Total Expenses: ₹${context.key_metrics.total_expenses.toLocaleString()}
- Net Profit: ₹${context.key_metrics.net_profit.toLocaleString()}
- Profit Margin: ${context.key_metrics.profit_margin.toFixed(1)}%
- Cash Flow Status: ${context.key_metrics.cash_flow_status}
- Receivables Ratio: ${context.key_metrics.receivables_ratio.toFixed(1)}%
- Payables Ratio: ${context.key_metrics.payables_ratio.toFixed(1)}%`;

    if (context.metric_extensions) {
        if (context.metric_extensions.inventory_total) {
            metricsText += `\n- Inventory Value: ₹${context.metric_extensions.inventory_total.toLocaleString()}`;
        }
        if (context.metric_extensions.loan_outstanding) {
            metricsText += `\n- Loan Outstanding: ₹${context.metric_extensions.loan_outstanding.toLocaleString()}`;
        }
        if (context.metric_extensions.working_capital_gap) {
            metricsText += `\n- Working Capital Gap: ₹${context.metric_extensions.working_capital_gap.toLocaleString()}`;
        }
    }

    const userPrompt = `Explain the following financial assessment.

Section: ${context.section}
Status: ${context.status}
${industryInfo}

${metricsText}

Tasks:
1. Explain WHY this status occurred (2-3 sentences)
2. Explain WHAT risk or opportunity it creates (2-3 sentences)
3. Give 3 specific, practical improvement actions relevant to ${context.industry || 'any business'}

${languageInstruction}`;

    try {
        // Get Supabase session for auth token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return {
                explanation: '',
                error: context.language === 'hi'
                    ? 'कृपया पहले लॉगिन करें।'
                    : context.language === 'te'
                        ? 'దయచేసి ముందుగా లాగిన్ అవ్వండి.'
                        : 'Please login first.',
            };
        }

        // Call Mistral API via backend proxy
        const response = await fetch('http://127.0.0.1:8000/api/ai/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                system_prompt: systemPrompt,
                user_prompt: userPrompt,
                section: context.section,
                status: context.status,
                metrics: context.key_metrics,
                language: context.language,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.explanation) {
            // Cache the result
            explanationCache.set(cacheKey, data.explanation);
            return { explanation: data.explanation };
        } else {
            throw new Error('No explanation received');
        }
    } catch (error) {
        console.error('AI Explanation error:', error);
        return {
            explanation: '',
            error: context.language === 'hi'
                ? 'AI व्याख्या अस्थायी रूप से उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
                : context.language === 'te'
                    ? 'AI వివరణ తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.'
                    : 'AI explanation temporarily unavailable. Please try again.',
        };
    }
}

// Clear cache when language changes
export function clearExplanationCache(): void {
    explanationCache.clear();
}


import { supabase } from '../lib/supabase';

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface MetricsData {
    total_revenue: number;
    total_expenses: number;
    cash_inflow: number;
    cash_outflow: number;
    total_receivables: number;
    total_payables: number;
    net_profit: number;
    profit_margin: number;
}

export interface UploadResponse {
    message: string;
    metrics: Record<string, number>;
    upload_id: string;
}

export interface UploadHistoryItem {
    id: string;
    filename: string;
    file_type: 'bank' | 'sales' | 'purchase' | 'inventory' | 'loan';
    processing_status: string;
    created_at: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    return {
        'Authorization': `Bearer ${session.access_token}`
    };
}

export const api = {
    healthCheck: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/`);
            if (!res.ok) throw new Error('Backend not reachable');
            return await res.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    },

    uploadFile: async (file: File, type: 'bank' | 'sales' | 'purchase' | 'inventory' | 'loan'): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const headers = await getAuthHeaders();

        const res = await fetch(`${API_BASE_URL}/upload/financials`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(err.detail || 'Upload failed');
        }

        return await res.json();
    },

    getMetrics: async (): Promise<MetricsData> => {
        const headers = await getAuthHeaders();

        const res = await fetch(`${API_BASE_URL}/metrics/overview`, {
            cache: 'no-store',
            headers
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Failed to fetch metrics' }));
            throw new Error(err.detail || 'Failed to fetch metrics');
        }

        return await res.json();
    },

    getUploadHistory: async (): Promise<UploadHistoryItem[]> => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            return [];
        }

        const { data, error } = await supabase
            .from('financial_uploads')
            .select('id, filename, file_type, processing_status, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Failed to fetch upload history:', error);
            return [];
        }

        return data || [];
    }
};


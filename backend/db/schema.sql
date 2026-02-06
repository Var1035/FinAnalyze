CREATE TABLE IF NOT EXISTS financial_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    upload_type TEXT NOT NULL, -- 'bank', 'sales', 'purchase'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES financial_uploads(id),
    
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    total_expenses NUMERIC(15, 2) DEFAULT 0,
    
    cash_inflow NUMERIC(15, 2) DEFAULT 0,
    cash_outflow NUMERIC(15, 2) DEFAULT 0,
    
    total_receivables NUMERIC(15, 2) DEFAULT 0,
    total_payables NUMERIC(15, 2) DEFAULT 0,
    
    net_profit NUMERIC(15, 2) DEFAULT 0,
    profit_margin NUMERIC(5, 2) DEFAULT 0, -- Percentage
    
    period_start DATE,
    period_end DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
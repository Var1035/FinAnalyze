-- Add parsed_data column to financial_uploads table
ALTER TABLE financial_uploads 
ADD COLUMN IF NOT EXISTS parsed_data JSONB,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add user_id to financial_metrics for proper filtering
ALTER TABLE financial_metrics
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_financial_uploads_user_id ON financial_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_user_id ON financial_metrics(user_id);

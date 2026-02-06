/*
  # Production Financial Platform Schema

  ## Overview
  Complete schema for production-grade financial processing system with real backend processing.

  ## New Tables

  ### 1. `financial_uploads`
  Stores uploaded financial files and their parsed data.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `file_type` (text) - Type: bank, sales, purchase, gst
  - `original_filename` (text) - Original file name
  - `parsed_data` (jsonb) - Parsed transaction data
  - `file_size` (integer) - File size in bytes
  - `processing_status` (text) - Status: pending, processing, completed, failed
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz) - Upload timestamp
  - `processed_at` (timestamptz) - Processing completion timestamp

  ### 2. `financial_metrics`
  Stores computed financial metrics (server-side calculations only).
  - `user_id` (uuid, primary key) - References profiles
  - `total_revenue` (numeric) - Total revenue
  - `total_expenses` (numeric) - Total expenses
  - `cash_inflow` (numeric) - Total cash inflow
  - `cash_outflow` (numeric) - Total cash outflow
  - `receivables` (numeric) - Outstanding receivables
  - `payables` (numeric) - Outstanding payables
  - `loan_obligations` (numeric) - Total loan obligations
  - `profit_margin` (numeric) - Profit margin percentage
  - `health_score` (numeric) - Financial health score (0-100)
  - `credit_score` (numeric) - Credit readiness score (0-100)
  - `data_period_start` (date) - Data period start
  - `data_period_end` (date) - Data period end
  - `transaction_count` (integer) - Number of transactions
  - `updated_at` (timestamptz) - Last update timestamp
  - `computed_at` (timestamptz) - Computation timestamp

  ### 3. `ai_insights` (rename from insights)
  Stores AI-generated insights from LLM.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `insight_text` (text) - AI-generated insight
  - `insight_type` (text) - Type of insight
  - `severity` (text) - Severity level
  - `title` (text) - Insight title
  - `llm_model` (text) - LLM model used
  - `created_at` (timestamptz) - Generation timestamp

  ## Security
  - Enable Row Level Security on all tables
  - Users can only access their own data
  - Strict RLS policies
*/

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS financial_uploads CASCADE;
DROP TABLE IF EXISTS financial_metrics CASCADE;

-- Rename insights to ai_insights
ALTER TABLE IF EXISTS insights RENAME TO ai_insights;

-- Add new columns to ai_insights if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_insights' AND column_name = 'llm_model'
  ) THEN
    ALTER TABLE ai_insights ADD COLUMN llm_model text DEFAULT 'mistral-small-latest';
  END IF;
END $$;

-- Create financial_uploads table
CREATE TABLE financial_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('bank', 'sales', 'purchase', 'gst', 'demo')),
  original_filename text NOT NULL,
  parsed_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_size integer NOT NULL DEFAULT 0,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create financial_metrics table
CREATE TABLE financial_metrics (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  cash_inflow numeric NOT NULL DEFAULT 0,
  cash_outflow numeric NOT NULL DEFAULT 0,
  receivables numeric NOT NULL DEFAULT 0,
  payables numeric NOT NULL DEFAULT 0,
  loan_obligations numeric NOT NULL DEFAULT 0,
  profit_margin numeric NOT NULL DEFAULT 0,
  health_score numeric NOT NULL DEFAULT 0,
  credit_score numeric NOT NULL DEFAULT 0,
  data_period_start date NOT NULL,
  data_period_end date NOT NULL,
  transaction_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  computed_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE financial_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;

-- Financial uploads policies
CREATE POLICY "Users can view own uploads"
  ON financial_uploads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own uploads"
  ON financial_uploads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own uploads"
  ON financial_uploads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own uploads"
  ON financial_uploads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Financial metrics policies
CREATE POLICY "Users can view own metrics"
  ON financial_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own metrics"
  ON financial_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own metrics"
  ON financial_metrics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_uploads_user_id ON financial_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_uploads_status ON financial_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);

-- Drop old tables that are no longer needed
DROP TABLE IF EXISTS financial_data CASCADE;
DROP TABLE IF EXISTS forecasts CASCADE;

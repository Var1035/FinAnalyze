/*
  # SME Financial Platform Database Schema

  ## Overview
  This migration creates the complete database schema for the AI-powered Financial Health Assessment Platform for SMEs.

  ## New Tables

  ### 1. `profiles`
  Stores business profile information for authenticated users.
  - `id` (uuid, primary key) - References auth.users
  - `business_name` (text) - Name of the business
  - `industry_type` (text) - Industry category
  - `annual_turnover_range` (text) - Revenue range bracket
  - `gst_registered` (boolean) - GST registration status
  - `preferred_language` (text) - User language preference
  - `setup_completed` (boolean) - Profile setup completion status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. `financial_data`
  Stores uploaded financial data and processed metrics.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `total_revenue` (numeric) - Total revenue amount
  - `total_expenses` (numeric) - Total expenses amount
  - `outstanding_receivables` (numeric) - Pending receivables
  - `outstanding_payables` (numeric) - Pending payables
  - `financial_health_score` (integer) - Health score (0-100)
  - `credit_readiness_score` (integer) - Credit score (0-100)
  - `data_period_start` (date) - Data period start date
  - `data_period_end` (date) - Data period end date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. `transactions`
  Stores individual financial transactions (from bank statements or uploads).
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `transaction_date` (date) - Transaction date
  - `description` (text) - Transaction description
  - `amount` (numeric) - Transaction amount
  - `type` (text) - Transaction type (credit/debit)
  - `category` (text) - Transaction category
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `insights`
  Stores AI-generated insights and recommendations.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `insight_type` (text) - Type of insight
  - `title` (text) - Insight title
  - `description` (text) - Detailed description
  - `severity` (text) - Importance level
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `forecasts`
  Stores financial forecasting data.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `forecast_month` (date) - Forecasted month
  - `projected_revenue` (numeric) - Projected revenue
  - `projected_expenses` (numeric) - Projected expenses
  - `projected_cash_flow` (numeric) - Projected cash flow
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Users can only access their own data
  - Authenticated users can insert, select, update, and delete their own records
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  business_name text NOT NULL,
  industry_type text NOT NULL DEFAULT 'Services',
  annual_turnover_range text NOT NULL DEFAULT '0-10L',
  gst_registered boolean NOT NULL DEFAULT false,
  preferred_language text NOT NULL DEFAULT 'English',
  setup_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_data table
CREATE TABLE IF NOT EXISTS financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  outstanding_receivables numeric NOT NULL DEFAULT 0,
  outstanding_payables numeric NOT NULL DEFAULT 0,
  financial_health_score integer NOT NULL DEFAULT 0,
  credit_readiness_score integer NOT NULL DEFAULT 0,
  data_period_start date NOT NULL,
  data_period_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  category text NOT NULL DEFAULT 'Other',
  created_at timestamptz DEFAULT now()
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  forecast_month date NOT NULL,
  projected_revenue numeric NOT NULL DEFAULT 0,
  projected_expenses numeric NOT NULL DEFAULT 0,
  projected_cash_flow numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Financial data policies
CREATE POLICY "Users can view own financial data"
  ON financial_data FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own financial data"
  ON financial_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own financial data"
  ON financial_data FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own financial data"
  ON financial_data FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Insights policies
CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Forecasts policies
CREATE POLICY "Users can view own forecasts"
  ON forecasts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own forecasts"
  ON forecasts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own forecasts"
  ON forecasts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_data_user_id ON financial_data(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_id ON forecasts(user_id);

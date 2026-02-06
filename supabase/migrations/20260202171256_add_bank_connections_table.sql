/*
  # Add Bank Connections Table

  ## Overview
  This migration adds a table to track bank account connections for users.

  ## New Tables

  ### `bank_connections`
  Stores bank connection status and metadata for users.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `bank_name` (text) - Name of connected bank
  - `account_number_masked` (text) - Masked account number (last 4 digits)
  - `connection_status` (text) - Status: connected, disconnected
  - `connected_at` (timestamptz) - Connection timestamp
  - `last_synced_at` (timestamptz) - Last data sync timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable Row Level Security (RLS)
  - Users can only access their own bank connections
*/

-- Create bank_connections table
CREATE TABLE IF NOT EXISTS bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bank_name text NOT NULL DEFAULT 'Demo Bank',
  account_number_masked text NOT NULL DEFAULT 'XXXX-XXXX-1234',
  connection_status text NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected')),
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Bank connections policies
CREATE POLICY "Users can view own bank connections"
  ON bank_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bank connections"
  ON bank_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bank connections"
  ON bank_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bank connections"
  ON bank_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);

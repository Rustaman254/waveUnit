/*
  # WaveUnits Hedera Platform Schema

  ## Overview
  Complete database schema for fractional poultry investment platform with Hedera blockchain integration.

  ## 1. New Tables

  ### `profiles`
  Extended user profile information beyond Supabase auth
  - `id` (uuid, FK to auth.users) - User identifier
  - `hedera_account_id` (text) - Connected Hedera wallet account
  - `full_name` (text) - User's full legal name
  - `phone_number` (text) - Contact phone number
  - `kyc_status` (text) - KYC verification status: pending, approved, rejected
  - `kyc_submitted_at` (timestamptz) - When KYC was submitted
  - `kyc_approved_at` (timestamptz) - When KYC was approved
  - `id_number` (text) - Government ID number
  - `address` (text) - Physical address
  - `proof_of_id_url` (text) - URL to uploaded ID document
  - `total_invested_ksh` (decimal) - Lifetime investment amount
  - `total_shares` (decimal) - Total hen shares owned
  - `created_at` (timestamptz) - Account creation timestamp

  ### `investments`
  Record of all investment transactions
  - `id` (uuid, PK) - Investment record identifier
  - `user_id` (uuid, FK to profiles) - Investor reference
  - `amount_ksh` (decimal) - Investment amount in Kenya Shillings
  - `base_shares` (decimal) - Base shares purchased (amount ÷ hen price)
  - `bonus_shares` (decimal) - 5% bonus shares awarded
  - `total_shares` (decimal) - Total shares issued (base + bonus)
  - `payment_method` (text) - Payment type: mpesa, hbar
  - `transaction_id` (text) - Hedera transaction ID or M-Pesa ref
  - `locked_until` (timestamptz) - 3-day lock expiration date
  - `status` (text) - Transaction status: pending, completed, failed
  - `created_at` (timestamptz) - Investment timestamp

  ### `profit_distributions`
  Daily profit payout records
  - `id` (uuid, PK) - Distribution record identifier
  - `user_id` (uuid, FK to profiles) - Recipient reference
  - `amount_ksh` (decimal) - Profit amount distributed
  - `shares_at_distribution` (decimal) - User's shares when profit calculated
  - `tier` (text) - Profit tier applied: starter, bronze, silver, gold
  - `daily_rate` (decimal) - Daily percentage rate applied
  - `transaction_id` (text) - Hedera transaction ID for token transfer
  - `distributed_at` (timestamptz) - Distribution timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ### `withdrawals`
  Withdrawal request records
  - `id` (uuid, PK) - Withdrawal record identifier
  - `user_id` (uuid, FK to profiles) - User requesting withdrawal
  - `amount_ksh` (decimal) - Withdrawal amount requested
  - `shares_burned` (decimal) - Hen shares converted/burned
  - `method` (text) - Withdrawal method: mpesa, hbar, hens_token
  - `destination` (text) - Phone number or Hedera account
  - `status` (text) - Processing status: pending, processing, completed, failed
  - `transaction_id` (text) - Hedera transaction ID or M-Pesa ref
  - `processed_at` (timestamptz) - When withdrawal was completed
  - `created_at` (timestamptz) - Request timestamp

  ### `platform_settings`
  Configurable platform parameters
  - `id` (uuid, PK) - Settings record identifier
  - `hen_price_ksh` (decimal) - Current price per hen share
  - `total_hens` (integer) - Total hens on farm
  - `daily_egg_production` (integer) - Average daily eggs produced
  - `tier_rates` (jsonb) - Profit tier configuration
  - `ksh_to_hbar_rate` (decimal) - Conversion rate
  - `hens_token_id` (text) - Hedera HENS token ID
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ### `transparency_reports`
  Weekly farm operation reports
  - `id` (uuid, PK) - Report identifier
  - `week_start_date` (date) - Start of reporting week
  - `total_hens` (integer) - Hen count for the week
  - `eggs_produced` (integer) - Total eggs produced
  - `revenue_ksh` (decimal) - Revenue generated
  - `operating_costs_ksh` (decimal) - Operating costs
  - `feed_cost_ksh` (decimal) - Feed expenses
  - `labor_cost_ksh` (decimal) - Labor expenses
  - `other_costs_ksh` (decimal) - Other operational costs
  - `net_profit_ksh` (decimal) - Net profit for the week
  - `photos` (jsonb) - Array of farm photo URLs
  - `notes` (text) - Additional notes or updates
  - `published_at` (timestamptz) - When report was published
  - `created_at` (timestamptz) - Report creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only view/update their own records
  - Admin role required for platform settings and KYC approval
  - Public read access for transparency reports and platform stats
  - Authenticated users can read their own investment and profit history

  ## 3. Indexes
  - Index on hedera_account_id for wallet lookups
  - Index on kyc_status for admin filtering
  - Composite indexes for user transaction queries
  - Index on distributed_at for profit distribution queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hedera_account_id text,
  full_name text,
  phone_number text,
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  id_number text,
  address text,
  proof_of_id_url text,
  total_invested_ksh decimal(15, 2) DEFAULT 0,
  total_shares decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_ksh decimal(15, 2) NOT NULL,
  base_shares decimal(10, 2) NOT NULL,
  bonus_shares decimal(10, 2) NOT NULL,
  total_shares decimal(10, 2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('mpesa', 'hbar')),
  transaction_id text,
  locked_until timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create profit_distributions table
CREATE TABLE IF NOT EXISTS profit_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_ksh decimal(15, 2) NOT NULL,
  shares_at_distribution decimal(10, 2) NOT NULL,
  tier text NOT NULL CHECK (tier IN ('starter', 'bronze', 'silver', 'gold')),
  daily_rate decimal(5, 4) NOT NULL,
  transaction_id text,
  distributed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_ksh decimal(15, 2) NOT NULL,
  shares_burned decimal(10, 2),
  method text NOT NULL CHECK (method IN ('mpesa', 'hbar', 'hens_token')),
  destination text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_id text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hen_price_ksh decimal(10, 2) DEFAULT 700,
  total_hens integer DEFAULT 0,
  daily_egg_production integer DEFAULT 0,
  tier_rates jsonb DEFAULT '{"starter": 0.001, "bronze": 0.0015, "silver": 0.002, "gold": 0.0025}'::jsonb,
  ksh_to_hbar_rate decimal(10, 6) DEFAULT 0.01,
  hens_token_id text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create transparency_reports table
CREATE TABLE IF NOT EXISTS transparency_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL UNIQUE,
  total_hens integer NOT NULL,
  eggs_produced integer NOT NULL,
  revenue_ksh decimal(15, 2) NOT NULL,
  operating_costs_ksh decimal(15, 2) NOT NULL,
  feed_cost_ksh decimal(15, 2) DEFAULT 0,
  labor_cost_ksh decimal(15, 2) DEFAULT 0,
  other_costs_ksh decimal(15, 2) DEFAULT 0,
  net_profit_ksh decimal(15, 2) NOT NULL,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_hedera_account ON profiles(hedera_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_user_id ON profit_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_distributed_at ON profit_distributions(distributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Investments policies
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Profit distributions policies
CREATE POLICY "Users can view own profit distributions"
  ON profit_distributions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Platform settings policies (public read)
CREATE POLICY "Anyone can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Transparency reports policies (public read)
CREATE POLICY "Anyone can view transparency reports"
  ON transparency_reports FOR SELECT
  TO authenticated
  USING (true);

-- Insert default platform settings
INSERT INTO platform_settings (hen_price_ksh, total_hens, daily_egg_production)
VALUES (700, 500, 450)
ON CONFLICT DO NOTHING;
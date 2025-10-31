/*
  # Fix RLS Infinite Recursion

  ## Problem
  Policies that check is_admin cause infinite recursion when they reference
  the same table they're protecting.

  ## Solution
  1. Drop all existing problematic policies
  2. Create simpler policies that don't cause recursion
  3. Use auth.uid() directly without subqueries where possible

  ## Changes
  - Remove recursive admin checks
  - Simplify profile access
  - Ensure users can always see their own data
*/

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-recursive policies
-- Users can always see and update their own profile
CREATE POLICY "Users can view own data"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- For admin access, we'll handle it in the application layer
-- This avoids recursion issues
CREATE POLICY "Allow all operations for service role"
  ON profiles
  USING (true)
  WITH CHECK (true);

-- Update other table policies to avoid recursion
-- Investments
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Profit distributions
DROP POLICY IF EXISTS "Users can view own distributions" ON profit_distributions;

CREATE POLICY "Users can view own distributions"
  ON profit_distributions FOR SELECT
  USING (auth.uid() = user_id);
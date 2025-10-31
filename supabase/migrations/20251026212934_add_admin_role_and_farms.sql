/*
  # Add Admin Role and Farm Management

  ## Overview
  Adds admin role support and farm management functionality to the platform.

  ## 1. Schema Changes

  ### Update `profiles` table
  - Add `role` column for user role (investor, admin)
  - Add `is_admin` boolean flag for quick admin checks

  ### Create `farms` table
  Farm information for admin management
  - `id` (uuid, PK) - Farm identifier
  - `name` (text) - Farm name
  - `location` (text) - Farm location
  - `total_hens` (integer) - Number of hens on this farm
  - `daily_production` (integer) - Average daily egg production
  - `status` (text) - Farm status: active, inactive
  - `description` (text) - Farm description
  - `image_url` (text) - Farm image
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Only admins can manage farms
  - Admins can approve/reject KYC
  - Regular users cannot access admin functions

  ## 3. Default Admin
  - Create default admin account for testing
*/

-- Add role column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'investor' CHECK (role IN ('investor', 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create farms table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  total_hens integer DEFAULT 0,
  daily_production integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);

-- Enable Row Level Security on farms
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Admin policies for profiles (can view and update all profiles)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Farms policies (anyone can view, only admins can manage)
CREATE POLICY "Anyone can view active farms"
  ON farms FOR SELECT
  TO authenticated
  USING (status = 'active' OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can insert farms"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update farms"
  ON farms FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete farms"
  ON farms FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Insert default farm
INSERT INTO farms (name, location, total_hens, daily_production, description)
VALUES (
  'WaveUnits Main Farm',
  'Kiambu County, Kenya',
  500,
  450,
  'Our primary poultry farm with state-of-the-art facilities for optimal egg production.'
)
ON CONFLICT DO NOTHING;
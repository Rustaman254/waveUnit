/*
  # Create Default Admin Account

  ## Overview
  Creates a default admin account for immediate platform access.

  ## Changes
  1. Creates admin user in auth.users
  2. Creates corresponding profile with admin privileges

  ## Default Admin Credentials
  - Email: admin@waveunits.co.ke
  - Password: WaveUnits2025!
  - Full Name: Platform Administrator

  ## Security Notes
  - Change password after first login
  - This is a development/testing account
*/

-- Insert admin user into auth.users if not exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@waveunits.co.ke';
  
  IF admin_user_id IS NULL THEN
    -- Create admin user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@waveunits.co.ke',
      crypt('WaveUnits2025!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    ) RETURNING id INTO admin_user_id;

    -- Create admin profile
    INSERT INTO profiles (
      id,
      full_name,
      is_admin,
      role,
      kyc_status,
      total_invested_ksh,
      total_shares,
      created_at
    ) VALUES (
      admin_user_id,
      'Platform Administrator',
      true,
      'admin',
      'approved',
      0,
      0,
      now()
    );
  END IF;
END $$;

-- Update RLS policies to ensure admins can see ALL profiles including pending KYC
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    OR id = auth.uid()
  );
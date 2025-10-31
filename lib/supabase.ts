import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  hedera_account_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_submitted_at: string | null;
  kyc_approved_at: string | null;
  id_number: string | null;
  address: string | null;
  proof_of_id_url: string | null;
  total_invested_ksh: number;
  total_shares: number;
  role: 'investor' | 'admin';
  is_admin: boolean;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  amount_ksh: number;
  base_shares: number;
  bonus_shares: number;
  total_shares: number;
  payment_method: 'mpesa' | 'hbar';
  transaction_id: string | null;
  locked_until: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type ProfitDistribution = {
  id: string;
  user_id: string;
  amount_ksh: number;
  shares_at_distribution: number;
  tier: 'starter' | 'bronze' | 'silver' | 'gold';
  daily_rate: number;
  transaction_id: string | null;
  distributed_at: string;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount_ksh: number;
  shares_burned: number | null;
  method: 'mpesa' | 'hbar' | 'hens_token';
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_id: string | null;
  processed_at: string | null;
  created_at: string;
};

export type PlatformSettings = {
  id: string;
  hen_price_ksh: number;
  total_hens: number;
  daily_egg_production: number;
  tier_rates: {
    starter: number;
    bronze: number;
    silver: number;
    gold: number;
  };
  ksh_to_hbar_rate: number;
  hens_token_id: string | null;
  updated_at: string;
  created_at: string;
};

export type TransparencyReport = {
  id: string;
  week_start_date: string;
  total_hens: number;
  eggs_produced: number;
  revenue_ksh: number;
  operating_costs_ksh: number;
  feed_cost_ksh: number;
  labor_cost_ksh: number;
  other_costs_ksh: number;
  net_profit_ksh: number;
  photos: string[];
  notes: string | null;
  published_at: string;
  created_at: string;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  total_hens: number;
  daily_production: number;
  status: 'active' | 'inactive';
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

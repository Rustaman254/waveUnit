// lib/types.ts
export interface Profile {
  id: string;
  email?: string | null;
  kyc_status: 'pending' | 'approved' | 'rejected';
  total_invested_ksh: number;
  total_shares: number;
  hedera_account_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Add other fields as needed
}

export interface Investment {
  id: string;
  user_id: string;
  amount_ksh: number;
  base_shares: number;
  bonus_shares: number;
  total_shares: number;
  payment_method: 'hbar' | 'mpesa'; // Add more as needed
  locked_until: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string | null;
  created_at: string;
}

export interface Tier {
  name: string;
  rate: number;
}
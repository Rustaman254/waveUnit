'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, ArrowUpRight, Sparkles, Target } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';

export default function ModernDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="h-16 w-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pb-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-emerald-500/10 to-teal-500/10" />
        <div className="relative px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile.full_name || 'Investor'}</h1>
            <p className="text-gray-600 text-lg mb-8">Here's your portfolio performance</p>

            {profile.kyc_status !== 'approved' && (
              <Card className="glass border-yellow-200 bg-yellow-50/50 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Target className="h-6 w-6 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-1">Complete Your KYC</h3>
                    <p className="text-yellow-800 text-sm mb-3">Verify your identity to start investing</p>
                    <Link href="/dashboard/kyc">
                      <Button variant="outline" className="border-yellow-600 text-yellow-700">
                        Complete Verification <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="gradient-card p-6 modern-shadow-lg border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-2xl">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">Portfolio</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Invested</p>
                  <h3 className="text-3xl font-bold">KSh {profile.total_invested_ksh.toLocaleString()}</h3>
                </div>
              </Card>

              <Card className="gradient-card p-6 modern-shadow-lg border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-2xl">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">HENS</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hen Shares</p>
                  <h3 className="text-3xl font-bold">{profile.total_shares.toFixed(2)}</h3>
                </div>
              </Card>

              <Card className="gradient-card p-6 modern-shadow-lg border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-2xl">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Earnings</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                  <h3 className="text-3xl font-bold">KSh 0.00</h3>
                </div>
              </Card>

              <Card className="gradient-card p-6 modern-shadow-lg border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-2xl">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">Today</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today's Profit</p>
                  <h3 className="text-3xl font-bold">KSh 0.00</h3>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <Card className="glass modern-shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/invest">
              <Button variant="outline" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" /> Invest
              </Button>
            </Link>
            <Link href="/dashboard/wallet">
              <Button variant="outline" className="w-full">
                <Wallet className="h-4 w-4 mr-2" /> Wallet
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Wallet, AlertCircle, ArrowRight, Egg, Calendar, ExternalLink, Coins } from 'lucide-react';
import { supabase, type Profile, type Investment, type ProfitDistribution } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        if (profileData.kyc_status !== 'approved') {
          router.push('/dashboard/kyc');
          return;
        }
      }

      const { data: investmentsData } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setInvestments(investmentsData || []);

      const { data: profitsData } = await supabase
        .from('profit_distributions')
        .select('*')
        .eq('user_id', user.id)
        .order('distributed_at', { ascending: false })
        .limit(10);

      setProfitHistory(profitsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Egg className="h-12 w-12 text-green-600 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const getTier = (amount: number) => {
    if (amount <= 1000) return { name: 'Starter', rate: 0.1, color: 'bg-slate-500', next: 1000 };
    if (amount <= 5000) return { name: 'Bronze', rate: 0.15, color: 'bg-orange-600', next: 5000 };
    if (amount <= 20000) return { name: 'Silver', rate: 0.2, color: 'bg-slate-400', next: 20000 };
    return { name: 'Gold', rate: 0.25, color: 'bg-yellow-500', next: null };
  };

  const currentTier = getTier(profile.total_invested_ksh);
  const dailyProfit = profile.total_invested_ksh * (currentTier.rate / 100);
  const totalEarnings = profitHistory.reduce((sum, p) => sum + Number(p.amount_ksh), 0);
  const todayEarnings = profitHistory
    .filter(p => new Date(p.distributed_at).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + Number(p.amount_ksh), 0);

  const tierProgress = currentTier.next
    ? (profile.total_invested_ksh / currentTier.next) * 100
    : 100;

  // Check if any investment has transaction or mint hash
  const hasAnyTxHash = investments.some(i => !!i.transaction_id);
  const hasAnyMintHash = investments.some(i => !!i.token_mint_tx);

  // Helper to shorten hash
  const shortenHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Here&apos;s your investment overview</p>
        </div>
        {profile.kyc_status === 'approved' ? (
          <Link href="/dashboard/invest">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              Make Investment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button disabled className="bg-gray-400">
            Complete KYC to Invest
          </Button>
        )}
      </div>

      {profile.kyc_status !== 'approved' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Action Required: KYC Verification</CardTitle>
            </div>
            <CardDescription>
              Complete your KYC verification to start investing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/kyc">
              <Button variant="outline">Complete KYC</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {profile.total_invested_ksh.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.total_shares.toFixed(2)} hen shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KUKU Tokens</CardTitle>
            <Coins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profile.total_shares.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1 KUKU = 1 hen share
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime profits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Profit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {todayEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected: KSh {dailyProfit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier Progress</CardTitle>
          <CardDescription>
            {currentTier.next
              ? `Invest KSh ${(currentTier.next - profile.total_invested_ksh).toLocaleString()} more to reach the next tier`
              : 'You are at the highest tier!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{currentTier.name}</span>
              {currentTier.next && (
                <span className="text-muted-foreground">
                  {Math.min(tierProgress, 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300"
                style={{ width: `${Math.min(tierProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="text-center">
              <div className="text-xs font-medium mb-1">Starter</div>
              <Badge variant={profile.total_invested_ksh >= 0 ? 'default' : 'outline'} className="text-xs">
                0.1%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium mb-1">Bronze</div>
              <Badge variant={profile.total_invested_ksh > 1000 ? 'default' : 'outline'} className="text-xs">
                0.15%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium mb-1">Silver</div>
              <Badge variant={profile.total_invested_ksh > 5000 ? 'default' : 'outline'} className="text-xs">
                0.2%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium mb-1">Gold</div>
              <Badge variant={profile.total_invested_ksh > 20000 ? 'default' : 'outline'} className="text-xs">
                0.25%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Investments</CardTitle>
            <CardDescription>Your latest hen share purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {investments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No investments yet</p>
                <Link href="/dashboard/invest">
                  <Button variant="link" className="text-green-600">
                    Make your first investment
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>KUKU</TableHead>
                    <TableHead>Status</TableHead>
                    {hasAnyTxHash && <TableHead className="text-right">HBAR Tx</TableHead>}
                    {hasAnyMintHash && <TableHead className="text-right">Mint Tx</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.slice(0, 5).map((investment: any) => {
                    const hasTx = !!investment.transaction_id;
                    const hasMint = !!investment.token_mint_tx;
                    return (
                      <TableRow key={investment.id}>
                        <TableCell className="text-sm">
                          {format(new Date(investment.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          KSh {Number(investment.amount_ksh).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-green-600">
                          {Number(investment.total_shares).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={investment.status === 'completed' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                        </TableCell>
                        {hasAnyTxHash && hasTx && (
                          <TableCell className="text-right font-mono text-xs">
                            <a
                              href={`https://hashscan.io/testnet/transaction/${investment.transaction_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline truncate max-w-[100px]"
                              title={investment.transaction_id}
                            >
                              {shortenHash(investment.transaction_id)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        )}
                        {hasAnyMintHash && hasMint && (
                          <TableCell className="text-right font-mono text-xs">
                            <a
                              href={`https://hashscan.io/testnet/transaction/${investment.token_mint_tx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:underline truncate max-w-[100px]"
                              title={investment.token_mint_tx}
                            >
                              {shortenHash(investment.token_mint_tx)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Profit History */}
        <Card>
          <CardHeader>
            <CardTitle>Profit History</CardTitle>
            <CardDescription>Your daily earnings from egg sales</CardDescription>
          </CardHeader>
          <CardContent>
            {profitHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No profits distributed yet</p>
                <p className="text-sm mt-2">
                  Profits are distributed daily based on your shares
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitHistory.map((profit) => (
                    <TableRow key={profit.id}>
                      <TableCell className="text-sm">
                        {format(new Date(profit.distributed_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        KSh {Number(profit.amount_ksh).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {profit.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(Number(profit.daily_rate) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Calculator,
  Wallet,
  ArrowRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  Coins,
  Shield,
  Zap,
} from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { BrowserProvider, Contract, parseUnits, type TransactionReceipt, type AddressLike } from 'ethers';

/* --------------------------------------------------------------- */
/* 1. CONSTANTS (ALL IN-FILE)                                       */
/* --------------------------------------------------------------- */
const PLATFORM_HEDERA_ACCOUNT = '0x14fd864df57acda04a3d5a47c463227c9b189869' as const;
const KUKU_TOKEN_ADDRESS = '0x00000000000000000000000000000000006d6b95' as const;

const KUKU_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/* --------------------------------------------------------------- */
/* 2. FETCH HBAR RATE                                               */
/* --------------------------------------------------------------- */
async function fetchHbarToKshRate(): Promise<number> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=HBAR');
    const data = await res.json();
    const rate = Number(data?.data?.rates?.KES);
    return isNaN(rate) || rate <= 0 ? 45 : rate;
  } catch {
    toast.error('Using fallback rate: KSh 45/HBAR');
    return 45;
  }
}

/* --------------------------------------------------------------- */
/* 3. MAIN PAGE                                                     */
/* --------------------------------------------------------------- */
export default function InvestPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kshAmount, setKshAmount] = useState('');
  const [hbarRate, setHbarRate] = useState<number | null>(null);
  const [hbarNeeded, setHbarNeeded] = useState(0);
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(null);

  /* Load Profile */
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/auth/login');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) return toast.error('Failed to load profile');
      if (data.kyc_status !== 'approved') return router.push('/dashboard/kyc');

      setProfile(data);
      setLoading(false);
    };
    load();
  }, [router]);

  /* Fetch Rate */
  const refreshRate = async () => {
    const rate = await fetchHbarToKshRate();
    setHbarRate(rate);
    setLastRateUpdate(new Date());
    toast.success('HBAR rate updated!');
  };

  useEffect(() => {
    if (profile) refreshRate();
  }, [profile]);

  /* Calculate HBAR */
  useEffect(() => {
    if (!hbarRate || !kshAmount) {
      setHbarNeeded(0);
      return;
    }
    const ksh = parseFloat(kshAmount) || 0;
    setHbarNeeded(ksh / hbarRate);
  }, [kshAmount, hbarRate]);

  /* Handle Investment */
  const handleInvest = async () => {
    if (!profile?.hedera_account_id) {
      toast.error('Connect wallet first');
      return router.push('/dashboard/wallet');
    }

    const amountKsh = parseFloat(kshAmount);
    if (amountKsh < 10) return toast.error('Minimum: KSh 10');

    if (!hbarRate || hbarNeeded <= 0) return toast.error('Rate not loaded');

    setSubmitting(true);

    try {
      if (!window.ethereum) throw new Error('Wallet not detected');

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();

      if (userAddr.toLowerCase() !== profile.hedera_account_id.toLowerCase()) {
        throw new Error('Wallet does not match your profile');
      }

      // 1. Send HBAR
      const amountHbar = parseUnits(hbarNeeded.toFixed(8), 18);
      const tx = await signer.sendTransaction({
        to: PLATFORM_HEDERA_ACCOUNT as AddressLike,
        value: amountHbar,
      });

      toast.info('Step 1/3: Sending HBAR payment...');
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) throw new Error('HBAR payment failed');

      // 2. Mint KUKU
      const baseShares = amountKsh / 700;
      const bonusShares = baseShares * 0.05;
      const totalShares = baseShares + bonusShares;
      const kukuAmount = parseUnits(totalShares.toFixed(8), 18);

      const contract = new Contract(KUKU_TOKEN_ADDRESS as AddressLike, KUKU_ABI, signer);
      toast.info('Step 2/3: Minting KUKU tokens...');
      const mintTx = await contract.mint(userAddr, kukuAmount);
      const mintReceipt = await mintTx.wait(1);
      if (!mintReceipt || mintReceipt.status !== 1) throw new Error('Token mint failed');

      // 3. Save to Supabase
      toast.info('Step 3/3: Recording investment...');
      const lockedUntil = new Date();
      lockedUntil.setDate(lockedUntil.getDate() + 3);

      const { error } = await supabase.from('investments').insert({
        user_id: profile.id,
        amount_ksh: amountKsh,
        base_shares: baseShares,
        bonus_shares: bonusShares,
        total_shares: totalShares,
        payment_method: 'hbar',
        locked_until: lockedUntil.toISOString(),
        status: 'completed',
        transaction_id: receipt.hash,
        token_mint_tx: mintReceipt.hash,
      });

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({
          total_invested_ksh: (profile.total_invested_ksh || 0) + amountKsh,
          total_shares: (profile.total_shares || 0) + totalShares,
        })
        .eq('id', profile.id);

      toast.success(
        <div className="space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Success! {totalShares.toFixed(2)} KUKU tokens minted
          </p>
          <div className="text-sm space-y-1">
            <a
              href={`https://hashscan.io/testnet/transaction/${receipt.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              HBAR Payment
            </a>
            <a
              href={`https://hashscan.io/testnet/transaction/${mintReceipt.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline ml-4"
            >
              <ExternalLink className="h-3 w-3" />
              KUKU Mint
            </a>
          </div>
        </div>
      );
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Investment failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* UI Calculations */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <span className="ml-3 text-lg">Loading your profile...</span>
      </div>
    );
  }

  const amount = parseFloat(kshAmount) || 0;
  const baseShares = amount / 700;
  const bonusShares = baseShares * 0.05;
  const totalShares = baseShares + bonusShares;
  const tier = amount <= 1000 ? { name: 'Starter', rate: 0.1, color: 'bg-gray-500' }
           : amount <= 5000 ? { name: 'Bronze', rate: 0.15, color: 'bg-orange-500' }
           : amount <= 20000 ? { name: 'Silver', rate: 0.2, color: 'bg-slate-400' }
           : { name: 'Gold', rate: 0.25, color: 'bg-yellow-500' };
  const daily = amount * (tier.rate / 100);
  const monthly = daily * 30;
  const canInvest = amount >= 10 && !!profile?.hedera_account_id && !!hbarRate;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Invest with HBAR
        </h1>
        <p className="text-lg text-muted-foreground">
          Pay once, get <strong>KUKU tokens instantly</strong> — 1 KUKU = 1 hen share
        </p>
      </div>

      {/* Wallet Status */}
      {!profile?.hedera_account_id ? (
        <Card className="bg-orange-50 border-orange-300">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Wallet className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Wallet Required</p>
                <p className="text-sm text-orange-700">
                  Connect your Hedera wallet to invest with HBAR
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/dashboard/wallet')} className="bg-orange-600 hover:bg-orange-700">
              Connect Wallet <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-300">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium">Wallet Connected</p>
                <p className="text-sm text-green-700">
                  {profile.hedera_account_id.slice(0, 8)}...{profile.hedera_account_id.slice(-6)}
                </p>
              </div>
            </div>
            <Badge className="bg-green-600">Ready</Badge>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Input + Rate */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Investment Amount
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refreshRate}
                  disabled={!hbarRate}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${lastRateUpdate ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                Enter amount in KSh — you pay equivalent HBAR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={kshAmount}
                  onChange={(e) => setKshAmount(e.target.value)}
                  placeholder="Minimum 10 KSh"
                  min="10"
                  className="text-lg font-mono"
                  disabled={!profile?.hedera_account_id}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: KSh 10 | No upper limit
                </p>
              </div>

              {/* Live HBAR Rate */}
              {hbarRate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Rate</span>
                  <span className="font-medium">
                    1 HBAR = KSh {hbarRate.toFixed(2)}
                    {lastRateUpdate && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (updated {new Date(lastRateUpdate).toLocaleTimeString()})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* HBAR Needed */}
              {hbarNeeded > 0 && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-green-600" />
                        <span className="font-medium">You will pay</span>
                      </div>
                      <Badge className="text-lg font-bold bg-green-600">
                        {hbarNeeded.toFixed(6)} HBAR
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lock Notice */}
              <Card className="bg-blue-50 border-blue-300">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">3-Day Lock Period</p>
                      <p className="text-sm text-blue-700">
                        Your KUKU tokens are locked for 3 days after investment.
                        You can withdraw after{' '}
                        {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invest Button */}
              <Button
                onClick={handleInvest}
                disabled={!canInvest || submitting}
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'w-full text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50',
                })}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing (Step {submitting ? '1/3' : '0/3'})...
                  </>
                ) : (
                  `Invest KSh ${amount.toLocaleString()}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary + Info */}
        <div className="space-y-6">
          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-green-600" />
                <CardTitle>Investment Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Shares</span>
                  <span className="text-xl font-bold">{baseShares.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    +5% Bonus
                  </span>
                  <span className="text-xl font-bold">+{bonusShares.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-green-200">
                  <span className="text-lg font-semibold">Total KUKU Tokens</span>
                  <Badge className="text-xl font-bold px-3 py-1 bg-green-600">
                    {totalShares.toFixed(4)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Your Tier</p>
                  <Badge className={`${tier.color} mt-1`}>{tier.name}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="text-lg font-bold text-green-600">{(tier.rate * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Profit</span>
                  <span className="font-bold text-green-600">KSh {daily.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Profit</span>
                  <span className="font-bold text-green-600">KSh {monthly.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Invest */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Why Invest with HBAR?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Instant KUKU minting</strong> — tokens appear in your wallet in seconds</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Ultra-low fees</strong> — ~$0.0001 per transaction on Hedera</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>On-chain proof</strong> — every investment is verifiable on HashScan</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Live Coinbase rates</strong> — always fair HBAR/KSH conversion</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-muted-foreground mt-12">
        <p>
          Powered by Hedera Hashgraph • KUKU Token: {KUKU_TOKEN_ADDRESS} •{' '}
          <a
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View on HashScan
          </a>
        </p>
      </div>
    </div>
  );
}
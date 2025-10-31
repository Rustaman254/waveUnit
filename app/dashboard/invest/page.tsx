'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { AlertCircle, Calculator, Wallet, ArrowRight } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrowserProvider, formatUnits, parseUnits } from 'ethers';
// import { PLATFORM_HEDERA_ACCOUNT } from '@/lib/constants';
const PLATFORM_HEDERA_ACCOUNT = "0x14fd864df57acda04a3d5a47c463227c9b189869";

/* --------------------------------------------------------------- */
/* 1. Helper – fetch HBAR/KSH rate from Coinbase                    */
/* --------------------------------------------------------------- */
async function fetchHbarToKshRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coinbase.com/v2/exchange-rates?currency=HBAR'
    );
    const data = await res.json();
    // data.rates.KES → HBAR to KES (Kenyan Shilling)
    const rate = Number(data?.data?.rates?.KES);
    if (isNaN(rate) || rate <= 0) throw new Error('Invalid rate');
    return rate; // 1 HBAR = X KSH
  } catch (e) {
    console.error(e);
    toast.error('Failed to fetch HBAR price – using fallback rate');
    return 45; // fallback ~ KSh 45 per HBAR (adjust as needed)
  }
}

/* --------------------------------------------------------------- */
/* 2. Main component                                                */
/* --------------------------------------------------------------- */
export default function InvestPage() {
  const router = useRouter();

  /* ---------- state ---------- */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [kshAmount, setKshAmount] = useState('');
  const [hbarRate, setHbarRate] = useState<number | null>(null);
  const [hbarNeeded, setHbarNeeded] = useState(0);

  /* ---------- load profile + wallet check ---------- */
  useEffect(() => {
    checkUserAndFetch();
  }, []);

  const checkUserAndFetch = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error('Failed to load profile');
      return;
    }

    if (profileData?.kyc_status !== 'approved') {
      router.push('/dashboard/kyc');
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  /* ---------- fetch HBAR price once profile is ready ---------- */
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const rate = await fetchHbarToKshRate();
      setHbarRate(rate);
    })();
  }, [profile]);

  /* ---------- recalc HBAR needed whenever amount or rate changes ---------- */
  useEffect(() => {
    if (!hbarRate || !kshAmount) {
      setHbarNeeded(0);
      return;
    }
    const ksh = parseFloat(kshAmount) || 0;
    const needed = ksh / hbarRate;
    setHbarNeeded(needed);
  }, [kshAmount, hbarRate]);

  /* ---------- investment logic ---------- */
  const handleInvest = async () => {
    // ---- 1. wallet guard -------------------------------------------------
    if (!profile?.hedera_account_id) {
      toast.error('Please connect your Hedera wallet first');
      router.push('/dashboard/wallet');
      return;
    }

    const amountKsh = parseFloat(kshAmount);
    if (amountKsh < 10) {
      toast.error('Minimum investment is KSh 10');
      return;
    }

    if (!hbarRate || hbarNeeded <= 0) {
      toast.error('Price data not loaded yet – try again');
      return;
    }

    setSubmitting(true);

    try {
      // ---- 2. request MetaMask -------------------------------------------------
      if (!window.ethereum) throw new Error('MetaMask not detected');

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // sanity check – should match DB
      if (userAddress.toLowerCase() !== profile.hedera_account_id.toLowerCase()) {
        throw new Error('Connected wallet does not match profile');
      }

      // ---- 3. send HBAR to platform account ------------------------------------
      const amountHbar = parseUnits(hbarNeeded.toFixed(8), 18); // 8-dp safety

      const tx = await signer.sendTransaction({
        to: PLATFORM_HEDERA_ACCOUNT,
        value: amountHbar,
      });

      toast.info('Transaction sent – waiting for confirmation…');
      const receipt = await tx.wait(1); // 1 confirmation is enough on Hedera

      if (!receipt?.status) throw new Error('Transaction reverted');

      // ---- 4. record investment in Supabase ------------------------------------
      const henPrice = 700; // KSh per hen share
      const baseShares = amountKsh / henPrice;
      const bonusShares = baseShares * 0.05;
      const totalShares = baseShares + bonusShares;

      const lockedUntil = new Date();
      lockedUntil.setDate(lockedUntil.getDate() + 3);

      const { error: invErr } = await supabase
        .from('investments')
        .insert([
          {
            user_id: profile.id,
            amount_ksh: amountKsh,
            base_shares: baseShares,
            bonus_shares: bonusShares,
            total_shares: totalShares,
            payment_method: 'hbar',
            locked_until: lockedUntil.toISOString(),
            status: 'completed',
            transaction_id: receipt.hash,
          },
        ]);

      if (invErr) throw invErr;

      // ---- 5. update profile totals --------------------------------------------
      await supabase
        .from('profiles')
        .update({
          total_invested_ksh: (profile.total_invested_ksh || 0) + amountKsh,
          total_shares: (profile.total_shares || 0) + totalShares,
        })
        .eq('id', profile.id);

      toast.success(
        `Investment successful! ${totalShares.toFixed(
          2
        )} HENS added to your wallet.`
      );
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Investment failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- UI helpers ---------- */
  if (loading) return <div className="text-center py-12">Loading…</div>;

  const amount = parseFloat(kshAmount) || 0;
  const henPrice = 700;
  const baseShares = amount / henPrice;
  const bonusShares = baseShares * 0.05;
  const totalShares = baseShares + bonusShares;

  const getTier = (amt: number) => {
    if (amt <= 1000) return { name: 'Starter', rate: 0.1 };
    if (amt <= 5000) return { name: 'Bronze', rate: 0.15 };
    if (amt <= 20000) return { name: 'Silver', rate: 0.2 };
    return { name: 'Gold', rate: 0.25 };
  };
  const tier = getTier(amount);
  const dailyProfit = amount * (tier.rate / 100);
  const monthlyProfit = dailyProfit * 30;

  /* --------------------------------------------------------------- */
  /* Render                                                          */
  /* --------------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* ----- Header ----- */}
      <div>
        <h1 className="text-3xl font-bold">Invest with HBAR</h1>
        <p className="text-muted-foreground">
          Pay with HBAR (Hedera) – instant, low-cost, on-chain.
        </p>
      </div>

      {/* ----- Wallet not connected banner ----- */}
      {!profile?.hedera_account_id && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <Wallet className="h-6 w-6 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium">
                You need a connected Hedera wallet to invest with HBAR.
              </p>
              <p className="text-sm text-muted-foreground">
                Connect it on the{' '}
                <Link href="/dashboard/wallet" className="underline">
                  Wallet page
                </Link>{' '}
                and return here.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/wallet')}
              className="ml-auto"
            >
              Connect Wallet <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* ----- LEFT – INPUT ----- */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Amount</CardTitle>
            <CardDescription>
              Enter amount in KSh – you’ll pay the equivalent in HBAR
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* KSH amount */}
            <div className="space-y-2">
              <Label htmlFor="ksh">Amount (KSh)</Label>
              <Input
                id="ksh"
                type="number"
                placeholder="Minimum 10 KSh"
                value={kshAmount}
                onChange={(e) => setKshAmount(e.target.value)}
                required
                min="10"
                disabled={!profile?.hedera_account_id}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: KSh 10 | No upper limit
              </p>
            </div>

            {/* HBAR needed (live) */}
            {hbarRate && hbarNeeded > 0 && (
              <div className="p-3 bg-green-50 rounded-lg text-sm">
                <p className="font-medium">
                  You will send{' '}
                  <span className="text-green-700">
                    {hbarNeeded.toFixed(6)} HBAR
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  1 HBAR ≈ KSh {hbarRate.toFixed(2)}
                </p>
              </div>
            )}

            {/* Lock notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  3-day lock period applies
                </p>
                <p>Withdraw after the lock expires</p>
              </CardContent>
            </Card>

            {/* Confirm button */}
            <Button
              onClick={handleInvest}
              disabled={
                submitting ||
                amount < 10 ||
                !profile?.hedera_account_id ||
                !hbarRate
              }
              className={buttonVariants({
                className:
                  'w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
              })}
            >
              {submitting ? 'Processing…' : 'Confirm Investment'}
            </Button>
          </CardContent>
        </Card>

        {/* ----- RIGHT – SUMMARY ----- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <CardTitle>Investment Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Base Shares
                  </span>
                  <span className="font-semibold">{baseShares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    5% Bonus Shares
                  </span>
                  <span className="font-semibold text-green-600">
                    +{bonusShares.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total Shares</span>
                  <span className="font-bold text-lg">
                    {totalShares.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Your Tier</span>
                  <Badge className="bg-green-600">
                    {tier.name} – {tier.rate}% Daily
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Daily Profit
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      KSh {dailyProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Monthly Profit
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      KSh {monthlyProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm">Why HBAR?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Instant settlement on Hedera</li>
                <li>Low fees (≈ $0.0001)</li>
                <li>Direct on-chain token minting</li>
                <li>Transparent, immutable records</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
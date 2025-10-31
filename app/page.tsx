'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Egg, TrendingUp, Shield, Users, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [platformStats, setPlatformStats] = useState({
    totalHens: 0,
    activeInvestors: 0,
    totalReturns: 0,
  });

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('total_hens')
      .maybeSingle();

    const { count: investorCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('total_invested_ksh', 0);

    const { data: distributions } = await supabase
      .from('profit_distributions')
      .select('amount_ksh');

    const totalReturns = distributions?.reduce((sum, d) => sum + Number(d.amount_ksh), 0) || 0;

    setPlatformStats({
      totalHens: settings?.total_hens || 500,
      activeInvestors: investorCount || 0,
      totalReturns: totalReturns,
    });
  };

  const henPrice = 700;
  const shares = investmentAmount / henPrice;
  const bonusShares = shares * 0.05;
  const totalShares = shares + bonusShares;

  const getTier = (amount: number) => {
    if (amount <= 1000) return { name: 'Starter', rate: 0.1, color: 'bg-slate-500' };
    if (amount <= 5000) return { name: 'Bronze', rate: 0.15, color: 'bg-orange-600' };
    if (amount <= 20000) return { name: 'Silver', rate: 0.2, color: 'bg-slate-400' };
    return { name: 'Gold', rate: 0.25, color: 'bg-yellow-500' };
  };

  const tier = getTier(investmentAmount);
  const dailyProfit = investmentAmount * (tier.rate / 100);
  const monthlyProfit = dailyProfit * 30;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Egg className="h-6 w-6 text-green-600" />
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              WaveUnits
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm font-medium hover:text-green-600 transition-colors">
              How It Works
            </Link>
            <Link href="#transparency" className="text-sm font-medium hover:text-green-600 transition-colors">
              Transparency
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-green-600 transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-green-600 hover:bg-green-700">
                Powered by Hedera Blockchain
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Own Fractions of
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {' '}Egg-Laying Hens
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Invest in real poultry farming starting from just KSh 10. Earn daily profits from egg sales,
                transparently tracked on the blockchain. Your investment, your hens, your returns.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    Start Investing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{platformStats.totalHens.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Hens</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{platformStats.activeInvestors.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Active Investors</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">KSh {platformStats.totalReturns.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Returns Paid</p>
                </div>
              </div>
            </div>

            {/* Investment Calculator Card */}
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <CardTitle>Investment Calculator</CardTitle>
                </div>
                <CardDescription>
                  See your potential daily and monthly earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Investment Amount (KSh)</label>
                  <Input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    min={10}
                    max={100000}
                    className="text-lg"
                  />
                  <input
                    type="range"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    min={10}
                    max={100000}
                    step={100}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hen Shares</span>
                    <span className="font-semibold">{shares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">5% Bonus Shares</span>
                    <span className="font-semibold text-green-600">+{bonusShares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Total Shares</span>
                    <span className="font-bold text-lg">{totalShares.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Your Tier</span>
                    <Badge className={tier.color}>{tier.name} - {tier.rate}% Daily</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Daily Profit</span>
                      <span className="text-xl font-bold text-green-600">
                        KSh {dailyProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Profit</span>
                      <span className="text-xl font-bold text-green-600">
                        KSh {monthlyProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/auth/register">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" size="lg">
                    Start Earning Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start earning from poultry farming in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up & Verify',
                description: 'Create your account and complete KYC verification to ensure platform security',
                icon: Users,
              },
              {
                step: '02',
                title: 'Invest & Own',
                description: 'Choose your investment amount starting from KSh 10 and receive hen shares instantly',
                icon: TrendingUp,
              },
              {
                step: '03',
                title: 'Earn Daily',
                description: 'Receive daily profits from egg sales based on your tier, paid automatically',
                icon: Egg,
              },
              {
                step: '04',
                title: 'Withdraw Anytime',
                description: 'Withdraw your profits to M-Pesa or crypto wallet after the 3-day lock period',
                icon: CheckCircle2,
              },
            ].map((item, idx) => (
              <Card key={idx} className="relative border-2 hover:border-green-200 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="absolute -top-4 left-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <item.icon className="h-12 w-12 text-green-600 mb-4 mt-4" />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Profit Tiers Section */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Profit Tiers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The more you invest, the higher your daily returns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Starter', range: 'KSh 10 - 1,000', rate: '0.1%', daily: 'Up to KSh 1', color: 'from-slate-600 to-slate-700' },
              { name: 'Bronze', range: 'KSh 1,001 - 5,000', rate: '0.15%', daily: 'Up to KSh 7.5', color: 'from-orange-600 to-orange-700' },
              { name: 'Silver', range: 'KSh 5,001 - 20,000', rate: '0.2%', daily: 'Up to KSh 40', color: 'from-slate-400 to-slate-500' },
              { name: 'Gold', range: 'KSh 20,001+', rate: '0.25%', daily: 'KSh 50+', color: 'from-yellow-500 to-yellow-600' },
            ].map((tier, idx) => (
              <Card key={idx} className="relative overflow-hidden border-2 hover:scale-105 transition-transform">
                <div className={`h-2 bg-gradient-to-r ${tier.color}`} />
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-base">{tier.range}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-600">{tier.rate}</p>
                    <p className="text-sm text-muted-foreground">Daily Return Rate</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Daily Profit</p>
                    <p className="text-xl font-semibold">{tier.daily}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Why Trust WaveUnits?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on blockchain transparency and real-world farming
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Blockchain Secured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All transactions recorded on Hedera Hashgraph for complete transparency and immutability
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2">
              <CardHeader>
                <Egg className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Real Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every token represents actual hens on our verified farm producing real eggs daily
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Weekly Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Full transparency with weekly farm reports showing production, costs, and revenue
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What is fractional hen ownership?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Fractional ownership allows you to own portions of egg-laying hens without buying whole birds.
                You invest any amount from KSh 10, and we convert it to hen shares. You earn daily profits from
                egg sales proportional to your shares.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How are profits calculated?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Profits are calculated based on your investment tier and total shares owned. Daily rates range
                from 0.1% (Starter) to 0.25% (Gold). Profits are automatically distributed to your account daily
                and recorded on the Hedera blockchain.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What is the 3-day lock period?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                To ensure farm operational stability, new investments are locked for 3 days. After this period,
                you can freely withdraw your profits or principal. Your daily profits accumulate during the lock period.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How do I withdraw my earnings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can withdraw to M-Pesa (minimum KSh 100) or to your Hedera wallet as HBAR or HENS tokens.
                Withdrawals are processed within 24 hours. All transactions are transparent and verifiable on the blockchain.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Why do I need to complete KYC?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                KYC (Know Your Customer) verification ensures platform security and compliance with financial
                regulations. It protects all investors and prevents fraud. The process is simple and your
                information is securely stored.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What is Hedera Hashgraph?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Hedera is a fast, secure, and fair distributed ledger technology. We use it to issue HENS tokens
                representing your hen shares and to record all transactions transparently. Its incredibly low
                fees and high speed make it perfect for daily profit distributions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Start Earning?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join hundreds of investors already earning daily profits from poultry farming
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <Egg className="h-6 w-6" />
                <span>WaveUnits</span>
              </div>
              <p className="text-sm text-slate-400">
                Democratizing poultry farming through blockchain technology
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/transparency" className="hover:text-white transition-colors">Transparency</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Risk Disclosure</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Email: support@waveunits.co.ke</li>
                <li>Phone: +254 700 000 000</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2025 WaveUnits. All rights reserved. Built on Hedera Hashgraph.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

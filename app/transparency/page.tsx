'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Egg, TrendingUp, DollarSign, PieChart, ArrowLeft } from 'lucide-react';
import { supabase, type PlatformSettings, type TransparencyReport } from '@/lib/supabase';
import { format } from 'date-fns';

export default function TransparencyPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [reports, setReports] = useState<TransparencyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('*')
        .maybeSingle();

      setSettings(settingsData);

      const { data: reportsData } = await supabase
        .from('transparency_reports')
        .select('*')
        .order('week_start_date', { ascending: false })
        .limit(8);

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Egg className="h-12 w-12 text-green-600 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Egg className="h-6 w-6 text-green-600" />
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              WaveUnits
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <Badge className="bg-green-600">100% Transparent</Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Farm Transparency</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Full visibility into our poultry operations. Every egg counted, every expense tracked,
            every profit shared. Built on blockchain, backed by real farming.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Hens</CardTitle>
              <Egg className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{settings?.total_hens.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Laying hens on farm</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Production</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {settings?.daily_egg_production.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Eggs per day</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hen Price</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">KSh {settings?.hen_price_ksh || 700}</div>
              <p className="text-xs text-muted-foreground mt-1">Per fractional share</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <PieChart className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {reports[0] ? `KSh ${Number(reports[0].revenue_ksh).toLocaleString()}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue generated</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profit Tier Structure</CardTitle>
            <CardDescription>
              Transparent daily return rates based on investment amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { tier: 'Starter', range: 'KSh 10 - 1,000', rate: '0.1%', color: 'bg-slate-500' },
                { tier: 'Bronze', range: 'KSh 1,001 - 5,000', rate: '0.15%', color: 'bg-orange-600' },
                { tier: 'Silver', range: 'KSh 5,001 - 20,000', rate: '0.2%', color: 'bg-slate-400' },
                { tier: 'Gold', range: 'KSh 20,001+', rate: '0.25%', color: 'bg-yellow-500' },
              ].map((item) => (
                <div key={item.tier} className="p-4 border rounded-lg space-y-2">
                  <Badge className={item.color}>{item.tier}</Badge>
                  <div className="text-2xl font-bold">{item.rate}</div>
                  <p className="text-sm text-muted-foreground">{item.range}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Weekly Farm Reports</h2>
          <p className="text-muted-foreground">
            Detailed breakdowns of operations, production, and financials updated every week
          </p>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No reports available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Week of {format(new Date(report.week_start_date), 'MMM dd, yyyy')}</CardTitle>
                    <Badge variant="outline">
                      {format(new Date(report.published_at), 'MMM dd')}
                    </Badge>
                  </div>
                  <CardDescription>Farm Operations Report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hens</p>
                      <p className="text-lg font-semibold">{report.total_hens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Eggs Produced</p>
                      <p className="text-lg font-semibold">{report.eggs_produced.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-medium text-green-600">
                        KSh {Number(report.revenue_ksh).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Operating Costs</span>
                      <span className="font-medium text-red-600">
                        KSh {Number(report.operating_costs_ksh).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">Net Profit</span>
                      <span className="font-bold text-green-600">
                        KSh {Number(report.net_profit_ksh).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">Cost Breakdown</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Feed</p>
                        <p className="font-medium">KSh {Number(report.feed_cost_ksh).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Labor</p>
                        <p className="font-medium">KSh {Number(report.labor_cost_ksh).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Other</p>
                        <p className="font-medium">KSh {Number(report.other_costs_ksh).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{report.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle>Blockchain Verification</CardTitle>
            <CardDescription>
              Every transaction is recorded on Hedera Hashgraph
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              All investments, profit distributions, and withdrawals are permanently recorded on the
              Hedera blockchain. You can verify any transaction using the Hashscan explorer.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline">Immutable Records</Badge>
              <Badge variant="outline">Public Verification</Badge>
              <Badge variant="outline">Zero Trust Required</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

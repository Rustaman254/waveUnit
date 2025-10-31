'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { supabase, type PlatformSettings } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('*')
      .maybeSingle();

    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          hen_price_ksh: settings.hen_price_ksh,
          total_hens: settings.total_hens,
          daily_egg_production: settings.daily_egg_production,
          ksh_to_hbar_rate: settings.ksh_to_hbar_rate,
          tier_rates: settings.tier_rates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure platform parameters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Settings</CardTitle>
            <CardDescription>Hen share pricing and conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="henPrice">Hen Price (KSh)</Label>
              <Input
                id="henPrice"
                type="number"
                value={settings.hen_price_ksh}
                onChange={(e) => setSettings({ ...settings, hen_price_ksh: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversionRate">KSh to HBAR Rate</Label>
              <Input
                id="conversionRate"
                type="number"
                step="0.000001"
                value={settings.ksh_to_hbar_rate}
                onChange={(e) => setSettings({ ...settings, ksh_to_hbar_rate: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Farm Statistics</CardTitle>
            <CardDescription>Current farm production metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalHens">Total Hens</Label>
              <Input
                id="totalHens"
                type="number"
                value={settings.total_hens}
                onChange={(e) => setSettings({ ...settings, total_hens: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyProduction">Daily Egg Production</Label>
              <Input
                id="dailyProduction"
                type="number"
                value={settings.daily_egg_production}
                onChange={(e) => setSettings({ ...settings, daily_egg_production: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profit Tier Rates</CardTitle>
            <CardDescription>Daily return rates for each investment tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starterRate">Starter (0.1%)</Label>
                <Input
                  id="starterRate"
                  type="number"
                  step="0.0001"
                  value={settings.tier_rates.starter}
                  onChange={(e) => setSettings({
                    ...settings,
                    tier_rates: { ...settings.tier_rates, starter: Number(e.target.value) }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bronzeRate">Bronze (0.15%)</Label>
                <Input
                  id="bronzeRate"
                  type="number"
                  step="0.0001"
                  value={settings.tier_rates.bronze}
                  onChange={(e) => setSettings({
                    ...settings,
                    tier_rates: { ...settings.tier_rates, bronze: Number(e.target.value) }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="silverRate">Silver (0.2%)</Label>
                <Input
                  id="silverRate"
                  type="number"
                  step="0.0001"
                  value={settings.tier_rates.silver}
                  onChange={(e) => setSettings({
                    ...settings,
                    tier_rates: { ...settings.tier_rates, silver: Number(e.target.value) }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goldRate">Gold (0.25%)</Label>
                <Input
                  id="goldRate"
                  type="number"
                  step="0.0001"
                  value={settings.tier_rates.gold}
                  onChange={(e) => setSettings({
                    ...settings,
                    tier_rates: { ...settings.tier_rates, gold: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

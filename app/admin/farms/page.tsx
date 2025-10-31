'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, MapPin } from 'lucide-react';
import { supabase, type Farm } from '@/lib/supabase';
import { toast } from 'sonner';

export default function FarmsManagementPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    total_hens: 0,
    daily_production: 0,
    description: '',
    image_url: '',
  });

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });

    setFarms(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('farms').insert([formData]);

      if (error) throw error;

      toast.success('Farm added successfully');
      setDialogOpen(false);
      setFormData({
        name: '',
        location: '',
        total_hens: 0,
        daily_production: 0,
        description: '',
        image_url: '',
      });
      fetchFarms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add farm');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farm Management</h1>
          <p className="text-muted-foreground">Manage your poultry farms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Farm</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Farm Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_hens">Total Hens</Label>
                  <Input
                    id="total_hens"
                    type="number"
                    value={formData.total_hens}
                    onChange={(e) => setFormData({ ...formData, total_hens: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_production">Daily Production (Eggs)</Label>
                  <Input
                    id="daily_production"
                    type="number"
                    value={formData.daily_production}
                    onChange={(e) => setFormData({ ...formData, daily_production: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/farm.jpg"
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Add Farm
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <Card key={farm.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">{farm.name}</CardTitle>
                </div>
                <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                  {farm.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {farm.location}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hens</p>
                  <p className="text-lg font-semibold">{farm.total_hens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Production</p>
                  <p className="text-lg font-semibold">{farm.daily_production.toLocaleString()}</p>
                </div>
              </div>
              {farm.description && (
                <p className="text-sm text-muted-foreground pt-2 border-t">{farm.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    address: '',
    proofOfIdUrl: '',
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setKycStatus(data.kyc_status);
      if (data.full_name) {
        setFormData({
          fullName: data.full_name || '',
          idNumber: data.id_number || '',
          phoneNumber: data.phone_number || '',
          address: data.address || '',
          proofOfIdUrl: data.proof_of_id_url || '',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          id_number: formData.idNumber,
          phone_number: formData.phoneNumber,
          address: formData.address,
          proof_of_id_url: formData.proofOfIdUrl,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('KYC submitted successfully! Waiting for approval.');
      setKycStatus('pending');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-600">KYC Verified</CardTitle>
            </div>
            <CardDescription>
              Your account has been verified. You can now start investing!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-600">KYC Rejected</CardTitle>
            </div>
            <CardDescription>
              Your KYC application was not approved. Please contact support or resubmit with correct information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setKycStatus('pending')}
              variant="outline"
            >
              Resubmit KYC
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your KYC verification to start investing. This helps us ensure platform security and compliance.
        </p>
      </div>

      {kycStatus === 'pending' && formData.fullName && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">KYC Under Review</CardTitle>
            </div>
            <CardDescription>
              Your KYC application is being reviewed. This usually takes 24-48 hours.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Please provide accurate information matching your government ID
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name</Label>
              <Input
                id="fullName"
                placeholder="As shown on ID"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="National ID or Passport number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+254 700 000 000"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your full physical address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofOfId">Proof of ID (URL)</Label>
              <div className="flex gap-2">
                <Input
                  id="proofOfId"
                  type="url"
                  placeholder="https://example.com/id-photo.jpg"
                  value={formData.proofOfIdUrl}
                  onChange={(e) => setFormData({ ...formData, proofOfIdUrl: e.target.value })}
                  required
                />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a clear photo of your government-issued ID (front and back)
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Why KYC is Required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>KYC verification helps us:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Comply with financial regulations</li>
            <li>Prevent fraud and protect all investors</li>
            <li>Ensure secure withdrawals to your account</li>
            <li>Build a trusted investment community</li>
          </ul>
          <p className="pt-2 text-xs">
            Your information is encrypted and stored securely. We never share your personal data with third parties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

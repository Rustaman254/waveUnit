'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminKYCPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .in('kyc_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching KYC:', error);
    }

    setProfiles(data || []);
    setLoading(false);
  };

  const handleApprove = async (profileId: string) => {
    setProcessingId(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'approved',
          kyc_approved_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('KYC approved successfully');
      fetchPendingKYC();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve KYC');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setProcessingId(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'rejected',
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('KYC rejected');
      fetchPendingKYC();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject KYC');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Approvals</h1>
        <p className="text-muted-foreground">Review and approve user verification requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications ({profiles.filter(p => p.kyc_status === 'pending').length})</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending KYC applications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name || 'N/A'}</TableCell>
                    <TableCell>{profile.id_number || 'N/A'}</TableCell>
                    <TableCell>{profile.phone_number || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {profile.kyc_submitted_at ? format(new Date(profile.kyc_submitted_at), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={profile.kyc_status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {profile.kyc_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {profile.proof_of_id_url ? (
                        <a
                          href={profile.proof_of_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        'No file'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(profile.id)}
                          disabled={processingId === profile.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(profile.id)}
                          disabled={processingId === profile.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

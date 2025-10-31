'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';
import { supabase, type Withdrawal } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

type WithdrawalWithUser = Withdrawal & {
  profiles: {
    full_name: string;
  };
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    setWithdrawals((data as WithdrawalWithUser[]) || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Withdrawal approved');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div>Loading withdrawals...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
        <p className="text-muted-foreground">Process user withdrawal requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No withdrawal requests</p>
              <p className="text-sm mt-2">Withdrawal requests will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount (KSh)</TableHead>
                    <TableHead>Shares Burned</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        {withdrawal.profiles?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(withdrawal.amount_ksh).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {withdrawal.shares_burned ? Number(withdrawal.shares_burned).toFixed(2) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{withdrawal.method}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {withdrawal.destination}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            withdrawal.status === 'completed' ? 'default' :
                            withdrawal.status === 'failed' ? 'destructive' :
                            'secondary'
                          }
                          className={
                            withdrawal.status === 'completed' ? 'bg-green-600' :
                            withdrawal.status === 'processing' ? 'bg-blue-600' : ''
                          }
                        >
                          {withdrawal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(withdrawal.id)}
                              disabled={processingId === withdrawal.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(withdrawal.id)}
                              disabled={processingId === withdrawal.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

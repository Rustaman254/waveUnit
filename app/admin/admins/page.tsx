'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, UserX, UserPlus } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', true)
      .order('created_at', { ascending: false });

    setAdmins(data || []);
    setLoading(false);
  };

  const handleRevokeAdmin = async (profileId: string) => {
    if (!confirm('Are you sure you want to revoke admin access?')) return;

    setProcessingId(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: false,
          role: 'investor',
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Admin access revoked');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke admin access');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading administrators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Manage platform administrators</p>
        </div>
        <Link href="/admin/register">
          <Button className="bg-green-600 hover:bg-green-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Admin
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Active Administrators ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No administrators found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.full_name || 'Not Set'}
                    </TableCell>
                    <TableCell>{admin.id}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(admin.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeAdmin(admin.id)}
                        disabled={processingId === admin.id}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Revoke Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Admin Access Control</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Administrators have the following permissions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Approve and reject KYC applications</li>
            <li>Manage farms and platform settings</li>
            <li>View all user investments and transactions</li>
            <li>Generate and publish transparency reports</li>
            <li>Manage other administrators</li>
          </ul>
          <p className="pt-2 text-xs">
            All admin actions are logged for security and audit purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

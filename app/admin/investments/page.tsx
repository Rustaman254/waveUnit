'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, DollarSign, Users, Egg } from 'lucide-react';
import { supabase, type Investment } from '@/lib/supabase';
import { format } from 'date-fns';

type InvestmentWithUser = Investment & {
  profiles: {
    full_name: string;
    hedera_account_id: string;
  };
};

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<InvestmentWithUser[]>([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalShares: 0,
    activeInvestors: 0,
    averageInvestment: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    const { data } = await supabase
      .from('investments')
      .select(`
        *,
        profiles (
          full_name,
          hedera_account_id
        )
      `)
      .order('created_at', { ascending: false });

    const typedData = (data || []) as InvestmentWithUser[];
    setInvestments(typedData);

    const totalInvested = typedData.reduce((sum, inv) => sum + Number(inv.amount_ksh), 0);
    const totalShares = typedData.reduce((sum, inv) => sum + Number(inv.total_shares), 0);
    const uniqueInvestors = new Set(typedData.map(inv => inv.user_id)).size;
    const avgInvestment = uniqueInvestors > 0 ? totalInvested / uniqueInvestors : 0;

    setStats({
      totalInvested,
      totalShares,
      activeInvestors: uniqueInvestors,
      averageInvestment: avgInvestment,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading investments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Overview</h1>
        <p className="text-muted-foreground">Monitor all platform investments</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {stats.totalInvested.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShares.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hen shares issued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInvestors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {stats.averageInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per investor
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Investments ({investments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No investments yet</p>
              <p className="text-sm mt-2">Investments will appear here once users start investing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Amount (KSh)</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">
                        {investment.profiles?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(investment.amount_ksh).toLocaleString()}
                      </TableCell>
                      <TableCell>{Number(investment.total_shares).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">
                        +{Number(investment.bonus_shares).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{investment.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(investment.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={investment.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            investment.status === 'completed' ? 'bg-green-600' : ''
                          }
                        >
                          {investment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {investment.transaction_id ? (
                          <span className="text-blue-600">
                            {investment.transaction_id.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
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

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Link as LinkIcon, ExternalLink, Copy, CheckCircle, ArrowUpRight, Clock, Coins } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { BrowserProvider } from 'ethers';

// TypeScript declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress?: string | null;
      chainId?: string;
    };
  }
}

interface Investment {
  id: string;
  amount_ksh: number;
  total_shares: number;
  transaction_id: string;
  token_mint_tx: string | null;
  created_at: string;
  locked_until: string;
}

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [hbarBalance, setHbarBalance] = useState<string>('0.00');
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [transactions, setTransactions] = useState<Investment[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    fetchProfileAndTransactions();
  }, []);

  useEffect(() => {
    if (profile?.hedera_account_id) {
      fetchHbarBalance();
    }
  }, [profile?.hedera_account_id]);

  const fetchProfileAndTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    // Fetch recent investments
    const { data: txData } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setTransactions(txData || []);
    setLoading(false);
  };

  const fetchHbarBalance = async () => {
    if (!window.ethereum || !profile?.hedera_account_id) return;
    
    setFetchingBalance(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(profile.hedera_account_id);
      const hbarAmount = Number(balance) / 1e18;
      setHbarBalance(hbarAmount.toFixed(2));
    } catch (error) {
      console.error('Error fetching HBAR balance:', error);
      setHbarBalance('0.00');
    } finally {
      setFetchingBalance(false);
    }
  };

  async function connectHederaWallet() {
    if (!window.ethereum) throw new Error('MetaMask is not installed');
    
    const chainId = '0x128';
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId,
          chainName: 'Hedera Testnet',
          nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
          rpcUrls: ['https://testnet.hashio.io/api'],
          blockExplorerUrls: ['https://hashscan.io/testnet'],
        }],
      });
    } catch (addError: any) {
      if (addError.code !== 4902) throw addError;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      throw switchError;
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { address, provider };
  }

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      const { address } = await connectHederaWallet();
      const { error } = await supabase
        .from('profiles')
        .update({ hedera_account_id: address })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Wallet connected successfully!');
      await fetchProfileAndTransactions();
      await fetchHbarBalance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hedera_account_id: null })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Wallet disconnected');
      setHbarBalance('0.00');
      fetchProfileAndTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Wallet Dashboard
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage your Hedera wallet, view balances, and track on-chain activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-green-600" />
              Hedera Wallet
            </CardTitle>
            <CardDescription>
              {profile?.hedera_account_id ? 'Connected & Active' : 'Not connected'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {profile?.hedera_account_id ? (
              <>
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Account Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-100 rounded text-sm font-mono break-all">
                      {profile.hedera_account_id}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(profile.hedera_account_id!, 'address')}
                    >
                      {copied === 'address' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className="bg-green-600">Connected</Badge>
                  <Badge variant="outline">Hedera Testnet</Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `https://hashscan.io/testnet/account/${profile.hedera_account_id}`,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on HashScan
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Connect your Hedera wallet to receive <strong>KUKU tokens</strong> and manage investments on-chain.
                </p>
                <Button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-medium"
                >
                  <LinkIcon className="h-5 w-5 mr-2" />
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balances</CardTitle>
            <CardDescription>Your assets on Hedera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div>
                  <p className="font-semibold text-green-900">KUKU Tokens</p>
                  <p className="text-xs text-green-700">Hen Share Tokens</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-900">
                    {profile?.total_shares?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-green-700">KUKU</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold">HBAR Balance</p>
                  <p className="text-xs text-muted-foreground">Native Token</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {fetchingBalance ? (
                      <span className="text-muted-foreground animate-pulse">...</span>
                    ) : (
                      hbarBalance
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">HBAR</p>
                </div>
              </div>
            </div>

            {!profile?.hedera_account_id && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 text-sm text-center text-blue-700">
                  Connect wallet to see live balances
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-green-600" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Your latest investments and token mints on Hedera Testnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Make your first investment!
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 border rounded-lg hover:border-green-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        Investment: KSh {tx.amount_ksh.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.total_shares.toFixed(2)} KUKU minted
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                      {tx.locked_until && new Date(tx.locked_until) > new Date() && (
                        <Badge variant="secondary" className="mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-muted-foreground">HBAR Payment</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono">
                          {tx.transaction_id.slice(0, 8)}...{tx.transaction_id.slice(-6)}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(tx.transaction_id, 'tx-' + tx.id)}
                        >
                          {copied === 'tx-' + tx.id ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() =>
                            window.open(
                              `https://hashscan.io/testnet/transaction/${tx.transaction_id}`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {tx.token_mint_tx && (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          KUKU Mint
                        </span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono">
                            {tx.token_mint_tx.slice(0, 8)}...{tx.token_mint_tx.slice(-6)}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(tx.token_mint_tx!, 'mint-' + tx.id)}
                          >
                            {copied === 'mint-' + tx.id ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              window.open(
                                `https://hashscan.io/testnet/transaction/${tx.token_mint_tx}`,
                                '_blank'
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Wallets</CardTitle>
          <CardDescription>Connect using any of these</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['MetaMask', 'HashPack', 'Blade', 'Kabila'].map((wallet) => (
              <div
                key={wallet}
                className="p-4 border rounded-lg text-center hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer"
              >
                <Wallet className="h-10 w-10 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-sm">{wallet}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg">Hedera-Powered Transparency</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Every action is recorded on <strong>Hedera Testnet</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>HBAR payments are immutable</li>
            <li>KUKU token mints are verifiable</li>
            <li>All transactions are public on HashScan</li>
            <li>Zero trust — you own your assets</li>
          </ul>
          <Button
            variant="link"
            className="p-0 h-auto mt-2"
            onClick={() => window.open('https://hashscan.io/testnet', '_blank')}
          >
            Explore HashScan Testnet <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium ${className || ''}`}>{children}</label>;
}
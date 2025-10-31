'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Link as LinkIcon, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { BrowserProvider } from 'ethers';

// TypeScript declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: {
        method: string;
        params?: any[];
      }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress?: string | null;
      chainId?: string;
    };
  }
}

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hbarBalance, setHbarBalance] = useState<string>('0.00');
  const [fetchingBalance, setFetchingBalance] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.hedera_account_id) {
      fetchHbarBalance();
    }
  }, [profile?.hedera_account_id]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const fetchHbarBalance = async () => {
    if (!window.ethereum || !profile?.hedera_account_id) return;
    
    setFetchingBalance(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(profile.hedera_account_id);
      // Convert from wei to HBAR (18 decimals)
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
    
    // Hedera Testnet configuration. Change to mainnet as needed.
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
      // Chain might already be added
      if (addError.code !== 4902) {
        throw addError;
      }
    }

    // Switch to Hedera network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      throw switchError;
    }

    // Create provider and get signer using ethers v6 syntax
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
        .update({
          hedera_account_id: address,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Wallet connected successfully!');
      await fetchProfile();
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
        .update({
          hedera_account_id: null,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Wallet disconnected');
      setHbarBalance('0.00');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">
          Connect your Hedera wallet to manage your investments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Hedera Wallet
            </CardTitle>
            <CardDescription>
              {profile?.hedera_account_id ? 'Connected' : 'Not connected'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.hedera_account_id ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Account ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-100 rounded text-sm font-mono">
                      {profile.hedera_account_id}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(profile.hedera_account_id!)}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
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
                    className="w-full"
                    onClick={handleDisconnect}
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Connect your Hedera wallet to receive HENS tokens and manage your investments directly on the blockchain.
                </p>
                <Button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Balances</CardTitle>
            <CardDescription>Your token holdings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">HENS Tokens</p>
                  <p className="text-xs text-muted-foreground">Hen Share Tokens</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{profile?.total_shares?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-muted-foreground">HENS</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">HBAR Balance</p>
                  <p className="text-xs text-muted-foreground">Hedera Native Token</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {fetchingBalance ? (
                      <span className="text-muted-foreground animate-pulse">...</span>
                    ) : (
                      hbarBalance
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">HBAR</p>
                </div>
              </div>
            </div>

            {!profile?.hedera_account_id && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  <p>Connect your wallet to view real-time balances</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supported Wallets</CardTitle>
          <CardDescription>Compatible Hedera wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['MetaMask', 'HashPack', 'Blade', 'Kabila'].map((wallet) => (
              <div
                key={wallet}
                className="p-4 border rounded-lg text-center hover:border-green-600 transition-colors cursor-pointer"
              >
                <Wallet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">{wallet}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-sm">About Hedera Integration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>WaveUnits uses Hedera Hashgraph for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tokenized hen shares (HENS tokens)</li>
            <li>Transparent transaction history</li>
            <li>Fast and low-cost transfers</li>
            <li>Immutable ownership records</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Egg, LogOut, Menu, X } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Egg className="h-12 w-12 text-green-600 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <Egg className="h-6 w-6 text-green-600" />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                WaveUnits
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
              {profile && (
                <div className="flex items-center gap-2 justify-end">
                  <Badge
                    variant={profile.kyc_status === 'approved' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      profile.kyc_status === 'approved' && 'bg-green-600',
                      profile.kyc_status === 'pending' && 'bg-yellow-600',
                      profile.kyc_status === 'rejected' && 'bg-red-600'
                    )}
                  >
                    KYC: {profile.kyc_status}
                  </Badge>
                  {profile.is_admin && (
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:flex">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white absolute top-16 left-0 right-0 shadow-lg">
            <div className="p-4 space-y-2">
              <div className="pb-3 border-b">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                {profile && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={profile.kyc_status === 'approved' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      KYC: {profile.kyc_status}
                    </Badge>
                    {profile.is_admin && (
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <DashboardSidebar isAdmin={profile?.is_admin} />
      </div>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

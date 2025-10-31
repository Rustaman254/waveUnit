'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  FileText,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Egg,
  Building2,
  UserCog,
  DollarSign,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

export function DashboardSidebar({ isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const investorNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/invest', icon: TrendingUp, label: 'Invest' },
    { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
    { href: '/transparency', icon: FileText, label: 'Transparency' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/kyc', icon: Users, label: 'KYC Approvals' },
    { href: '/admin/users', icon: UserCog, label: 'Users' },
    { href: '/admin/investments', icon: TrendingUp, label: 'Investments' },
    { href: '/admin/withdrawals', icon: DollarSign, label: 'Withdrawals' },
    { href: '/admin/farms', icon: Building2, label: 'Farms' },
    { href: '/admin/admins', icon: Shield, label: 'Admins' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
    { href: '/transparency', icon: FileText, label: 'Transparency' },
  ];

  const navItems = isAdmin ? adminNavItems : investorNavItems;

  return (
    <div
      className={cn(
        'fixed left-0 top-16 bottom-0 bg-white border-r transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

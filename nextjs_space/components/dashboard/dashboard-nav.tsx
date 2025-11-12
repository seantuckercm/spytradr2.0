
// components/dashboard/dashboard-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Eye, 
  TrendingUp,
  Scan, 
  Bot,
  Bell, 
  Settings,
  User,
  Sparkles,
  Activity,
  BarChart3
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Watchlists',
    href: '/watchlists',
    icon: Eye,
  },
  {
    title: 'Signals',
    href: '/signals',
    icon: TrendingUp,
  },
  {
    title: 'Scanner',
    href: '/scanner',
    icon: Scan,
  },
  {
    title: 'Agents',
    href: '/agents',
    icon: Bot,
  },
  {
    title: 'Backtesting',
    href: '/backtesting',
    icon: Activity,
  },
  {
    title: 'Performance',
    href: '/performance',
    icon: BarChart3,
  },
  {
    title: 'AI Copilot',
    href: '/copilot',
    icon: Sparkles,
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 lg:block hidden">
      <div className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            className={cn(
              'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.disabled && (
              <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                Soon
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

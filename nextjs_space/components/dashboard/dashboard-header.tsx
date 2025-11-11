
// components/dashboard/dashboard-header.tsx
import { UserButton } from '@/components/auth/user-button';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SpyTradr</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}

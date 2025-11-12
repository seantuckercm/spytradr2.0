
// components/dashboard/dashboard-header.tsx
'use client';

import { UserButton } from '@/components/auth/user-button';
import Link from 'next/link';
import { TrendingUp, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DashboardNav } from './dashboard-nav';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center space-x-2 px-4 py-5 border-b">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">SpyTradr</span>
              </div>
              <DashboardNav mobile />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl hidden sm:inline">SpyTradr</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}

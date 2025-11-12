
// app/(dashboard)/layout.tsx
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 lg:pl-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

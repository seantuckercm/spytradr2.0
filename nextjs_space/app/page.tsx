
// app/page.tsx
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { PricingTable } from '@/components/marketing/pricing-table';
import { CTASection } from '@/components/marketing/cta-section';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <MarketingHeader />
      <Hero />
      <Features />
      <PricingTable />
      <CTASection />
    </div>
  );
}

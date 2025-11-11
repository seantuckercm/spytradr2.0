
// components/marketing/hero.tsx
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Zap } from 'lucide-react';
import { SignInButton } from '@/components/auth/sign-in-button';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-24 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-primary">Crypto Trading</span>
          <br />
          Signals Platform
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
          Get real-time cryptocurrency trading signals based on advanced technical analysis 
          and market data from Kraken. Make informed trading decisions with confidence.
        </p>
        
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <SignInButton>
            <Button size="lg" className="text-lg">
              Get Started Free
            </Button>
          </SignInButton>
          
          <Button variant="outline" size="lg" className="text-lg" asChild>
            <Link href="#pricing">
              View Pricing
            </Link>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center">
            <Shield className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Secure & Reliable</h3>
            <p className="text-sm text-muted-foreground">Bank-level security</p>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Real-time Signals</h3>
            <p className="text-sm text-muted-foreground">Instant notifications</p>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">Multi-strategy approach</p>
          </div>
        </div>
      </div>
    </section>
  );
}

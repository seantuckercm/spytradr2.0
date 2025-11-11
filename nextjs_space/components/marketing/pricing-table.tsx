
// components/marketing/pricing-table.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { SignInButton } from '@/components/auth/sign-in-button';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      '2 watchlists',
      '10 pairs per watchlist', 
      '1 automated agent',
      '10 signals per day',
      'AI trading copilot',
      'Basic support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Basic', 
    price: '$29',
    description: 'Best for active traders',
    features: [
      '5 watchlists',
      '25 pairs per watchlist',
      '3 automated agents',
      '50 signals per day', 
      'Real-time signals',
      'Advanced TA indicators',
      'Email notifications',
      'AI trading copilot',
      'Priority support',
    ],
    cta: 'Start Basic Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$79',
    description: 'For serious traders',
    features: [
      '15 watchlists',
      '100 pairs per watchlist',
      '10 automated agents',
      '500 signals per day',
      'Real-time signals',
      'Advanced TA indicators', 
      'Email notifications',
      'AI trading copilot',
      'Performance analytics',
      'Custom strategies',
      'Premium support',
    ],
    cta: 'Start Pro Plan',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    description: 'For professional traders',
    features: [
      'Unlimited watchlists',
      'Unlimited pairs',
      'Unlimited agents',
      'Unlimited signals',
      'Real-time signals',
      'Advanced TA indicators',
      'Email notifications', 
      'AI trading copilot',
      'Performance analytics',
      'Custom strategies',
      'White-label options',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingTable() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Choose your plan
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free and upgrade as you grow. All plans include core features.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.price !== '$0' && <span className="text-muted-foreground">/month</span>}
              </div>
              <CardDescription className="mt-2">
                {tier.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-4 w-4 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-6">
                <SignInButton>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

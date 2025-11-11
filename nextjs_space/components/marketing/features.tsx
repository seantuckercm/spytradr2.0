
// components/marketing/features.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Bot, BarChart3, Bell, Target, Layers } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Smart Watchlists',
    description: 'Create and manage multiple watchlists with custom trading pairs and strategies.',
  },
  {
    icon: Bot,
    title: 'Automated Agents',
    description: 'Set up scheduled agents to monitor markets 24/7 and generate signals.',
  },
  {
    icon: BarChart3,
    title: 'Technical Analysis',
    description: 'Advanced TA indicators including momentum, breakout, and trend-following strategies.',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description: 'Instant notifications when high-confidence trading opportunities are detected.',
  },
  {
    icon: Target,
    title: 'Risk Management',
    description: 'Built-in risk assessment and confidence scoring for every signal.',
  },
  {
    icon: Layers,
    title: 'Multi-Exchange',
    description: 'Currently supports Kraken with more exchanges coming soon.',
  },
];

export function Features() {
  return (
    <section id="features" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to trade smarter
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Professional-grade tools for cryptocurrency trading signals and analysis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

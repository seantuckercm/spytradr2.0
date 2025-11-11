
// components/marketing/cta-section.tsx
import { Button } from '@/components/ui/button';
import { SignInButton } from '@/components/auth/sign-in-button';

export function CTASection() {
  return (
    <section className="bg-primary/5 py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start trading smarter?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Join thousands of traders who trust SpyTradr for their cryptocurrency 
            trading signals. Start your free account today.
          </p>
          <div className="mt-10">
            <SignInButton>
              <Button size="lg" className="text-lg px-8">
                Start Trading Now
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    </section>
  );
}

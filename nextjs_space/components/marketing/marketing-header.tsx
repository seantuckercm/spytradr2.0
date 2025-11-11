
"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useUser } from "@clerk/nextjs";

export function MarketingHeader() {
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6" />
          <span className="text-xl font-bold">SpyTradr</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isSignedIn ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="#pricing">Pricing</Link>
              </Button>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

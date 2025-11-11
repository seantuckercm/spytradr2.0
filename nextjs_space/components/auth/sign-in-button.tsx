
// components/auth/sign-in-button.tsx
'use client';

import { SignInButton as ClerkSignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface SignInButtonProps {
  mode?: 'modal' | 'redirect';
  children?: React.ReactNode;
}

export function SignInButton({ mode = 'redirect', children }: SignInButtonProps) {
  return (
    <ClerkSignInButton mode={mode}>
      {children || (
        <Button variant="default" size="sm">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      )}
    </ClerkSignInButton>
  );
}

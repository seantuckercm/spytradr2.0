
// components/auth/sign-out-button.tsx
'use client';

import { SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  children?: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  return (
    <ClerkSignOutButton>
      {children || (
        <Button variant="ghost" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      )}
    </ClerkSignOutButton>
  );
}

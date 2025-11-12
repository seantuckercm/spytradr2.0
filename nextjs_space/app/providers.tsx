
// app/providers.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { TeacherModeProvider } from '@/hooks/use-teacher-mode';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TeacherModeProvider>
          {children}
        </TeacherModeProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

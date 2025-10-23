import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Authentication Layout Component
 * Used for login, register, and other auth pages
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}


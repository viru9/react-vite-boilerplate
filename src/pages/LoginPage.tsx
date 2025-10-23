import { AuthLayout } from '@/components/layouts/AuthLayout';
import { LoginForm } from '@/features/auth';

/**
 * Login Page
 */
export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}


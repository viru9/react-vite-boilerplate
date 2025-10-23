import { AuthLayout } from '@/components/layouts/AuthLayout';
import { RegisterForm } from '@/features/auth';

/**
 * Register Page
 */
export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}


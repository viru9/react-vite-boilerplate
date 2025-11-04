import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

/**
 * Reset Password Page
 */
export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}

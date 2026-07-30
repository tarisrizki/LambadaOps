import { LoginForm } from '@/features/auth/components/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - LambadaOps',
  description: 'Login to your LambadaOps workspace.',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">LambadaOps</h1>
        <p className="text-muted-foreground mt-2">Asset & Maintenance Operations</p>
      </div>
      <LoginForm />
    </div>
  );
}

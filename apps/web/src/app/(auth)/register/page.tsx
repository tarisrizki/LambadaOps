import { RegisterForm } from '@/features/auth/components/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - LambadaOps',
  description: 'Create a new LambadaOps workspace.',
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">LambadaOps</h1>
        <p className="text-muted-foreground mt-2">Start your 14-day free trial</p>
      </div>
      <RegisterForm />
    </div>
  );
}

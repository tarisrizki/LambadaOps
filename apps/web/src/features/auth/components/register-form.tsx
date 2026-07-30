'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useMutation } from '@tanstack/react-query';
import { authMutations } from '@/features/auth/api/mutations';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  domain: z.string().min(3, 'Domain is required').regex(/^[a-z0-9-]+$/, 'Lowercase alphanumeric and hyphens only'),
  adminEmail: z.string().email('Invalid email address'),
  adminName: z.string().min(2, 'Admin name is required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const mutation = useMutation(authMutations.register());

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      domain: '',
      adminEmail: '',
      adminName: '',
      adminPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    const payload = {
      companyName: data.companyName,
      slug: data.domain,
      adminName: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword,
    };
    
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Registration successful. Please login.');
        router.push('/login');
      },
      onError: (error) => {
        toast.error(error.message || 'Registration failed');
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Register your company to get started with LambadaOps.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Acme Corporation"
              {...form.register('companyName')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">Workspace Slug (Domain)</Label>
            <Input
              id="domain"
              placeholder="acme-corp"
              {...form.register('domain')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.domain && (
              <p className="text-sm text-destructive">{form.formState.errors.domain.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Name</Label>
            <Input
              id="adminName"
              placeholder="John Doe"
              {...form.register('adminName')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.adminName && (
              <p className="text-sm text-destructive">{form.formState.errors.adminName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@example.com"
              {...form.register('adminEmail')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.adminEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.adminEmail.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              type="password"
              {...form.register('adminPassword')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.adminPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.adminPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="underline underline-offset-4 hover:text-primary">
              Log in
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

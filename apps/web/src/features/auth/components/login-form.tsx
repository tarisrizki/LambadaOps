'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

import { useMutation } from '@tanstack/react-query';
import { authMutations } from '@/features/auth/api/mutations';

const loginSchema = z.object({
  companySlug: z.string().min(1, 'Workspace is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login: authenticateUser } = useAuth();
  const mutation = useMutation(authMutations.login());

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companySlug: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    mutation.mutate(data, {
      onSuccess: async (body) => {
        await authenticateUser(body.accessToken);
        toast.success('Successfully logged in');
      },
      onError: (error) => {
        toast.error(error.message || 'Invalid credentials');
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your credentials to access your workspace.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companySlug">Workspace</Label>
            <Input
              id="companySlug"
              placeholder="e.g. acme-corp"
              {...form.register('companySlug')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.companySlug && (
              <p className="text-sm text-destructive">{form.formState.errors.companySlug.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...form.register('email')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              disabled={mutation.isPending}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/register" className="underline underline-offset-4 hover:text-primary">
              Register
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

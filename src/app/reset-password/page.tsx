
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Container from '@/components/shared/Container';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const resetPasswordFormSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmNewPassword: z.string().min(6, { message: 'Please confirm your new password.' }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match.",
  path: ["confirmNewPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      setTokenError("No reset token provided or token is invalid. Please request a new reset link.");
      setIsTokenValid(false);
      setIsLoadingToken(false);
      return;
    }

    const verifyToken = async () => {
      setIsLoadingToken(true);
      try {
        // This API endpoint will be created in the next step
        const response = await fetch(`/api/auth/reset-password/verify-token?token=${token}`);
        const result = await response.json();
        if (response.ok && result.valid) {
          setIsTokenValid(true);
        } else {
          setTokenError(result.message || "Invalid or expired reset token. Please request a new one.");
          setIsTokenValid(false);
        }
      } catch (error) {
        setTokenError("Failed to verify reset token. Please try again later.");
        setIsTokenValid(false);
      } finally {
        setIsLoadingToken(false);
      }
    };
    verifyToken();
  }, [token]);

  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    if (!token || !isTokenValid) {
      toast({ title: "Error", description: "Invalid or missing token.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // This API endpoint will be created in the next step
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Successful",
          description: result.message || "Your password has been reset. You can now log in.",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        });
        router.push('/login');
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.message || "Could not reset your password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingToken) {
    return (
      <Container className="max-w-md py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verifying Token...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <LoadingSpinner text="Please wait while we verify your reset link." />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!isTokenValid || tokenError) {
    return (
      <Container className="max-w-md py-12">
        <Card className="shadow-xl border-destructive">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle className="text-2xl text-destructive">Invalid or Expired Link</CardTitle>
            <CardDescription>{tokenError || "The password reset link is invalid or has expired."}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href="/forgot-password">Request a New Link</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-12">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner size={18} className="mr-2" /> : <KeyRound size={18} className="mr-2" />}
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            Remembered your password?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
}

export default function ResetPasswordPage() {
  // Wrap with Suspense because useSearchParams() needs it
  return (
    <Suspense fallback={<Container className="text-center py-10"><LoadingSpinner text="Loading..." /></Container>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

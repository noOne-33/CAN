
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { User as UserIcon, Edit3, Save, LogIn, AlertTriangle, Mail, KeyRound } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const nameFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name cannot exceed 50 characters."),
});
type NameFormData = z.infer<typeof nameFormSchema>;

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type EmailFormData = z.infer<typeof emailFormSchema>;

const passwordChangeFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmNewPassword: z.string().min(6, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});
type PasswordChangeFormData = z.infer<typeof passwordChangeFormSchema>;

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: '' },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    setIsAuthenticated(true);

    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 401) setIsAuthenticated(false);
        throw new Error(errData.message || 'Failed to fetch profile');
      }
      const data: User = await response.json();
      setUser(data);
      nameForm.reset({ name: data.name || '' });
      emailForm.reset({ email: data.email || '' });
    } catch (err: any) {
      setError(err.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [nameForm, emailForm]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const onSubmitName: SubmitHandler<NameFormData> = async (data) => {
    if (!user || data.name === user.name) {
      toast({ title: "No Changes", description: "Your name is already set to this value."});
      return;
    }
    setIsSubmittingName(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: data.name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update name');
      
      setUser(prevUser => prevUser ? { ...prevUser, name: result.name } : null);
      nameForm.reset({ name: result.name || ''});
      toast({ title: "Name Updated", description: "Your name has been successfully updated." });
    } catch (err: any) {
      toast({ title: "Error Updating Name", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingName(false);
    }
  };

  const onSubmitEmail: SubmitHandler<EmailFormData> = async (data) => {
    if (!user || data.email.toLowerCase() === user.email.toLowerCase()) {
      toast({ title: "No Changes", description: "This is already your current email address." });
      return;
    }
    setIsSubmittingEmail(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update email');
      
      setUser(prevUser => prevUser ? { ...prevUser, email: result.email } : null);
      emailForm.reset({ email: result.email || '' });
      toast({ 
        title: "Email Update Initiated", 
        description: result.message || "Your email has been updated. You may need to log out and log back in for the changes to reflect everywhere.",
        duration: 7000,
      });
    } catch (err: any)
      {
      toast({ title: "Error Updating Email", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const onSubmitPassword: SubmitHandler<PasswordChangeFormData> = async (data) => {
    setIsSubmittingPassword(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to change password');
      
      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      passwordForm.reset();
    } catch (err: any) {
      toast({ title: "Error Changing Password", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
    }
  };


  if (isLoading) {
    return <LoadingSpinner text="Loading your profile..." />;
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><LogIn size={24} className="mr-2 text-primary" /> Login Required</CardTitle>
          <CardDescription>Please log in to view your profile.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Button asChild>
            <Link href="/login?redirect=/dashboard/profile">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>{error}</p>
          <Button onClick={fetchUserProfile} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
     return (
      <Card>
        <CardHeader className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>Could not retrieve your profile information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Update Name Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <UserIcon size={22} className="mr-2 text-primary" /> Personal Information
          </CardTitle>
          <CardDescription>View and update your name and email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Form */}
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onSubmitName)} className="space-y-3">
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input {...field} placeholder="Your full name" disabled={isSubmittingName} />
                      </FormControl>
                      <Button type="submit" disabled={isSubmittingName || nameForm.getValues('name') === user.name} className="w-auto shrink-0">
                        {isSubmittingName ? <LoadingSpinner size={18} /> : <Save size={18} />}
                        <span className="ml-2 hidden sm:inline">Save Name</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <Separator />

          {/* Email Form */}
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-3">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input type="email" {...field} placeholder="your@email.com" disabled={isSubmittingEmail} />
                      </FormControl>
                       <Button type="submit" disabled={isSubmittingEmail || emailForm.getValues('email') === user.email} className="w-auto shrink-0">
                        {isSubmittingEmail ? <LoadingSpinner size={18} /> : <Save size={18} />}
                         <span className="ml-2 hidden sm:inline">Update Email</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
           <div className="space-y-1 p-3 border rounded-md bg-muted/30 text-sm">
            <p className="font-medium text-muted-foreground">Role: <span className="text-foreground capitalize">{user.role}</span></p>
            {user.createdAt && (
              <p className="font-medium text-muted-foreground">Joined: <span className="text-foreground">
                  <ClientSideFormattedDate isoDateString={user.createdAt.toString()} formatString="PPP" /></span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <KeyRound size={22} className="mr-2 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="Enter your current password" disabled={isSubmittingPassword} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="Enter new password (min. 6 characters)" disabled={isSubmittingPassword} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="Confirm new password" disabled={isSubmittingPassword} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingPassword} className="w-full sm:w-auto">
                {isSubmittingPassword ? <LoadingSpinner size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

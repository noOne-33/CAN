
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SocialLinks } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save, Loader2, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useState, useEffect, useCallback } from 'react';

const socialLinksSchema = z.object({
  facebook: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')),
  instagram: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')),
  twitter: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')),
  youtube: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')),
});

type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

export default function AdminSocialLinksClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SocialLinksFormData>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
    },
  });

  const fetchSocialLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/social-links');
      if (!response.ok) throw new Error('Failed to fetch social links');
      const data: SocialLinks = await response.json();
      form.reset({
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
        youtube: data.youtube || '',
      });
    } catch (error) {
      toast({ title: 'Error Fetching Links', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  const onSubmit: SubmitHandler<SocialLinksFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update links');
      toast({ title: 'Social Links Updated', description: 'Your links have been saved successfully.' });
    } catch (error) {
      toast({ title: 'Error Updating Links', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading social link settings..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Facebook size={16} className="mr-2" /> Facebook URL</FormLabel>
              <FormControl><Input placeholder="https://facebook.com/your-page" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Instagram size={16} className="mr-2" /> Instagram URL</FormLabel>
              <FormControl><Input placeholder="https://instagram.com/your-profile" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="twitter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Twitter size={16} className="mr-2" /> Twitter (X) URL</FormLabel>
              <FormControl><Input placeholder="https://twitter.com/your-handle" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="youtube"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Youtube size={16} className="mr-2" /> YouTube URL</FormLabel>
              <FormControl><Input placeholder="https://youtube.com/your-channel" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

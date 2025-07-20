
'use client';

import { useState, useEffect, useRef } from 'react';
import type { FeaturedBanner } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Image from 'next/image';

export default function AdminFeaturedBannerClient() {
  const [banner, setBanner] = useState<Partial<FeaturedBanner>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBanner() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/featured-banner');
        if (!response.ok) throw new Error('Failed to fetch banner data');
        const data: FeaturedBanner = await response.json();
        setBanner(data);
        setImagePreview(data.imageUrl || null);
      } catch (error) {
        toast({ title: 'Error Fetching Banner', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchBanner();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBanner(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: 'Uploading Image...', description: 'Please wait.' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-image', { method: 'POST', body: formData });
      const result = await response.json();
      if (response.ok && result.filename) {
        const retrievalPath = `/api/images/categories/${result.filename}`; // Assuming same bucket
        setBanner(prev => ({ ...prev, imageUrl: retrievalPath }));
        setImagePreview(retrievalPath);
        toast({ title: 'Image Uploaded', description: `Path: ${retrievalPath}` });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast({ title: 'Upload Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!banner.title || !banner.subtitle || !banner.imageUrl || !banner.buttonText || !banner.buttonLink) {
        toast({ title: 'All fields are required', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/featured-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update banner');
      
      toast({ title: 'Banner Updated', description: 'The exclusive deals section has been updated successfully.' });
    } catch (error) {
      toast({ title: 'Error Updating Banner', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading banner settings..."/>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <ImageIcon size={22} className="mr-2 text-primary" />
          Eid Exclusive Banner
        </CardTitle>
        <CardDescription>
          Manage the content and image for the exclusive deals banner on the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={banner.title || ''} onChange={handleInputChange} placeholder="e.g., Exclusive Deals!" disabled={isSubmitting || isUploading}/>
            </div>
             <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input id="buttonText" name="buttonText" value={banner.buttonText || ''} onChange={handleInputChange} placeholder="e.g., Shop Now" disabled={isSubmitting || isUploading}/>
            </div>
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle / Description</Label>
            <Textarea id="subtitle" name="subtitle" value={banner.subtitle || ''} onChange={handleInputChange} placeholder="e.g., Grab a chance to buy..." disabled={isSubmitting || isUploading}/>
          </div>
          <div>
            <Label htmlFor="buttonLink">Button Link</Label>
            <Input id="buttonLink" name="buttonLink" value={banner.buttonLink || ''} onChange={handleInputChange} placeholder="e.g., /shop?filter=deals" disabled={isSubmitting || isUploading}/>
          </div>
          <div>
            <Label htmlFor="imageUrl">Image Path/URL</Label>
            <div className="flex gap-2 items-center">
              <Input id="imageUrl" name="imageUrl" value={banner.imageUrl || ''} 
                onChange={(e) => {
                    setBanner(prev => ({ ...prev, imageUrl: e.target.value }));
                    setImagePreview(e.target.value);
                }} 
                placeholder="/api/images/... or https://..." 
                className="flex-grow"
                disabled={isSubmitting || isUploading}
              />
              <input type="file" ref={fileInputRef} onChange={handleFileSelectAndUpload} style={{ display: 'none' }} accept="image/*" disabled={isSubmitting || isUploading}/>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || isUploading}>
                {isUploading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <UploadCloud size={16} className="mr-1"/>} Upload
              </Button>
            </div>
            {imagePreview && (
              <div className="mt-2 p-2 border rounded-md inline-block">
                <Image src={imagePreview} alt="Preview" width={200} height={150} className="rounded object-cover aspect-video" data-ai-hint={banner.aiHint || "deals banner preview"}/>
                <p className="text-xs text-muted-foreground mt-1 text-center">Preview</p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="aiHint">AI Hint for Image (Optional)</Label>
            <Input id="aiHint" name="aiHint" value={banner.aiHint || ''} onChange={handleInputChange} placeholder="e.g., clothing store interior" disabled={isSubmitting || isUploading}/>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2"/>}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

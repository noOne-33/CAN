'use client';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { HeroSlide } from '@/types';
import {
  Edit,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminHeroSliderClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<Partial<HeroSlide>>({});
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const fetchSlides = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/hero-slides');
      if (!response.ok) throw new Error('Failed to fetch slides');
      const data: HeroSlide[] = await response.json();
      setSlides(
        data
          .map((s) => ({ ...s, id: s._id?.toString() }))
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      );
    } catch (error) {
      toast({
        title: 'Error Fetching Slides',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleFileSelectAndUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: 'Uploading Image...', description: 'Please wait.' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.filename) {
        const retrievalPath = `/api/images/categories/${result.filename}`;
        setCurrentSlide((prev) => ({ ...prev, imageUrl: retrievalPath }));
        setImagePreview(retrievalPath);
        toast({
          title: 'Image Uploaded',
          description: `Path: ${retrievalPath}`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSlide.imageUrl) {
      toast({
        title: 'Image Required',
        description: 'Please upload or provide an image URL.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const method = editingSlideId ? 'PUT' : 'POST';
    const endpoint = editingSlideId
      ? `/api/admin/hero-slides/${editingSlideId}`
      : '/api/admin/hero-slides';

    const payload = {
      ...currentSlide,
      displayOrder: Number(currentSlide.displayOrder) || 0,
      isActive:
        currentSlide.isActive === undefined ? true : currentSlide.isActive,
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message ||
            `Failed to ${editingSlideId ? 'update' : 'add'} slide`
        );

      toast({
        title: `Slide ${editingSlideId ? 'Updated' : 'Added'}`,
        description: result.title || 'Operation successful.',
      });
      setIsFormModalOpen(false);
      fetchSlides();
    } catch (error) {
      toast({
        title: `Error ${editingSlideId ? 'Updating' : 'Adding'} Slide`,
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingSlideId(null);
    setCurrentSlide({
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      displayOrder:
        slides.length > 0
          ? Math.max(...slides.map((s) => s.displayOrder || 0)) + 1
          : 0,
      isActive: true,
      aiHint: '',
    });
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlideId(slide.id!);
    setCurrentSlide({ ...slide });
    setImagePreview(slide.imageUrl || null);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (slide: HeroSlide) => {
    setSlideToDelete(slide);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!slideToDelete || !slideToDelete.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/hero-slides/${slideToDelete.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete slide');
      }
      toast({
        title: 'Slide Deleted',
        description: `Slide "${
          slideToDelete.title || slideToDelete.id
        }" deleted.`,
      });
      fetchSlides();
    } catch (error) {
      toast({
        title: 'Error Deleting Slide',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setSlideToDelete(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentSlide((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading && slides.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CAN Slider Management</CardTitle>
          <CardDescription>Loading slides...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Hero Slides</h2>
        <Button onClick={openAddModal} size="sm">
          <PlusCircle size={16} className="mr-2" />
          Add New Slide
        </Button>
      </div>

      {slides.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide) => (
                <TableRow key={slide.id}>
                  <TableCell>
                    <Image
                      src={slide.imageUrl || 'https://placehold.co/60x40.png'}
                      alt={slide.title || 'Slide image'}
                      width={60}
                      height={40}
                      className="rounded object-cover aspect-video"
                      data-ai-hint={slide.aiHint || 'hero image'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {slide.title || '(No title)'}
                  </TableCell>
                  <TableCell>{slide.displayOrder}</TableCell>
                  <TableCell>
                    <Badge
                      variant={slide.isActive ? 'default' : 'outline'}
                      className={
                        slide.isActive
                          ? 'bg-green-500/20 text-green-700 border-green-500/50'
                          : 'bg-red-500/20 text-red-700 border-red-500/50'
                      }
                    >
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditModal(slide)}
                      disabled={isSubmitting}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClick(slide)}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        !isLoading && (
          <p className="text-muted-foreground text-center py-8">
            No slides found. Add some to get started!
          </p>
        )
      )}

      <Dialog
        open={isFormModalOpen}
        onOpenChange={(open) => {
          if (isSubmitting || isUploading) return;
          setIsFormModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlideId ? 'Edit Slide' : 'Add New Slide'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the hero slide.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                name="title"
                value={currentSlide.title || ''}
                onChange={handleInputChange}
                placeholder="e.g., Summer Collection Out Now!"
                disabled={isSubmitting || isUploading}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Textarea
                id="subtitle"
                name="subtitle"
                value={currentSlide.subtitle || ''}
                onChange={handleInputChange}
                placeholder="e.g., Fresh styles to brighten your season."
                disabled={isSubmitting || isUploading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buttonText">Button Text (Optional)</Label>
                <Input
                  id="buttonText"
                  name="buttonText"
                  value={currentSlide.buttonText || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Shop Now"
                  disabled={isSubmitting || isUploading}
                />
              </div>
              <div>
                <Label htmlFor="buttonLink">Button Link (Optional)</Label>
                <Input
                  id="buttonLink"
                  name="buttonLink"
                  value={currentSlide.buttonLink || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., /shop/summer-collection"
                  disabled={isSubmitting || isUploading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="imageUrl">Image Path/URL</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={currentSlide.imageUrl || ''}
                  onChange={(e) => {
                    handleInputChange(e);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="/api/images/... or https://..."
                  className="flex-grow"
                  disabled={isSubmitting || isUploading}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelectAndUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                  disabled={isSubmitting || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploading}
                >
                  {isUploading ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <UploadCloud size={16} className="mr-1" />
                  )}{' '}
                  Upload
                </Button>
              </div>
              {imagePreview && (
                <div className="mt-2 p-2 border rounded-md inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={150}
                    height={84}
                    className="rounded object-cover aspect-video"
                    data-ai-hint={currentSlide.aiHint || 'slide preview'}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Preview
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="aiHint">AI Hint for Image (Optional)</Label>
              <Input
                id="aiHint"
                name="aiHint"
                value={currentSlide.aiHint || ''}
                onChange={handleInputChange}
                placeholder="e.g., fashion model beach"
                disabled={isSubmitting || isUploading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  value={currentSlide.displayOrder || 0}
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isSubmitting || isUploading}
                />
              </div>
              <div className="flex items-center space-x-2 pt-3">
                <Switch
                  id="isActive"
                  name="isActive"
                  checked={
                    currentSlide.isActive === undefined
                      ? true
                      : currentSlide.isActive
                  }
                  onCheckedChange={(checked) =>
                    setCurrentSlide((prev) => ({ ...prev, isActive: checked }))
                  }
                  disabled={isSubmitting || isUploading}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isUploading}
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading || !currentSlide.imageUrl}
              >
                {isSubmitting || isUploading ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {editingSlideId ? 'Save Changes' : 'Add Slide'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (isSubmitting) return;
          setIsDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the slide titled &quot;
              {slideToDelete?.title || slideToDelete?.id}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                'Delete Slide'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import type { Category } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Edit, Tags, RefreshCw, Save, X, UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Label } from '@/components/ui/label';

interface AdminCategoryClientProps {
  initialCategories: Category[];
}

export default function AdminCategoryClient({ initialCategories }: AdminCategoryClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories.map(c => ({...c, id: c._id?.toString() })));
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');
  const [newCategoryAiHint, setNewCategoryAiHint] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryImageUrl, setEditingCategoryImageUrl] = useState('');
  const [editingCategoryAiHint, setEditingCategoryAiHint] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [imagePreviewKey, setImagePreviewKey] = useState<string>(Date.now().toString());


  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setCategories(initialCategories.map(c => ({...c, id: c._id?.toString(), productCount: c.productCount || 0 })));
  }, [initialCategories]);

  const handleRefresh = () => {
    router.refresh(); 
    toast({ title: "Categories Refreshed", description: "The list of categories has been updated." });
  };

  const handleFileSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading Image...', description: 'Please wait while the image is being uploaded.' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log("[AdminCategoryClient] GridFS upload API response:", result);

      if (response.ok && result.filename) {
        const retrievalPath = `/api/images/categories/${result.filename}`;
        if (mode === 'add') {
          setNewCategoryImageUrl(retrievalPath);
        } else {
          setEditingCategoryImageUrl(retrievalPath);
        }
        setImagePreviewKey(Date.now().toString());
        toast({ title: 'Image Uploaded to GridFS', description: `Image path set to: ${retrievalPath}. Save the category to apply.` });
      } else {
        toast({ title: 'Upload Failed', description: result.message || 'Could not process image via GridFS.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Upload Error', description: 'An error occurred during image processing with GridFS.', variant: 'destructive' });
      console.error("GridFS Upload error:", error);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = ''; 
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategoryName.trim(),
          imageUrl: newCategoryImageUrl.trim(),
          aiHint: newCategoryAiHint.trim()
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Category Added", description: `"${result.name}" has been successfully added.` });
        setCategories(prev => [...prev, { ...result, id: result._id.toString(), productCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryName('');
        setNewCategoryImageUrl('');
        setNewCategoryAiHint('');
        setImagePreviewKey(Date.now().toString()); 
      } else {
        toast({ title: "Error Adding Category", description: result.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to add category. Please check your connection.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category);
    setEditingCategoryName(category.name);
    setEditingCategoryImageUrl(category.imageUrl || '');
    setEditingCategoryAiHint(category.aiHint || '');
    setImagePreviewKey(Date.now().toString());
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!categoryToEdit || !categoryToEdit.id || !editingCategoryName.trim()) {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    if (editingCategoryName.trim() === categoryToEdit.name && 
        (editingCategoryImageUrl.trim() || '') === (categoryToEdit.imageUrl || '') &&
        (editingCategoryAiHint.trim() || '') === (categoryToEdit.aiHint || '')) {
      toast({ title: "No Changes", description: "The category details are the same.", variant: "default" });
      setIsEditModalOpen(false);
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryToEdit.id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editingCategoryName.trim(),
          imageUrl: editingCategoryImageUrl.trim(),
          aiHint: editingCategoryAiHint.trim()
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Category Updated", description: `Category "${result.name}" updated.` });
        setCategories(prev => prev.map(c => c.id === result.id ? { ...result, id: result._id.toString(), productCount: c.productCount } : c).sort((a, b) => a.name.localeCompare(b.name)));
        setIsEditModalOpen(false);
      } else {
        toast({ title: "Error Updating Category", description: result.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to update category.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || !categoryToDelete.id) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id.toString()}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        toast({ title: "Category Deleted", description: `"${categoryToDelete.name}" has been successfully deleted.` });
      } else {
        const errorData = await response.json();
        toast({ title: "Error Deleting Category", description: errorData.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Deleting Category", description: "An unexpected network error occurred.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-2xl">
            <Tags size={26} className="mr-2 text-primary" />
            Manage Categories
          </CardTitle>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isAdding || isDeleting || isUpdating || isUploading}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>
        <CardDescription>Add, view, edit, and remove product categories. Images can be uploaded to GridFS or specified by URL.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleAddCategory} className="space-y-4 mb-6 p-4 border rounded-md">
          <h4 className="text-md font-semibold">Add New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="md:col-span-1">
              <Label htmlFor="newCategoryName" className="block text-sm font-medium text-foreground mb-1">Name</Label>
              <Input
                id="newCategoryName" type="text" placeholder="e.g., Footwear"
                value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isAdding || isUploading}
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="newCategoryAiHint" className="block text-sm font-medium text-foreground mb-1">AI Hint (Image)</Label>
              <Input
                id="newCategoryAiHint" type="text" placeholder="e.g., sports shoes"
                value={newCategoryAiHint} onChange={(e) => setNewCategoryAiHint(e.target.value)}
                disabled={isAdding || isUploading}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="newCategoryImageUrl" className="block text-sm font-medium text-foreground mb-1">Image Path/URL</Label>
            <div className="flex gap-2 items-center">
                <Input
                    id="newCategoryImageUrl" type="text" placeholder="/api/images/categories/yourfile.png or https://..."
                    value={newCategoryImageUrl} 
                    onChange={(e) => {
                        setNewCategoryImageUrl(e.target.value);
                        setImagePreviewKey(Date.now().toString());
                    }}
                    disabled={isAdding || isUploading}
                    className="flex-grow"
                />
                <input 
                    type="file" 
                    ref={addFileInputRef} 
                    onChange={(e) => handleFileSelectAndUpload(e, 'add')} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    disabled={isAdding || isUploading}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addFileInputRef.current?.click()} 
                    disabled={isAdding || isUploading}
                >
                    {isUploading ? <LoadingSpinner size={16} className="mr-1" /> : <UploadCloud size={16} className="mr-1"/>}
                    Upload
                </Button>
            </div>
            {newCategoryImageUrl && (
              <div className="mt-2 p-2 border rounded-md inline-block">
                <Image
                  key={imagePreviewKey}
                  src={newCategoryImageUrl}
                  alt="New category preview"
                  width={100}
                  height={100}
                  className="rounded object-cover aspect-square"
                  data-ai-hint={newCategoryAiHint || "category preview"}
                  onError={(e) => {
                      console.error("Error loading new category preview image:", newCategoryImageUrl, e);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">Preview</p>
              </div>
            )}
          </div>
          <Button type="submit" disabled={isAdding || isUploading || !newCategoryName.trim()} className="w-full md:w-auto">
            {(isAdding || isUploading) ? <LoadingSpinner size={18} className="mr-2"/> : <PlusCircle size={18} className="mr-2" />}
            Add Category
          </Button>
        </form>

        <h3 className="text-lg font-semibold mb-3">Existing Categories</h3>
        {categories.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>AI Hint</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-right w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id?.toString()}>
                    <TableCell>
                      <Image
                        src={category.imageUrl || 'https://placehold.co/60x60.png'}
                        alt={category.name}
                        data-ai-hint={category.aiHint || category.name.toLowerCase()}
                        width={60}
                        height={60}
                        className="rounded object-cover aspect-square"
                        onError={(e) => console.error(`Error loading image for category ${category.name}: ${category.imageUrl}`, e)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{category.aiHint}</TableCell>
                    <TableCell className="text-center">{category.productCount || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => handleEditClick(category)}
                        disabled={isDeleting || isAdding || isUpdating || isUploading}
                      >
                        <Edit size={16} /> <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="destructive" size="icon" className="h-8 w-8"
                        onClick={() => handleDeleteClick(category)}
                        disabled={(isDeleting && categoryToDelete?.id === category.id) || isAdding || isUpdating || isUploading}
                      >
                        {(isDeleting && categoryToDelete?.id === category.id) ? <LoadingSpinner size={16} /> : <Trash2 size={16} />}
                         <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No categories found. Add some to get started!</p>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category
                &quot;{categoryToDelete?.name}&quot;. Products in this category will NOT be automatically reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting || isUploading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting || isUploading}>
                {isDeleting ? <LoadingSpinner size={18} className="mr-2"/> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          if (isUpdating || isUploading) return;
          setIsEditModalOpen(open);
          if (!open) setCategoryToEdit(null);
        }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Make changes to the category details. Image paths can be from GridFS or a direct URL.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="editingCategoryName">Name</Label>
                <Input id="editingCategoryName" value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)} disabled={isUpdating || isUploading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editingCategoryImageUrl">Image Path/URL</Label>
                 <div className="flex gap-2 items-center">
                    <Input id="editingCategoryImageUrl" value={editingCategoryImageUrl}
                        onChange={(e) => {
                            setEditingCategoryImageUrl(e.target.value);
                            setImagePreviewKey(Date.now().toString());
                        }} 
                        disabled={isUpdating || isUploading}
                        placeholder="/api/images/categories/yourfile.png or https://..."
                        className="flex-grow"
                    />
                    <input 
                        type="file" 
                        ref={editFileInputRef} 
                        onChange={(e) => handleFileSelectAndUpload(e, 'edit')} 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        disabled={isUpdating || isUploading}
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => editFileInputRef.current?.click()} 
                        disabled={isUpdating || isUploading}
                    >
                        {isUploading ? <LoadingSpinner size={16} className="mr-1" /> : <UploadCloud size={16} className="mr-1"/>}
                        Upload
                    </Button>
                </div>
                {editingCategoryImageUrl && (
                  <div className="mt-2 p-2 border rounded-md inline-block">
                    <Image
                      key={imagePreviewKey}
                      src={editingCategoryImageUrl}
                      alt="Editing category preview"
                      width={100}
                      height={100}
                      className="rounded object-cover aspect-square"
                      data-ai-hint={editingCategoryAiHint || "category preview"}
                       onError={(e) => {
                          console.error("Error loading editing category preview image:", editingCategoryImageUrl, e);
                       }}
                    />
                     <p className="text-xs text-muted-foreground mt-1 text-center">Preview</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="editingCategoryAiHint">AI Hint (for image)</Label>
                <Input id="editingCategoryAiHint" value={editingCategoryAiHint}
                  onChange={(e) => setEditingCategoryAiHint(e.target.value)} disabled={isUpdating || isUploading}
                  placeholder="e.g., stylish handbag"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdating || isUploading}><X size={16} className="mr-2" /> Cancel</Button></DialogClose>
              <Button type="button" onClick={handleUpdateCategory} 
                disabled={isUpdating || isUploading || !editingCategoryName.trim() || (
                    editingCategoryName.trim() === categoryToEdit?.name &&
                    (editingCategoryImageUrl.trim() || '') === (categoryToEdit?.imageUrl || '') &&
                    (editingCategoryAiHint.trim() || '') === (categoryToEdit?.aiHint || '')
                )}>
                {(isUpdating || isUploading) ? <LoadingSpinner size={18} className="mr-2"/> : <Save size={16} className="mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

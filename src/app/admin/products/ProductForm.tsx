
'use client';

import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product, ProductColor, ProductSpecification } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, Save, X, UploadCloud, Percent, Tag, ListPlus } from 'lucide-react'; // Added ListPlus
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const colorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  image: z.string().url({ message: "Please enter a valid URL for color image." }).optional().or(z.literal('')),
  aiHint: z.string().optional(),
});

const sizeSchema = z.object({
  value: z.string().min(1, "Size value cannot be empty."),
});

const specificationSchema = z.object({
  name: z.string().min(1, "Specification name cannot be empty."),
  value: z.string().min(1, "Specification value cannot be empty."),
});


const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return url.startsWith('/api/');
  }
};

const productFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0.01, { message: "Price must be greater than 0." })
  ),
  discountType: z.enum(['percentage', 'fixed'], { invalid_type_error: "Select a valid discount type or None." }).optional(),
  discountValue: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val) : val)),
    z.number().min(0, "Discount value must be non-negative.").optional()
  ),
  category: z.string().min(1, { message: "Category is required." }),
  imageUrls: z.array(z.object({
    url: z.string()
           .min(1, "Image path/URL cannot be empty.")
           .refine(isValidImageUrl, { message: "Must be a valid URL (http/https) or an API path (/api/...)." })
  }))
  .min(1, "At least one image is required (upload or provide a path/URL).")
  .refine(items => items.every(item => item.url && item.url.trim() !== ''), {
    message: "All image slots must have a valid path/URL. Remove empty slots or provide paths/URLs.",
    path: ["imageUrls"],
  }),
  colors: z.array(colorSchema).min(1, "At least one color is required."),
  sizes: z.array(sizeSchema).optional(), 
  specifications: z.array(specificationSchema).optional(), // Added custom specifications
  stock: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0, { message: "Stock must be a non-negative integer." })
  ),
  aiHint: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.discountType && (data.discountValue === undefined || data.discountValue === null || data.discountValue <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount value is required and must be positive when a discount type is selected.",
      path: ["discountValue"],
    });
  }
  if (!data.discountType && data.discountValue && data.discountValue > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a discount type if providing a discount value.",
      path: ["discountType"],
    });
  }
  if (data.discountType === 'percentage') {
    if (data.discountValue && (data.discountValue < 1 || data.discountValue > 99)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage discount must be between 1 and 99.",
        path: ["discountValue"],
      });
    }
  }
  if (data.discountType === 'fixed') {
    if (data.discountValue && data.discountValue >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed discount must be less than the regular price.",
        path: ["discountValue"],
      });
    }
  }
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  mode: 'add' | 'edit';
  initialData?: Product;
  availableCategories: string[];
  onProductAdded?: (newProduct: Product) => void;
  onProductUpdated?: (updatedProduct: Product) => void;
  onOperationCancel?: () => void;
}

const defaultValues: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  discountType: undefined,
  discountValue: undefined,
  category: '',
  imageUrls: [{ url: '' }],
  colors: [{ name: 'Default', hex: '#000000', image: '', aiHint: '' }],
  sizes: [{ value: '' }], 
  specifications: [], // Default empty array for specifications
  stock: 0,
  aiHint: '',
};

export default function ProductForm({ mode, initialData, availableCategories, onProductAdded, onProductUpdated, onOperationCancel }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewKeys, setImagePreviewKeys] = useState<string[]>([]);

  const imageFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
          discountType: initialData.discountType || undefined,
          discountValue: initialData.discountValue === null || initialData.discountValue === 0 ? undefined : initialData.discountValue,
          category: initialData.category,
          imageUrls: initialData.imageUrls?.map(url => ({ url: url || '' })) || [{ url: '' }],
          colors: initialData.colors?.length > 0 ? initialData.colors.map(c => ({...c, image: c.image || ''})) : defaultValues.colors,
          sizes: initialData.sizes?.length > 0 ? initialData.sizes.map(s => ({ value: s })) : [{value: ''}],
          specifications: initialData.specifications?.length > 0 ? initialData.specifications : [],
          stock: initialData.stock,
          aiHint: initialData.aiHint || '',
        }
      : defaultValues,
  });

  const { fields: imageUrlFields, append: appendImageUrl, remove: removeImageUrl } = useFieldArray({
    control: form.control,
    name: "imageUrls",
  });

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  const { fields: specificationFields, append: appendSpecification, remove: removeSpecification } = useFieldArray({
    control: form.control,
    name: "specifications",
  });


  const discountType = form.watch("discountType");

  useEffect(() => {
    if (initialData?.imageUrls) {
      setImagePreviewKeys(initialData.imageUrls.map((_, i) => `${i}-${Date.now()}`));
    } else {
      setImagePreviewKeys(imageUrlFields.map((_, i) => `${i}-${Date.now()}`));
    }
  }, [initialData, imageUrlFields.length]);


  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    toast({ title: 'Uploading Product Image...', description: 'Please wait.' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.filename) {
        const retrievalPath = `/api/images/categories/${result.filename}`; // Assuming same bucket for now
        form.setValue(`imageUrls.${index}.url`, retrievalPath, { shouldValidate: true });
        setImagePreviewKeys(prev => {
          const newKeys = [...prev];
          newKeys[index] = `${index}-${Date.now()}`;
          return newKeys;
        });
        toast({ title: 'Product Image Uploaded to GridFS', description: `Image path set to: ${retrievalPath}. Save product to apply.` });
      } else {
        toast({ title: 'Upload Failed', description: result.message || 'Could not process image via GridFS.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Upload Error', description: 'An error occurred during image processing with GridFS.', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
      if (event.target) event.target.value = '';
    }
  };


  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    const apiEndpoint = mode === 'add'
      ? '/api/admin/products'
      : `/api/admin/products/${initialData?._id}`;
    const method = mode === 'add' ? 'POST' : 'PUT';

    const validImageUrls = data.imageUrls.filter(img => img.url && img.url.trim() !== '').map(img => img.url);
    
    if (data.imageUrls.some(img => !isValidImageUrl(img.url))) {
        toast({
            title: "Invalid Image Path/URL",
            description: "All image slots must have a valid URL (e.g., http://...) or an API path (e.g., /api/...). Remove empty slots or provide valid paths/URLs.",
            variant: "destructive",
        });
        return;
    }

    const processedColors = data.colors.map(color => ({
        ...color,
        image: color.image || (validImageUrls[0] || ''),
        aiHint: color.aiHint || data.aiHint || data.category,
    }));

    const processedSizes = data.sizes?.filter(s => s.value && s.value.trim() !== '').map(s => s.value.trim().toUpperCase()) || [];
    const processedSpecifications = data.specifications?.filter(spec => spec.name.trim() && spec.value.trim()) || [];


    const discountValueForPayload = (data.discountValue === undefined || data.discountValue === 0 || !data.discountType) ? null : data.discountValue;
    const discountTypeForPayload = discountValueForPayload === null ? null : data.discountType;


    const payload = {
        ...data,
        imageUrls: validImageUrls,
        colors: processedColors,
        sizes: processedSizes,
        specifications: processedSpecifications, // Add processed specifications
        aiHint: data.aiHint || data.category,
        discountType: discountTypeForPayload,
        discountValue: discountValueForPayload,
    };
    
    delete (payload as any).price; // Ensure price is handled by the $set correctly with its original value
    const finalPayload: any = { ...payload, price: data.price };


    form.clearErrors();

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (response.ok) {
        const resultProduct = await response.json();
        toast({
          title: `Product ${mode === 'add' ? 'Added' : 'Updated'}`,
          description: `"${resultProduct.name}" has been successfully ${mode === 'add' ? 'added' : 'updated'}.`,
        });
        if (mode === 'add') {
          onProductAdded?.(resultProduct);
        } else {
          onProductUpdated?.(resultProduct);
          router.push('/admin/products');
        }
        if (onOperationCancel) onOperationCancel();

      } else {
        const errorData = await response.json();
        toast({
          title: `Error ${mode === 'add' ? 'Adding' : 'Updating'} Product`,
          description: errorData.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: `Failed to ${mode === 'add' ? 'add' : 'update'} product. Please check your connection.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Summer Breeze Dress" {...field} disabled={isUploadingImage || form.formState.isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploadingImage || form.formState.isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(availableCategories || []).map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed product description..." {...field} rows={4} disabled={isUploadingImage || form.formState.isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="p-4 pt-2">
         <Label className="text-lg font-semibold mb-3 block">Pricing & Stock</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regular Price (৳)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 1299.99" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isUploadingImage || form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} disabled={isUploadingImage || form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>
        
        <Card className="p-4 pt-2">
          <Label className="text-lg font-semibold mb-1 block">Discount (Optional)</Label>
           <FormDescription className="mb-3">Set a percentage or fixed amount discount.</FormDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? undefined : value);
                      if (value === "none") {
                        form.setValue("discountValue", undefined, { shouldValidate: true });
                      }
                    }} 
                    value={field.value || "none"}
                    disabled={isUploadingImage || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Discount Value {discountType === 'percentage' ? '(%)' : discountType === 'fixed' ? '(৳)' : ''}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step={discountType === 'percentage' ? "1" : "0.01"} 
                      placeholder={
                        discountType === 'percentage' ? "e.g., 20 for 20%" : 
                        discountType === 'fixed' ? "e.g., 100 for ৳100 off" : 
                        "Set discount type first"
                      }
                      {...field} 
                      value={field.value === undefined || field.value === null ? '' : field.value}
                      onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : parseFloat(val));
                      }}
                      disabled={!discountType || isUploadingImage || form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>


        <FormField
            control={form.control}
            name="aiHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Hint (for main product/images)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 'elegant dress' or 'mens casual shirt'" {...field} disabled={isUploadingImage || form.formState.isSubmitting}/>
                </FormControl>
                <FormDescription>Optional. Keywords for AI image generation if product images are missing or for related content.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        <Card className="p-4 pt-2">
          <Label className="text-lg font-semibold">Product Images</Label>
           <FormDescription className="mb-2">Add at least one image. Enter a valid path/URL or upload a file. The first will be primary.</FormDescription>
           <FormField
              control={form.control}
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          {imageUrlFields.map((field, index) => (
            <div key={field.id} className="space-y-3 mb-4 pb-4 border-b last:border-b-0 last:pb-0">
              <FormField
                control={form.control}
                name={`imageUrls.${index}.url`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel htmlFor={`imageUrls.${index}.url`} className="text-xs">Image Path/URL {index + 1}</FormLabel>
                     <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            id={`imageUrls.${index}.url`}
                            placeholder="/api/... or https://..."
                            {...itemField}
                            onChange={(e) => {
                              itemField.onChange(e);
                              setImagePreviewKeys(prev => {
                                const newKeys = [...prev];
                                newKeys[index] = `${index}-${Date.now()}`;
                                return newKeys;
                              });
                            }}
                            disabled={isUploadingImage || form.formState.isSubmitting}
                            className="flex-grow"
                          />
                        </FormControl>
                        <input
                            type="file"
                            ref={el => imageFileRefs.current[index] = el}
                            onChange={(e) => handleProductImageUpload(e, index)}
                            style={{ display: 'none' }}
                            accept="image/*"
                            disabled={isUploadingImage || form.formState.isSubmitting}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => imageFileRefs.current[index]?.click()}
                            disabled={isUploadingImage || form.formState.isSubmitting}
                            className="h-10"
                        >
                            {isUploadingImage ? <LoadingSpinner size={16} className="mr-1" /> : <UploadCloud size={16} className="mr-1"/>}
                            Upload
                        </Button>
                        {imageUrlFields.length > 1 && (
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeImageUrl(index)} className="h-10 w-10 flex-shrink-0" disabled={isUploadingImage || form.formState.isSubmitting}>
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch(`imageUrls.${index}.url`) && isValidImageUrl(form.watch(`imageUrls.${index}.url`)) && (
                <div className="mt-2 p-2 border rounded-md inline-block bg-muted/30">
                  <Image
                    key={imagePreviewKeys[index] || `${index}-${Date.now()}`}
                    src={form.watch(`imageUrls.${index}.url`)!}
                    alt={`Product image ${index + 1} preview`}
                    width={100}
                    height={100}
                    className="rounded object-cover aspect-square"
                    data-ai-hint={form.watch('aiHint') || "product image"}
                    onError={(e) => {
                        console.error("Error loading product image preview:", form.watch(`imageUrls.${index}.url`), e);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">Preview</p>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              appendImageUrl({ url: '' });
              setImagePreviewKeys(prev => [...prev, `${imageUrlFields.length}-${Date.now()}`]);
            }}
            className="mt-2"
            disabled={isUploadingImage || form.formState.isSubmitting}
          >
            <PlusCircle size={16} className="mr-2" /> Add Another Image Slot
          </Button>
        </Card>

        <Card className="p-4 pt-2">
          <Label className="text-lg font-semibold">Color Variants</Label>
          <FormDescription className="mb-2">Define color options. The main product image can be used as fallback if a color-specific image is not provided.</FormDescription>
          {colorFields.map((field, index) => (
            <Card key={field.id} className="mb-4 p-3 space-y-3 relative bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`colors.${index}.name`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Color Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Ocean Blue" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`colors.${index}.hex`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Hex Code</FormLabel>
                       <div className="flex items-center gap-2">
                        <FormControl><Input placeholder="#ADD8E6" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} /></FormControl>
                        <div className="w-8 h-8 rounded border" style={{ backgroundColor: form.watch(`colors.${index}.hex`) || '#transparent' }} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name={`colors.${index}.image`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Color-specific Image URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://example.com/color-image.png" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} /></FormControl>
                    <FormDescription>If blank, first main product image will be used.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`colors.${index}.aiHint`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Color-specific AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 'blue t-shirt model'" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {colorFields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => removeColor(index)} disabled={isUploadingImage || form.formState.isSubmitting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendColor({ name: '', hex: '#000000', image: '', aiHint: '' })}
            className="mt-2"
            disabled={isUploadingImage || form.formState.isSubmitting}
          >
            <PlusCircle size={16} className="mr-2" /> Add Color Variant
          </Button>
        </Card>

        <Card className="p-4 pt-2">
          <Label className="text-lg font-semibold">Available Sizes</Label>
          <FormDescription className="mb-2">Add product sizes (e.g., S, M, L, XL, 32, 40). Clear an input to remove a size.</FormDescription>
          {sizeFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 mb-3 p-3 border rounded-md bg-muted/20">
              <FormField
                control={form.control}
                name={`sizes.${index}.value`}
                render={({ field: itemField }) => (
                  <FormItem className="flex-grow">
                    <FormLabel htmlFor={`sizes.${index}.value`} className="sr-only">Size {index + 1}</FormLabel>
                    <FormControl>
                      <Input 
                        id={`sizes.${index}.value`}
                        placeholder="e.g., M or 32" 
                        {...itemField} 
                        disabled={isUploadingImage || form.formState.isSubmitting} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                onClick={() => removeSize(index)} 
                disabled={sizeFields.length <=1 && !form.getValues(`sizes.0.value`) || isUploadingImage || form.formState.isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSize({ value: '' })}
            className="mt-2"
            disabled={isUploadingImage || form.formState.isSubmitting}
          >
            <PlusCircle size={16} className="mr-2" /> Add Size
          </Button>
        </Card>

        <Card className="p-4 pt-2">
          <Label className="text-lg font-semibold flex items-center"><ListPlus className="mr-2 h-5 w-5"/>Custom Specifications</Label>
          <FormDescription className="mb-3">Add any other relevant product details (e.g., Material, Origin, Warranty).</FormDescription>
          {specificationFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-3 p-3 border rounded-md bg-muted/20 items-end">
              <FormField
                control={form.control}
                name={`specifications.${index}.name`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Spec. Name {index + 1}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Material" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`specifications.${index}.value`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Spec. Value {index + 1}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cotton" {...itemField} disabled={isUploadingImage || form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecification(index)} className="h-10 w-10 flex-shrink-0" disabled={isUploadingImage || form.formState.isSubmitting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSpecification({ name: '', value: '' })}
            className="mt-2"
            disabled={isUploadingImage || form.formState.isSubmitting}
          >
            <PlusCircle size={16} className="mr-2" /> Add Specification
          </Button>
        </Card>


        <div className="flex justify-end gap-3 pt-4">
          {onOperationCancel && (
            <Button type="button" variant="outline" onClick={onOperationCancel} disabled={isUploadingImage || form.formState.isSubmitting}>
              <X size={18} className="mr-2"/> Cancel
            </Button>
          )}
          <Button type="submit" disabled={isUploadingImage || form.formState.isSubmitting}>
            {(isUploadingImage || form.formState.isSubmitting) ? (
              <LoadingSpinner size={18} className="mr-2"/>
            ) : (
              <Save size={18} className="mr-2"/>
            )}
            {mode === 'add' ? 'Add Product' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

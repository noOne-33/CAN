
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Coupon, CouponDiscountType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, RefreshCw, Search, Edit, Trash2, PlusCircle, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { Badge } from '@/components/ui/badge';

interface AdminCouponClientProps {
  initialCoupons: Coupon[];
}

const couponFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, "Code must be at least 3 characters.").max(50, "Code cannot exceed 50 characters.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: "Discount type is required." }),
  discountValue: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive("Discount value must be positive.")
  ),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
  minPurchaseAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val) : val)),
    z.number().min(0, "Minimum purchase must be non-negative.").optional().nullable()
  ),
  usageLimit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseInt(val, 10) : val)),
    z.number().int().min(0, "Usage limit must be a non-negative integer.").optional().nullable()
  ),
  isActive: z.boolean().default(true),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

export default function AdminCouponClient({ initialCoupons }: AdminCouponClientProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For page-level loading, like refresh
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions and deletions
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All'); 

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
      minPurchaseAmount: undefined,
      usageLimit: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
     setCoupons(initialCoupons.map(c => ({...c, id: c._id?.toString() })));
  }, [initialCoupons]);

  const fetchCouponsAndRefresh = async () => {
    setIsLoading(true);
    try {
      router.refresh(); // This will re-run the server component's data fetching
      // The new initialCoupons prop will trigger the useEffect above to update local state.
      toast({ title: "Coupons Refreshed", description: "The list of coupons has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Could not refresh coupons.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCouponsAndRefresh();
  };

  const handleOpenForm = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      form.reset({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expiryDate: coupon.expiryDate ? parseISO(coupon.expiryDate as string) : new Date(),
        minPurchaseAmount: coupon.minPurchaseAmount === null ? undefined : coupon.minPurchaseAmount,
        usageLimit: coupon.usageLimit === null ? undefined : coupon.usageLimit,
        isActive: coupon.isActive,
      });
    } else {
      form.reset({
        code: '', discountType: 'percentage', discountValue: 0, expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
        minPurchaseAmount: undefined, usageLimit: undefined, isActive: true, id: undefined
      });
    }
    setIsFormModalOpen(true);
  };

  const onSubmit: SubmitHandler<CouponFormData> = async (data) => {
    setIsSubmitting(true);
    const apiEndpoint = editingCoupon?.id ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons';
    const method = editingCoupon?.id ? 'PUT' : 'POST';

    const payload = {
      ...data,
      expiryDate: data.expiryDate.toISOString(), // Ensure date is ISO string for API
      minPurchaseAmount: data.minPurchaseAmount === undefined ? null : data.minPurchaseAmount,
      usageLimit: data.usageLimit === undefined ? null : data.usageLimit,
    };
    delete payload.id; // Don't send 'id' from form in payload, API uses path param for PUT

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        toast({ title: `Coupon ${editingCoupon ? 'Updated' : 'Added'}`, description: `Coupon "${result.code}" has been successfully ${editingCoupon ? 'updated' : 'added'}.` });
        setIsFormModalOpen(false);
        fetchCouponsAndRefresh(); // Refresh the list from the server
      } else {
        toast({ title: `Error ${editingCoupon ? 'Updating' : 'Adding'} Coupon`, description: result.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Network Error", description: `Failed to ${editingCoupon ? 'update' : 'add'} coupon.`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete || !couponToDelete.id) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: "Coupon Deleted", description: `Coupon "${couponToDelete.code}" deleted.` });
        fetchCouponsAndRefresh(); // Refresh list
      } else {
        const errorData = await response.json();
        toast({ title: "Error Deleting Coupon", description: errorData.message || "Could not delete coupon.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to delete coupon.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const searchMatch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
      let statusMatch = true;
      const now = new Date();
      const expiry = new Date(coupon.expiryDate as string);

      if (filterStatus === 'Active') statusMatch = coupon.isActive && expiry > now;
      else if (filterStatus === 'Inactive') statusMatch = !coupon.isActive && expiry > now; // Still not expired but manually set to inactive
      else if (filterStatus === 'Expired') statusMatch = expiry <= now;
      
      return searchMatch && statusMatch;
    }).sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
  }, [coupons, searchTerm, filterStatus]);

  const getCouponStatus = (coupon: Coupon): { text: string; color: string } => {
    const now = new Date();
    const expiry = new Date(coupon.expiryDate as string);
    if (expiry <= now) return { text: 'Expired', color: 'bg-red-500/20 text-red-700 border-red-500/50' };
    if (coupon.isActive) return { text: 'Active', color: 'bg-green-500/20 text-green-700 border-green-500/50' };
    return { text: 'Inactive', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50' };
  };

  let couponTableContent;
  if (isLoading && coupons.length === 0 && !initialCoupons.length) { // Show loading only if truly no data yet
    couponTableContent = (
      <div className="text-center py-12"><LoadingSpinner text="Loading coupons..." /></div>
    );
  } else if (filteredCoupons.length > 0) {
    couponTableContent = (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-center">Usage</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              return (
              <TableRow key={coupon.id?.toString()}>
                <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                <TableCell className="capitalize">{coupon.discountType}</TableCell>
                <TableCell className="text-right">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue.toFixed(2)}`}
                </TableCell>
                <TableCell>
                  <ClientSideFormattedDate isoDateString={coupon.expiryDate as string} formatString="PP" />
                </TableCell>
                <TableCell className="text-center">
                  {coupon.usageCount || 0} / {coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : '∞'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("text-xs", status.color)}>{status.text}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSubmitting}>
                        <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenForm(coupon)} disabled={isSubmitting} className="cursor-pointer">
                        <Edit size={16} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(coupon)} disabled={isSubmitting} className="text-destructive cursor-pointer">
                        <Trash2 size={16} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    );
  } else {
    couponTableContent = (
      <p className="text-muted-foreground text-center py-8">
        {searchTerm || filterStatus !== 'All' ? 'No coupons match your search/filter.' : 'No coupons found. Add some!'}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-72"
            disabled={isLoading || isSubmitting}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading || isSubmitting}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Coupons</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
           <Button onClick={() => handleOpenForm(null)} size="sm" disabled={isLoading || isSubmitting}>
            <PlusCircle size={16} className="mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Add Coupon</span>
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="flex-shrink-0" disabled={isLoading || isSubmitting}>
            {isLoading ? <LoadingSpinner size={16} className="mr-0 sm:mr-2"/> : <RefreshCw size={16} className="mr-0 sm:mr-2" />}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {couponTableContent}

      <Dialog open={isFormModalOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormModalOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update details for this coupon.' : 'Create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., SUMMER20" {...field} onBlur={() => field.onChange(field.value.toUpperCase())} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="discountType" render={({ field }) => (
                  <FormItem><FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="discountValue" render={({ field }) => (
                  <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" placeholder="e.g., 10 or 100" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } initialFocus />
                    </PopoverContent>
                  </Popover><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minPurchaseAmount" render={({ field }) => (
                <FormItem><FormLabel>Minimum Purchase (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 500" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="usageLimit" render={({ field }) => (
                <FormItem><FormLabel>Usage Limit (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5"><FormLabel>Active</FormLabel><FormDescription>Is this coupon currently active?</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}><X size={16} className="mr-2"/>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner size={18} className="mr-2"/> : <Save size={16} className="mr-2"/>}
                  {editingCoupon ? 'Save Changes' : 'Add Coupon'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!isSubmitting) setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the coupon &quot;{couponToDelete?.code}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={18} className="mr-2"/> : 'Delete Coupon'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <style jsx global>{`
        .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--muted)) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted));
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: content-box;
        }
      `}</style>
    </>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address, ShippingAddress } from '@/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge'; // Added import for Badge
import { MapPin, PlusCircle, Edit, Trash2, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const addressFormSchema = z.object({
  id: z.string().optional(), // For editing
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^(\+?880|0)1[3-9]\d{8}$/, "Please enter a valid BD phone number."),
  streetAddress: z.string().min(5, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(4, "Postal code is required."),
  country: z.string().min(2, "Country is required.").default("Bangladesh"),
  isDefault: z.boolean().optional().default(false),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

export default function AddressesClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      fullName: '', phone: '', streetAddress: '', city: '', postalCode: '', country: 'Bangladesh', isDefault: false,
    },
  });

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      router.push('/login?redirect=/dashboard/addresses');
      return;
    }
    try {
      const response = await fetch('/api/user/addresses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch addresses');
      }
      const data: Address[] = await response.json();
      setAddresses(data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime() ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenForm = (address: Address | null = null) => {
    setEditingAddress(address);
    if (address) {
      form.reset({
        id: address.id,
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.streetAddress,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault || false,
      });
    } else {
      form.reset({ 
        fullName: '', phone: '', streetAddress: '', city: '', postalCode: '', country: 'Bangladesh', isDefault: false, id: undefined 
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<AddressFormData> = async (data) => {
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');
    const apiEndpoint = editingAddress?.id ? `/api/user/addresses/${editingAddress.id}` : '/api/user/addresses';
    const method = editingAddress?.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${editingAddress ? 'update' : 'add'} address`);
      
      toast({ title: `Address ${editingAddress ? 'Updated' : 'Added'}`, description: `Address has been successfully ${editingAddress ? 'updated' : 'added'}.`, icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
      setIsFormOpen(false);
      fetchAddresses(); // Refresh the list
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete || !addressToDelete.id) return;
    setIsSubmitting(true); // Use general submitting state
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`/api/user/addresses/${addressToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete address');
      }
      toast({ title: "Address Deleted", description: "Address has been successfully deleted." });
      fetchAddresses(); // Refresh
    } catch (err: any) {
      toast({ title: "Error Deleting Address", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to set default address');
      toast({ title: "Default Address Updated", description: "Address set as default successfully." });
      fetchAddresses(); // Refresh
    } catch (err: any) {
      toast({ title: "Error Setting Default", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading your addresses..." />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
        <CardContent><p>{error}</p><Button onClick={fetchAddresses} className="mt-4">Try Again</Button></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-2xl">
              <MapPin size={24} className="mr-2 text-primary" />
              Manage Addresses
            </CardTitle>
            <CardDescription>View, add, or edit your saved shipping addresses.</CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)} size="sm">
            <PlusCircle size={16} className="mr-2" /> Add New Address
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You haven't saved any addresses yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <Card key={address.id} className={`relative ${address.isDefault ? 'border-primary ring-2 ring-primary' : ''}`}>
                  {address.isDefault && (
                    <Badge variant="default" className="absolute -top-2 -right-2 px-2 py-0.5 text-xs">Default</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{address.fullName}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>{address.streetAddress}</p>
                    <p>{address.city}, {address.postalCode}</p>
                    <p>{address.country}</p>
                    <p>Phone: {address.phone}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-4">
                    {!address.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id!)} disabled={isSubmitting}>
                        <Star size={14} className="mr-1" /> Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(address)} disabled={isSubmitting}>
                      <Edit size={14} className="mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(address)} disabled={isSubmitting}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update the details of your address.' : 'Enter the details for your new address.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="streetAddress" render={({ field }) => (
                <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="postalCode" render={({ field }) => (
                  <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isDefault" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default shipping address</FormLabel>
                  </div>
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner size={18} className="mr-2"/> : (editingAddress ? 'Save Changes' : 'Add Address')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the address: <br />
              <strong>{addressToDelete?.streetAddress}, {addressToDelete?.city}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={18} className="mr-2"/> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

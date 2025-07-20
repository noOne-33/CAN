
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderItem, ShippingAddress, OrderStatus } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { ArrowLeft, Package, User, MapPin, CreditCard, AlertTriangle, ShoppingBag, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminOrderDetailClientProps {
  orderId: string;
}

export default function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | ''>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchOrderDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // TODO: Add admin token authentication if API requires it
    // const token = localStorage.getItem('authToken'); // or admin specific token
    // if (!token) { ... }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`); // Uses the new admin-specific order detail GET route
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) setError("Order not found.");
        else setError(errorData.message || 'Failed to fetch order details');
        setOrder(null);
        return;
      }
      const data: Order = await response.json();
      setOrder(data);
      setSelectedNewStatus(data.orderStatus); // Initialize for status update dialog
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const getStatusBadgeColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'Processing': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'Shipped': return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
      case 'Delivered': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'Cancelled': return 'bg-red-500/20 text-red-700 border-red-500/50';
      case 'Failed': return 'bg-red-700/20 text-red-900 border-red-700/50';
      default: return '';
    }
  };

  const orderStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Failed"];

  const handleSaveStatusUpdate = async () => {
    if (!order || !selectedNewStatus || selectedNewStatus === order.orderStatus) {
      setIsUpdateStatusDialogOpen(false);
      if (selectedNewStatus === order?.orderStatus) {
        toast({ title: "No Change", description: "Order status is already set to the selected value."});
      }
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' /*, 'Authorization': `Bearer ${adminToken}` */ },
        body: JSON.stringify({ newStatus: selectedNewStatus }),
      });
      const updatedOrderFromServer = await response.json();
      if (response.ok) {
        setOrder(updatedOrderFromServer); // Update the full order state
        setSelectedNewStatus(updatedOrderFromServer.orderStatus); // Re-sync selectedNewStatus
        toast({ title: "Status Updated", description: `Order status changed to ${selectedNewStatus}.` });
        setIsUpdateStatusDialogOpen(false);
      } else {
        toast({ title: "Update Failed", description: updatedOrderFromServer.message || "Could not update order status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Loading order details..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl text-destructive">Error Loading Order</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/admin/orders')}>
            <ArrowLeft size={18} className="mr-2" /> Back to All Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
           <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">Order Not Found</CardTitle>
          <CardDescription>The order details could not be retrieved.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/admin/orders')}>
            <ArrowLeft size={18} className="mr-2" /> Back to All Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft size={18} className="mr-2" /> Back to All Orders
        </Button>
        <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(true)} disabled={isUpdatingStatus}>
            <Edit size={16} className="mr-2" /> Update Status
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl mb-1">Order Details (Admin View)</CardTitle>
                <CardDescription>
                    Order ID: <span className="font-mono">#{order.id?.substring(0, 8)}...</span>
                </CardDescription>
            </div>
            <Badge className={cn("text-sm px-3 py-1 self-start sm:self-center", getStatusBadgeColor(order.orderStatus))}>
                {order.orderStatus}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-2 space-y-1">
            <p>User ID: <span className="font-mono text-xs">{order.userId}</span></p>
            <p>Date Placed: <ClientSideFormattedDate isoDateString={order.createdAt!.toString()} formatString="PPPp" /></p>
            {order.orderStatus === 'Delivered' && order.deliveredAt && (
              <p>Date Delivered: <ClientSideFormattedDate isoDateString={order.deliveredAt.toString()} formatString="PPPp" /></p>
            )}
             <p>Last Updated: <ClientSideFormattedDate isoDateString={order.updatedAt!.toString()} formatString="PPPp" /></p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center"><MapPin size={20} className="mr-2 text-primary" />Shipping Address</h2>
            <div className="p-4 border rounded-md bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.streetAddress}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center"><CreditCard size={20} className="mr-2 text-primary" />Payment Information</h2>
            <div className="p-4 border rounded-md bg-muted/30 text-sm">
              <p>Method: {order.paymentMethod}</p>
              <p>Total Amount: <span className="font-semibold">৳{order.totalAmount.toFixed(2)}</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center"><Package size={20} className="mr-2 text-primary" />Order Items ({order.items.length})</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={item.productId + (item.size || '') + (item.color || '') + index}>
                      <TableCell>
                        <Image
                          src={item.image || 'https://placehold.co/64x80.png'}
                          alt={item.name}
                          width={64}
                          height={80}
                          className="rounded-md object-cover aspect-[4/5]"
                          data-ai-hint="product clothing"
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/products/${item.productId}`} target="_blank" className="font-medium hover:text-primary">{item.name}</Link>
                        <div className="text-xs text-muted-foreground">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && ' / '}
                          {item.color && `Color: ${item.color}`}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.productId.substring(0,8)}...</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">৳{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </CardContent>
      </Card>

       <Dialog open={isUpdateStatusDialogOpen} onOpenChange={(open) => {
          if (isUpdatingStatus) return;
          setIsUpdateStatusDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order ID: #{order?.id?.substring(0,8)}... <br/>
              Current Status: {order?.orderStatus}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="newStatusAdminDetail">New Status</Label>
              <Select 
                value={selectedNewStatus || ''} 
                onValueChange={(value: OrderStatus) => setSelectedNewStatus(value)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger id="newStatusAdminDetail">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdatingStatus}><ArrowLeft size={16} className="mr-2" /> Cancel</Button></DialogClose>
            <Button 
              type="button" 
              onClick={handleSaveStatusUpdate} 
              disabled={isUpdatingStatus || !selectedNewStatus || selectedNewStatus === order?.orderStatus}
            >
              {isUpdatingStatus ? <LoadingSpinner size={18} className="mr-2"/> : <Edit size={16} className="mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderItem, ShippingAddress } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { ArrowLeft, Package, User, MapPin, CreditCard, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchOrderDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in to view order details.", variant: "destructive" });
      router.push('/login?redirect=/dashboard/orders');
      return;
    }

    try {
      const response = await fetch(`/api/my-orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) router.push('/login?redirect=/dashboard/orders');
        if (response.status === 404) setError("Order not found or you don't have permission to view it.");
        else setError(errorData.message || 'Failed to fetch order details');
        return;
      }
      const data: Order = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router, toast]);

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
          <Button onClick={() => router.push('/dashboard/orders')}>
            <ArrowLeft size={18} className="mr-2" /> Back to My Orders
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
          <CardDescription>The order you are looking for could not be found.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/dashboard/orders')}>
            <ArrowLeft size={18} className="mr-2" /> Back to My Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/dashboard/orders')}>
          <ArrowLeft size={18} className="mr-2" /> Back to My Orders
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl mb-1">Order Details</CardTitle>
                <CardDescription>
                    Order ID: <span className="font-mono">#{order.id?.substring(0, 8)}...</span>
                </CardDescription>
            </div>
            <Badge className={cn("text-sm px-3 py-1 self-start sm:self-center", getStatusBadgeColor(order.orderStatus))}>
                {order.orderStatus}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-2 space-y-1">
            <p>Date Placed: <ClientSideFormattedDate isoDateString={order.createdAt!.toString()} formatString="PPPp" /></p>
            {order.orderStatus === 'Delivered' && order.deliveredAt && (
              <p>Date Delivered: <ClientSideFormattedDate isoDateString={order.deliveredAt.toString()} formatString="PPPp" /></p>
            )}
             <p>Last Updated: <ClientSideFormattedDate isoDateString={order.updatedAt!.toString()} formatString="PPPp" /></p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Shipping Information */}
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

          {/* Payment Information */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center"><CreditCard size={20} className="mr-2 text-primary" />Payment Information</h2>
            <div className="p-4 border rounded-md bg-muted/30 text-sm">
              <p>Method: {order.paymentMethod}</p>
              {/* Add payment status if applicable */}
            </div>
          </section>

          {/* Order Items */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center"><Package size={20} className="mr-2 text-primary" />Order Items ({order.items.length})</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product</TableHead>
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
                        <Link href={`/products/${item.productId}`} className="font-medium hover:text-primary">{item.name}</Link>
                        <div className="text-xs text-muted-foreground">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && ' / '}
                          {item.color && `Color: ${item.color}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">৳{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Order Totals */}
          <section className="mt-6 pt-4 border-t">
            <div className="max-w-sm ml-auto space-y-2 text-sm">
              {/* Placeholder for subtotal if needed, usually covered by item list */}
              {/* 
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Subtotal:</span>
                <span>৳{order.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
              </div> 
              */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span>৳{ (order.totalAmount - order.items.reduce((acc, item) => acc + item.price * item.quantity, 0)).toFixed(2) }</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-primary">
                <span>Grand Total:</span>
                <span>৳{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

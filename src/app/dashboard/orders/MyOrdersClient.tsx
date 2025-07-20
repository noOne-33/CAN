
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { ListOrdered, AlertTriangle, LogIn, MoreHorizontal, Eye, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function MyOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
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
      const response = await fetch('/api/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) setIsAuthenticated(false); // Token might be invalid
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data: { orders: Order[] } = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'An unexpected error occurred.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrderClick = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelConfirmationOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel || !orderToCancel.id) return;
    setIsCancelling(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/my-orders/${orderToCancel.id}/cancel`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Order Cancelled', description: `Order #${orderToCancel.id?.substring(0,8)}... has been cancelled.` });
        // Update local state or re-fetch
        setOrders(prevOrders => prevOrders.map(o => o.id === orderToCancel.id ? { ...o, orderStatus: 'Cancelled', updatedAt: new Date().toISOString() } : o));
      } else {
        toast({ title: 'Cancellation Failed', description: result.message || 'Could not cancel the order.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'An unexpected error occurred during cancellation.', variant: 'destructive' });
    } finally {
      setIsCancelling(false);
      setIsCancelConfirmationOpen(false);
      setOrderToCancel(null);
    }
  };


  const getStatusBadgeVariant = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending': return 'default';
      case 'Processing': return 'secondary';
      case 'Shipped': return 'outline';
      case 'Delivered': return 'default'; 
      case 'Cancelled': return 'destructive';
      case 'Failed': return 'destructive';
      default: return 'outline';
    }
  };
  
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><ListOrdered size={24} className="mr-2 text-primary" /> My Orders</CardTitle>
          <CardDescription>Loading your order history...</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <LoadingSpinner text="Fetching your orders..." />
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><LogIn size={24} className="mr-2 text-primary" /> Login Required</CardTitle>
          <CardDescription>Please log in to view your order history.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Button asChild>
            <Link href="/login?redirect=/dashboard/orders">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-destructive"><AlertTriangle size={24} className="mr-2" /> Error</CardTitle>
          <CardDescription>Could not load your orders.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchOrders}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <ListOrdered size={24} className="mr-2 text-primary" /> My Orders
          </CardTitle>
          <CardDescription>View all your previous orders and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">You haven't placed any orders yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date Placed</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Delivered On</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id?.toString()}>
                      <TableCell className="font-mono text-xs">#{order.id?.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {order.createdAt ? <ClientSideFormattedDate isoDateString={order.createdAt.toString()} formatString="PP" /> : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">৳{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{order.paymentMethod}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.orderStatus)} className={cn("text-xs", getStatusBadgeColor(order.orderStatus))}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.orderStatus === 'Delivered' && order.deliveredAt ? (
                          <ClientSideFormattedDate isoDateString={order.deliveredAt.toString()} formatString="PP" />
                        ) : (
                          <span className="text-muted-foreground text-xs">Not yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/orders/view/${order.id?.toString()}`} className="cursor-pointer">
                                <Eye size={16} className="mr-2" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            {(order.orderStatus === 'Pending' || order.orderStatus === 'Processing') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCancelOrderClick(order)} className="text-destructive cursor-pointer">
                                  <XCircle size={16} className="mr-2" /> Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isCancelConfirmationOpen} onOpenChange={setIsCancelConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Order ID: #{orderToCancel?.id?.substring(0, 8)}... <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsCancelConfirmationOpen(false)} disabled={isCancelling}>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelOrder} className="bg-destructive hover:bg-destructive/90" disabled={isCancelling}>
              {isCancelling ? <LoadingSpinner size={18} className="mr-2"/> : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


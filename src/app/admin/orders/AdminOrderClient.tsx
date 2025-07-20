'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Order, OrderStatus } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, RefreshCw, Search, Eye, Edit, Save, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AdminOrderClientProps {
  initialOrders: Order[];
}

export default function AdminOrderClient({ initialOrders }: AdminOrderClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<Order | null>(null);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | ''>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
     setOrders(initialOrders.map(o => ({...o, id: o._id?.toString() })));
  }, [initialOrders]);

  const fetchOrdersAndRefresh = async () => {
    setIsLoading(true);
    try {
      // The page.tsx handles fetching on navigation/refresh.
      // For an explicit client-side refresh, we could fetch from an API, but router.refresh() is simpler here.
      router.refresh(); 
      // The initialOrders prop will update via the parent server component, then useEffect will update local state.
      toast({ title: "Orders Refreshed", description: "The list of orders has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Could not refresh orders.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrdersAndRefresh();
  };
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.userId.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === 'All' || order.orderStatus === filterStatus;
      return searchMatch && statusMatch;
    }).sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
  }, [orders, searchTerm, filterStatus]);

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

  const orderStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Failed"];

  const handleUpdateStatusClick = (order: Order) => {
    setOrderToUpdateStatus(order);
    setSelectedNewStatus(order.orderStatus);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!orderToUpdateStatus || !selectedNewStatus || selectedNewStatus === orderToUpdateStatus.orderStatus) {
      setIsUpdateStatusDialogOpen(false);
      if (selectedNewStatus === orderToUpdateStatus?.orderStatus) {
        toast({ title: "No Change", description: "Order status is already set to the selected value."});
      }
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderToUpdateStatus.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: selectedNewStatus }),
      });
      const updatedOrderFromServer = await response.json();
      if (response.ok) {
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === orderToUpdateStatus.id ? { ...o, ...updatedOrderFromServer, id: updatedOrderFromServer._id?.toString() } : o)
        );
        toast({ title: "Status Updated", description: `Order #${orderToUpdateStatus.id?.substring(0,8)} status changed to ${selectedNewStatus}.` });
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

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Order ID, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-72"
            disabled={isLoading || isUpdatingStatus}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading || isUpdatingStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {orderStatuses.map(status => (
                 <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="flex-shrink-0" disabled={isLoading || isUpdatingStatus}>
            <RefreshCw size={16} className="mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="text-center py-12">
          <LoadingSpinner text="Loading orders..." />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id?.toString()}>
                  <TableCell className="font-mono text-xs">{order.id?.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{order.shippingAddress.fullName}</TableCell>
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
                    {order.deliveredAt ? <ClientSideFormattedDate isoDateString={order.deliveredAt.toString()} formatString="PP" /> : <span className="text-xs text-muted-foreground">N/A</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdatingStatus}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild disabled={isUpdatingStatus}>
                          <Link href={`/admin/orders/view/${order.id?.toString()}`} className="flex items-center cursor-pointer">
                             <Eye size={16} className="mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)} disabled={isUpdatingStatus} className="cursor-pointer">
                          <Edit size={16} className="mr-2" /> Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          {searchTerm || filterStatus !== 'All' ? 'No orders match your search/filter criteria.' : 'No orders found.'}
        </p>
      )}

      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={(open) => {
          if (isUpdatingStatus) return;
          setIsUpdateStatusDialogOpen(open);
          if (!open) setOrderToUpdateStatus(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order ID: #{orderToUpdateStatus?.id?.substring(0,8)}... <br/>
              Current Status: {orderToUpdateStatus?.orderStatus}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="newStatus">New Status</Label>
              <Select 
                value={selectedNewStatus || ''} 
                onValueChange={(value: OrderStatus) => setSelectedNewStatus(value)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger id="newStatus">
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
            <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdatingStatus}><X size={16} className="mr-2" /> Cancel</Button></DialogClose>
            <Button 
              type="button" 
              onClick={handleSaveStatusUpdate} 
              disabled={isUpdatingStatus || !selectedNewStatus || selectedNewStatus === orderToUpdateStatus?.orderStatus}
            >
              {isUpdatingStatus ? <LoadingSpinner size={18} className="mr-2"/> : <Save size={16} className="mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
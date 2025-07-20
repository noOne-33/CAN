
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import AdminOrderClient from './AdminOrderClient';
import { getAdminOrders } from '@/lib/services/orderService';
import type { Order } from '@/types';

export const metadata = {
  title: 'Manage Orders - Admin - CAN',
  description: 'View and manage customer orders.',
};

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

async function fetchAdminOrders(): Promise<Order[]> {
  console.log('[AdminOrdersPage] Attempting to fetch orders via service...');
  try {
    const orders = await getAdminOrders();
    console.log(`[AdminOrdersPage] Successfully fetched ${orders.length} orders.`);
    // Dates are already ISO strings from the service, ensure _id is string
    return orders.map(o => ({
        ...o, 
        _id: o._id?.toString(), 
        id: o._id?.toString(),
    }));
  } catch (error: any) {
    console.error('[AdminOrdersPage] CRITICAL: Error fetching orders:', error.message);
    return [];
  }
}


export default async function AdminOrdersPage() {
  const initialOrders = await fetchAdminOrders();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <ShoppingCart size={24} className="mr-2 text-primary" />
          Manage Orders
        </CardTitle>
        <CardDescription>View, track, and manage all customer orders from this section.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminOrderClient initialOrders={initialOrders} />
      </CardContent>
    </Card>
  );
}


import AdminOrderDetailClient from './AdminOrderDetailClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Order Details - Admin - CAN',
  description: 'View the details of a specific customer order.',
};

interface AdminOrderDetailPageProps {
  params: {
    orderId: string;
  };
}

// This is a server component that will pass the orderId to the client component.
// Data fetching will happen client-side in AdminOrderDetailClient for admin-specific data.
export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { orderId } = params;

  if (!orderId) {
    return (
        <Card>
            <CardHeader><CardTitle>Invalid Order ID</CardTitle></CardHeader>
            <CardContent>
                <p>No order ID was provided.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/orders">Back to Orders</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <AdminOrderDetailClient orderId={orderId} />
  );
}

export const dynamic = 'force-dynamic';

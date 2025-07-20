
import { NextResponse, type NextRequest } from 'next/server';
import { updateOrderStatus } from '@/lib/services/orderService';
import type { OrderStatus } from '@/types';
// import { getAuthPayloadFromRequest } from '@/lib/authUtils'; // For future admin role check

export async function PUT(req: NextRequest, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  console.log(`[API /api/admin/orders/${orderId}/status] PUT request received`);

  // TODO: Implement admin role check
  // const authPayload = await getAuthPayloadFromRequest(req);
  // if (!authPayload || authPayload.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  // }

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required in the path.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { newStatus } = body as { newStatus: OrderStatus };

    if (!newStatus) {
      return NextResponse.json({ message: 'New status is required in the request body.' }, { status: 400 });
    }

    const validStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Failed"];
    if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ message: 'Invalid order status provided.' }, { status: 400 });
    }

    console.log(`[API /api/admin/orders/${orderId}/status] Attempting to update status to: ${newStatus}`);
    
    const updatedOrder = await updateOrderStatus(orderId, newStatus);

    if (updatedOrder) {
      console.log(`[API /api/admin/orders/${orderId}/status] Order status updated successfully.`);
      return NextResponse.json(updatedOrder, { status: 200 });
    } else {
      console.warn(`[API /api/admin/orders/${orderId}/status] Order not found or update failed.`);
      return NextResponse.json({ message: 'Order not found or failed to update status.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error(`[API /api/admin/orders/${orderId}/status] Error updating order status:`, error);
    if (error.message.includes('Invalid ID format') || error.message.includes('Invalid order status')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update order status.', error: error.message }, { status: 500 });
  }
}

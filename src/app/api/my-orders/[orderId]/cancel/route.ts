
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { cancelUserOrder } from '@/lib/services/orderService';
import type { Order } from '@/types';

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  console.log(`[API /api/my-orders/${orderId}/cancel] POST request received`);

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required in the path.' }, { status: 400 });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      console.log('[API /api/my-orders/cancel] Unauthorized: User ID not found in token.');
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    console.log(`[API /api/my-orders/cancel] Authenticated User ID: ${userId}. Attempting to cancel order: ${orderId}`);
    
    const cancelledOrder = await cancelUserOrder(orderId, userId);

    if (cancelledOrder) {
      console.log(`[API /api/my-orders/cancel] Order ${orderId} cancelled successfully for user ${userId}.`);
      return NextResponse.json({ message: 'Order cancelled successfully', order: cancelledOrder }, { status: 200 });
    } else {
      // This case might be hit if service returns null due to "not found" or other reasons before throwing
      console.warn(`[API /api/my-orders/cancel] Order ${orderId} not found or could not be cancelled for user ${userId}.`);
      return NextResponse.json({ message: 'Order not found or could not be cancelled.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error(`[API /api/my-orders/cancel] Error cancelling order ${orderId}:`, error);
    if (error.message.includes('Order cannot be cancelled')) {
        return NextResponse.json({ message: error.message }, { status: 403 }); // Forbidden
    }
    if (error.message.includes('Invalid ID format')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to cancel order.', error: error.message }, { status: 500 });
  }
}

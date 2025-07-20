
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getUserOrderById } from '@/lib/services/orderService';
import type { Order } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  console.log(`[API /api/my-orders/${orderId}] GET request received`);

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required in the path.' }, { status: 400 });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      console.log(`[API /api/my-orders/${orderId}] Unauthorized: User ID not found in token.`);
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    console.log(`[API /api/my-orders/${orderId}] Authenticated User ID: ${userId}. Attempting to fetch order.`);
    
    const order = await getUserOrderById(orderId, userId);

    if (!order) {
      console.warn(`[API /api/my-orders/${orderId}] Order not found or does not belong to user ${userId}.`);
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }
    
    console.log(`[API /api/my-orders/${orderId}] Order ${orderId} fetched successfully for user ${userId}.`);
    return NextResponse.json(order, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/my-orders/${orderId}] Error fetching order:`, error);
    if (error.message.includes('Invalid ID format')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to fetch order details.', error: error.message }, { status: 500 });
  }
}

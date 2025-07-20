
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getOrdersByUserId } from '@/lib/services/orderService';
import type { Order } from '@/types';

export async function GET(req: NextRequest) {
  console.log('[API /api/my-orders] GET request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      console.log('[API /api/my-orders] Unauthorized: User ID not found in token.');
      return NextResponse.json({ message: 'Unauthorized. Please log in to view your orders.' }, { status: 401 });
    }

    console.log(`[API /api/my-orders] Authenticated User ID: ${userId}. Fetching orders...`);
    const orders: Order[] = await getOrdersByUserId(userId);

    if (!orders) {
        // This case might not be hit if getOrdersByUserId always returns an array,
        // but good for robustness.
        console.warn(`[API /api/my-orders] No orders array returned for user ${userId}, though service was called.`);
        return NextResponse.json({ orders: [] }, { status: 200 });
    }
    
    console.log(`[API /api/my-orders] Successfully fetched ${orders.length} orders for user ${userId}.`);
    return NextResponse.json({ orders }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/my-orders] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch your orders.', error: error.message }, { status: 500 });
  }
}

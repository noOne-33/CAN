
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminOrderById } from '@/lib/services/orderService';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  console.log(`[API /api/admin/orders/${orderId}] GET request received for admin view`);

  // TODO: Add admin role check here
  // const authPayload = await getAuthPayloadFromRequest(req);
  // if (!authPayload || authPayload.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  // }

  if (!ObjectId.isValid(orderId)) {
    return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
  }

  try {
    const order = await getAdminOrderById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/orders/${orderId}] Error fetching order for admin:`, error);
    return NextResponse.json({ message: 'Failed to fetch order details.', error: error.message }, { status: 500 });
  }
}

// Placeholder for other methods like PUT or DELETE for a specific order by admin if needed later
// For example, an admin might be able to edit more details of an order than just status.
// export async function PUT(req: NextRequest, { params }: { params: { orderId: string } }) { ... }

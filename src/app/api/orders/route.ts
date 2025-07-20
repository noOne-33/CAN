
import { NextResponse, type NextRequest } from 'next/server';
import { createOrder, getAdminOrders } from '@/lib/services/orderService';
import { getUserIdFromRequest } from '@/lib/authUtils';
import type { OrderItem, ShippingAddress, Order, Coupon } from '@/types'; // Added Coupon
import { validateAndGetCoupon, incrementCouponUsage } from '@/lib/services/couponService'; // Added coupon service functions


export async function POST(req: NextRequest) {
  console.log('[API /api/orders] POST request received to create order');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. User not logged in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      items, 
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus,
      appliedCouponCode, // New field from client
      couponDiscountAmount, // New field from client
    } = body as {
      items: OrderItem[]; 
      totalAmount: number;
      shippingAddress: ShippingAddress;
      paymentMethod: string;
      orderStatus: Order['orderStatus'];
      appliedCouponCode?: string; // Optional
      couponDiscountAmount?: number; // Optional
    };

    if (!items || items.length === 0 || !totalAmount || !shippingAddress || !paymentMethod || !orderStatus) {
      return NextResponse.json({ message: 'Missing required order fields.' }, { status: 400 });
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
         return NextResponse.json({ message: 'Incomplete shipping address.' }, { status: 400 });
    }

    // Prepare order data, including coupon info if present
    const orderDataForService = {
      userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus,
      appliedCouponCode,
      couponDiscountAmount,
    };

    const newOrder = await createOrder(orderDataForService);

    if (newOrder) {
      console.log(`[API /api/orders] Order ${newOrder.id} created successfully for user ${userId}.`);
      
      // If a coupon was applied, increment its usage count
      if (appliedCouponCode && newOrder.id) {
        try {
          const coupon = await validateAndGetCoupon(appliedCouponCode); // Re-validate or get by code to ensure it's still okay and get ID
          if (coupon && coupon.id) {
            await incrementCouponUsage(coupon.id);
            console.log(`[API /api/orders] Incremented usage for coupon: ${appliedCouponCode}`);
          } else {
            console.warn(`[API /api/orders] Could not find coupon ${appliedCouponCode} to increment usage after order creation.`);
          }
        } catch (couponError: any) {
          console.error(`[API /api/orders] Error incrementing coupon usage for ${appliedCouponCode}:`, couponError.message);
          // Don't fail order creation for this, but log it.
        }
      }
      
      return NextResponse.json({ message: 'Order created successfully', orderId: newOrder.id }, { status: 201 });
    } else {
      console.error(`[API /api/orders] Failed to create order for user ${userId}.`);
      return NextResponse.json({ message: 'Failed to create order.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API /api/orders] POST Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create order', error: error.message }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  console.log('[API /api/orders] GET request received to fetch all orders (admin)');
  // Admin role check should be implemented here using getAuthPayloadFromRequest
  // const authPayload = await getAuthPayloadFromRequest(req); 
  // if (!authPayload || authPayload.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  // }

  try {
    const orders = await getAdminOrders();
    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/orders] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch orders', error: error.message }, { status: 500 });
  }
}

    

import { NextResponse, type NextRequest } from 'next/server';
import { getAdminCoupons, addCoupon } from '@/lib/services/couponService';
import type { Coupon } from '@/types';

// GET all coupons
export async function GET(req: NextRequest) {
  // TODO: Add admin role check
  console.log('[API /api/admin/coupons] GET request received');
  try {
    const coupons = await getAdminCoupons();
    return NextResponse.json(coupons, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/coupons] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch coupons', error: error.message }, { status: 500 });
  }
}

// POST (create) a new coupon
export async function POST(req: NextRequest) {
  // TODO: Add admin role check
  console.log('[API /api/admin/coupons] POST request received');
  try {
    const body: Omit<Coupon, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'usageCount'> = await req.json();
    console.log('[API /api/admin/coupons] Request body for add:', body);

    // Basic validation (more comprehensive validation should be in the service or Zod schema on client)
    if (!body.code || !body.discountType || body.discountValue === undefined || !body.expiryDate) {
      return NextResponse.json({ message: 'Missing required fields for coupon.' }, { status: 400 });
    }

    const newCoupon = await addCoupon(body);
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/admin/coupons] POST Error:', error);
    if (error.message.includes("already exists")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create coupon.', error: error.message }, { status: 500 });
  }
}


import { NextResponse, type NextRequest } from 'next/server';
import { getCouponById, updateCoupon, deleteCoupon } from '@/lib/services/couponService';
import type { Coupon } from '@/types';
import { ObjectId } from 'mongodb';

// GET a single coupon by ID
export async function GET(req: NextRequest, { params }: { params: { couponId: string } }) {
  // TODO: Add admin role check
  const { couponId } = params;
  console.log(`[API /api/admin/coupons/${couponId}] GET request received`);

  if (!ObjectId.isValid(couponId)) {
    return NextResponse.json({ message: 'Invalid coupon ID format' }, { status: 400 });
  }
  try {
    const coupon = await getCouponById(couponId);
    if (!coupon) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(coupon, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/coupons/${couponId}] GET Error:`, error);
    return NextResponse.json({ message: 'Failed to fetch coupon', error: error.message }, { status: 500 });
  }
}

// PUT (Update) a coupon by ID
export async function PUT(req: NextRequest, { params }: { params: { couponId: string } }) {
  // TODO: Add admin role check
  const { couponId } = params;
  console.log(`[API /api/admin/coupons/${couponId}] PUT request received`);

  if (!ObjectId.isValid(couponId)) {
    return NextResponse.json({ message: 'Invalid coupon ID format' }, { status: 400 });
  }
  try {
    const body: Partial<Omit<Coupon, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>> = await req.json();
    console.log(`[API /api/admin/coupons/${couponId}] Update body:`, body);

    const updatedCoupon = await updateCoupon(couponId, body);
    if (!updatedCoupon) {
      return NextResponse.json({ message: 'Coupon not found or update failed.' }, { status: 404 });
    }
    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/coupons/${couponId}] PUT Error:`, error);
    if (error.message.includes("already exists")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update coupon.', error: error.message }, { status: 500 });
  }
}

// DELETE a coupon by ID
export async function DELETE(req: NextRequest, { params }: { params: { couponId: string } }) {
  // TODO: Add admin role check
  const { couponId } = params;
  console.log(`[API /api/admin/coupons/${couponId}] DELETE request received`);

  if (!ObjectId.isValid(couponId)) {
    return NextResponse.json({ message: 'Invalid coupon ID format' }, { status: 400 });
  }
  try {
    const success = await deleteCoupon(couponId);
    if (!success) {
      return NextResponse.json({ message: 'Coupon not found or delete failed.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Coupon deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/coupons/${couponId}] DELETE Error:`, error);
    return NextResponse.json({ message: 'Failed to delete coupon.', error: error.message }, { status: 500 });
  }
}

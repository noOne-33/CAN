
import { NextResponse, type NextRequest } from 'next/server';
import { validateAndGetCoupon } from '@/lib/services/couponService';
import type { Coupon } from '@/types';

export async function POST(req: NextRequest) {
  console.log('[API /api/coupons/validate-checkout] POST request received');
  try {
    const body = await req.json();
    const { couponCode, cartSubtotal } = body as { couponCode?: string; cartSubtotal?: number };

    if (!couponCode || typeof couponCode !== 'string' || couponCode.trim() === '') {
      return NextResponse.json({ message: 'Coupon code is required.' }, { status: 400 });
    }
    if (cartSubtotal === undefined || typeof cartSubtotal !== 'number' || cartSubtotal < 0) {
      return NextResponse.json({ message: 'Valid cart subtotal is required.' }, { status: 400 });
    }

    const coupon = await validateAndGetCoupon(couponCode.trim());

    if (!coupon) {
      return NextResponse.json({ message: 'Invalid or expired coupon code.' }, { status: 400 });
    }

    if (coupon.minPurchaseAmount && cartSubtotal < coupon.minPurchaseAmount) {
      return NextResponse.json({
        message: `Minimum purchase of ৳${coupon.minPurchaseAmount.toFixed(2)} required for this coupon. Your subtotal is ৳${cartSubtotal.toFixed(2)}.`,
      }, { status: 400 });
    }
    
    // If coupon is valid and all conditions met, return its details
    // The client will calculate the actual discount amount.
    const responsePayload = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      message: 'Coupon applied successfully.'
    };

    console.log(`[API /api/coupons/validate-checkout] Coupon "${couponCode}" validated successfully for subtotal ৳${cartSubtotal}.`);
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/coupons/validate-checkout] Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // General error
    return NextResponse.json({ message: error.message || 'Failed to validate coupon.' }, { status: 500 });
  }
}

    
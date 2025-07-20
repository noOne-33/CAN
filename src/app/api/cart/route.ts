
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getCartByUserId, clearDbCart } from '@/lib/services/cartService';
import type { Cart } from '@/types';

// GET user's cart
export async function GET(req: NextRequest) {
  console.log('[API /api/cart] GET request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const cart = await getCartByUserId(userId);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/cart] GET Error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch cart.', error: error.message }, { status: 500 });
  }
}

// DELETE (clear) user's cart
export async function DELETE(req: NextRequest) {
  console.log('[API /api/cart] DELETE request received to clear cart');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const cart = await clearDbCart(userId);
    return NextResponse.json({ message: 'Cart cleared successfully.', cart }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/cart] DELETE Error:', error.message);
    return NextResponse.json({ message: 'Failed to clear cart.', error: error.message }, { status: 500 });
  }
}

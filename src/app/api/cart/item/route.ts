
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { addItemToCart, updateCartItemQuantity, removeCartItem } from '@/lib/services/cartService';
import type { CartItem, Cart } from '@/types';

// Add item to cart
export async function POST(req: NextRequest) {
  console.log('[API /api/cart/item] POST request to add item');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const itemToAdd: CartItem = await req.json();
    if (!itemToAdd || !itemToAdd.productId || !itemToAdd.cartKey || itemToAdd.quantity == null) {
      return NextResponse.json({ message: 'Invalid item data provided.' }, { status: 400 });
    }
    const updatedCart = await addItemToCart(userId, itemToAdd);
    return NextResponse.json(updatedCart, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/cart/item] POST Error:', error.message);
    return NextResponse.json({ message: 'Failed to add item to cart.', error: error.message }, { status: 500 });
  }
}

// Update item quantity in cart
export async function PUT(req: NextRequest) {
  console.log('[API /api/cart/item] PUT request to update item quantity');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const { cartKey, quantity } = await req.json() as { cartKey: string; quantity: number };
    if (!cartKey || quantity == null || quantity < 0) { // Allow 0 to remove, service handles removal for <=0
      return NextResponse.json({ message: 'Invalid data: cartKey and non-negative quantity required.' }, { status: 400 });
    }
    const updatedCart = await updateCartItemQuantity(userId, cartKey, quantity);
    return NextResponse.json(updatedCart, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/cart/item] PUT Error:', error.message);
    return NextResponse.json({ message: 'Failed to update item quantity.', error: error.message }, { status: 500 });
  }
}

// Remove item from cart
export async function DELETE(req: NextRequest) {
  console.log('[API /api/cart/item] DELETE request to remove item');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    // For DELETE, data is often passed via query params or in the URL path.
    // If using body for DELETE (less common but possible):
    const { cartKey } = await req.json() as { cartKey: string };
    if (!cartKey) {
      return NextResponse.json({ message: 'Invalid data: cartKey required.' }, { status: 400 });
    }
    const updatedCart = await removeCartItem(userId, cartKey);
    return NextResponse.json(updatedCart, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/cart/item] DELETE Error:', error.message);
    return NextResponse.json({ message: 'Failed to remove item from cart.', error: error.message }, { status: 500 });
  }
}


'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { removeFromWishlistFlow } from '@/ai/flows/wishlist-flow'; // Using the Genkit flow

export async function POST(req: NextRequest) {
  console.log('[API /api/wishlist/remove] POST request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    console.log(`[API /api/wishlist/remove] User ${userId} removing product ${productId} from wishlist.`);
    const result = await removeFromWishlistFlow({ userId, productId }); // Call Genkit flow

    if (result.success) {
      console.log(`[API /api/wishlist/remove] Product ${productId} removed from wishlist for user ${userId}.`);
      return NextResponse.json({ message: result.message || 'Product removed from wishlist' }, { status: 200 });
    } else {
      console.warn(`[API /api/wishlist/remove] Failed to remove product ${productId} for user ${userId}. Message: ${result.message}`);
      return NextResponse.json({ message: result.message || 'Failed to remove product from wishlist' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[API /api/wishlist/remove] POST Error:', error);
    return NextResponse.json({ message: 'Failed to remove product from wishlist', error: error.message }, { status: 500 });
  }
}

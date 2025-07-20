
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getWishlistFlow } from '@/ai/flows/wishlist-flow'; // Using the Genkit flow

export async function GET(req: NextRequest) {
  console.log('[API /api/wishlist] GET request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. User ID not found.' }, { status: 401 });
    }

    console.log(`[API /api/wishlist] Authenticated User ID: ${userId}`);
    const wishlistOutput = await getWishlistFlow({ userId }); // Call the Genkit flow

    if (wishlistOutput && wishlistOutput.productIds) {
      console.log(`[API /api/wishlist] Wishlist for user ${userId} has ${wishlistOutput.productIds.length} items.`);
      return NextResponse.json({ productIds: wishlistOutput.productIds }, { status: 200 });
    } else {
      // This case implies the flow might have had an issue, or returned an unexpected structure
      console.warn(`[API /api/wishlist] Wishlist flow did not return expected productIds for user ${userId}. Output:`, wishlistOutput);
      return NextResponse.json({ productIds: [] }, { status: 200 }); // Default to empty if structure is off
    }
  } catch (error: any) {
    console.error('[API /api/wishlist] GET Error:', error);
    // Check if it's an auth-related error from the flow itself if necessary
    if (error.message && error.message.includes('User not found in token')) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token or user.', error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch wishlist', error: error.message }, { status: 500 });
  }
}

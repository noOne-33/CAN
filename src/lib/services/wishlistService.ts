
import { connectToDatabase } from '@/lib/mongodb';
import type { Wishlist, WishlistDoc } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Gets a user's wishlist or creates one if it doesn't exist.
 */
export async function getWishlist(userId: string): Promise<Wishlist | null> {
  console.log(`[wishlistService] getWishlist called for userId: ${userId}`);
  if (!userId) {
    console.warn('[wishlistService] userId is required to get wishlist.');
    return null;
  }

  try {
    const { db } = await connectToDatabase();
    const wishlistsCollection = db.collection<WishlistDoc>('wishlists');

    let wishlistDoc = await wishlistsCollection.findOne({ userId });

    if (!wishlistDoc) {
      // Create a new wishlist if one doesn't exist
      const newWishlist: Omit<WishlistDoc, '_id'> = {
        userId,
        productIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await wishlistsCollection.insertOne(newWishlist as WishlistDoc);
      wishlistDoc = {
        _id: result.insertedId,
        ...newWishlist,
      };
      console.log(`[wishlistService] Created new wishlist for userId: ${userId}`);
    }

    return {
      ...wishlistDoc,
      _id: wishlistDoc._id.toString(),
      createdAt: wishlistDoc.createdAt.toISOString(),
      updatedAt: wishlistDoc.updatedAt.toISOString(),
    } as Wishlist;
  } catch (error: any) {
    console.error(`[wishlistService] Error in getWishlist for userId ${userId}:`, error.message);
    return null;
  }
}

/**
 * Adds a product to a user's wishlist.
 * Ensures wishlist exists.
 */
export async function addProductToWishlist(userId: string, productId: string): Promise<boolean> {
  console.log(`[wishlistService] addProductToWishlist called for userId: ${userId}, productId: ${productId}`);
  if (!userId || !productId) {
    console.warn('[wishlistService] userId and productId are required to add to wishlist.');
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const wishlistsCollection = db.collection<WishlistDoc>('wishlists');

    // Ensure wishlist exists, getWishlist will create it if not
    await getWishlist(userId);

    const result = await wishlistsCollection.updateOne(
      { userId },
      {
        $addToSet: { productIds: productId }, // $addToSet prevents duplicates
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0 || result.matchedCount > 0; // Return true if modified or if product was already there
  } catch (error: any) {
    console.error(`[wishlistService] Error in addProductToWishlist for userId ${userId}:`, error.message);
    return false;
  }
}

/**
 * Removes a product from a user's wishlist.
 */
export async function removeProductFromWishlist(userId: string, productId: string): Promise<boolean> {
  console.log(`[wishlistService] removeProductFromWishlist called for userId: ${userId}, productId: ${productId}`);
  if (!userId || !productId) {
    console.warn('[wishlistService] userId and productId are required to remove from wishlist.');
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const wishlistsCollection = db.collection<WishlistDoc>('wishlists');

    const result = await wishlistsCollection.updateOne(
      { userId },
      {
        $pull: { productIds: productId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  } catch (error: any) {
    console.error(`[wishlistService] Error in removeProductFromWishlist for userId ${userId}:`, error.message);
    return false;
  }
}

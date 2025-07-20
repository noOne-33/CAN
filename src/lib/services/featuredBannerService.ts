
import { connectToDatabase } from '@/lib/mongodb';
import type { FeaturedBanner, FeaturedBannerDoc } from '@/types';
import { ObjectId } from 'mongodb';

const BANNERS_COLLECTION = 'featured_banners';
const BANNER_IDENTIFIER = 'homepage_exclusive_deal';

// Get the single featured banner
export async function getFeaturedBanner(): Promise<FeaturedBanner | null> {
  console.log('[featuredBannerService] getFeaturedBanner called');
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<FeaturedBannerDoc>(BANNERS_COLLECTION);
    const doc = await collection.findOne({ _id: BANNER_IDENTIFIER as any });

    if (!doc) {
      return null;
    }
    return {
      ...doc,
      _id: doc._id.toString(),
      id: doc._id.toString(),
      updatedAt: doc.updatedAt?.toISOString(),
    } as FeaturedBanner;
  } catch (error: any) {
    console.error('[featuredBannerService] Error fetching featured banner:', error.message);
    throw new Error('Failed to fetch featured banner.');
  }
}

// Update (or create) the single featured banner
export async function upsertFeaturedBanner(data: Omit<FeaturedBanner, 'id' | '_id' | 'updatedAt'>): Promise<FeaturedBanner> {
    console.log('[featuredBannerService] upsertFeaturedBanner called');
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<FeaturedBannerDoc>(BANNERS_COLLECTION);

        const updatePayload = {
            ...data,
            updatedAt: new Date(),
        };

        const result = await collection.findOneAndUpdate(
            { _id: BANNER_IDENTIFIER as any },
            { $set: updatePayload },
            { upsert: true, returnDocument: 'after' }
        );
        
        if (!result) {
            // This should not happen with upsert:true, but as a fallback
            const inserted = await getFeaturedBanner();
            if(!inserted) throw new Error('Failed to upsert and retrieve featured banner.');
            return inserted;
        }

        const updatedDoc = result as FeaturedBannerDoc;

        return {
            ...updatedDoc,
            id: updatedDoc._id.toString(),
            _id: updatedDoc._id.toString(),
            updatedAt: updatedDoc.updatedAt.toISOString(),
        } as FeaturedBanner;

    } catch (error: any) {
        console.error('[featuredBannerService] Error upserting featured banner:', error.message);
        throw error;
    }
}

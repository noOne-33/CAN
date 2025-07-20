
import { connectToDatabase } from '@/lib/mongodb';
import type { HeroSlide, HeroSlideDoc } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches all hero slides for the admin panel, sorted by displayOrder.
 */
export async function getHeroSlidesForAdmin(): Promise<HeroSlide[]> {
  console.log('[heroSlideService] getHeroSlidesForAdmin called');
  try {
    const { db } = await connectToDatabase();
    const slidesCollection = db.collection<HeroSlideDoc>('hero_slides');
    const slideDocs = await slidesCollection.find({}).sort({ displayOrder: 1, createdAt: -1 }).toArray();

    return slideDocs.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    })) as HeroSlide[];
  } catch (error: any) {
    console.error('[heroSlideService] Error in getHeroSlidesForAdmin:', error.message);
    throw new Error('Failed to fetch hero slides for admin.');
  }
}

/**
 * Fetches all active hero slides, sorted by displayOrder for public display.
 */
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  console.log('[heroSlideService] getActiveHeroSlides called');
  try {
    const { db } = await connectToDatabase();
    const slidesCollection = db.collection<HeroSlideDoc>('hero_slides');
    const slideDocs = await slidesCollection.find({ isActive: true }).sort({ displayOrder: 1 }).toArray();

    return slideDocs.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    })) as HeroSlide[];
  } catch (error: any) {
    console.error('[heroSlideService] Error in getActiveHeroSlides:', error.message);
    throw new Error('Failed to fetch active hero slides.');
  }
}


/**
 * Adds a new hero slide.
 */
export async function addHeroSlide(slideData: Omit<HeroSlide, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<HeroSlide> {
  console.log('[heroSlideService] addHeroSlide called with data:', slideData);
  try {
    const { db } = await connectToDatabase();
    const slidesCollection = db.collection<HeroSlideDoc>('hero_slides');

    const newSlideDocument: Omit<HeroSlideDoc, '_id'> = {
      ...slideData,
      displayOrder: slideData.displayOrder || 0,
      isActive: slideData.isActive === undefined ? true : slideData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await slidesCollection.insertOne(newSlideDocument as HeroSlideDoc);
    if (!result.insertedId) {
      throw new Error('Failed to insert hero slide into database.');
    }
    
    const createdSlide: HeroSlide = {
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      ...newSlideDocument,
      createdAt: newSlideDocument.createdAt.toISOString(),
      updatedAt: newSlideDocument.updatedAt.toISOString(),
    };
    console.log('[heroSlideService] Hero slide created successfully:', createdSlide.id);
    return createdSlide;
  } catch (error: any) {
    console.error('[heroSlideService] Error adding hero slide:', error.message);
    throw error;
  }
}

/**
 * Updates an existing hero slide.
 */
export async function updateHeroSlide(slideId: string, updates: Partial<Omit<HeroSlide, 'id' | '_id' | 'createdAt' | 'updatedAt'>>): Promise<HeroSlide | null> {
  console.log(`[heroSlideService] updateHeroSlide called for slideId: ${slideId}`);
  if (!ObjectId.isValid(slideId)) {
    throw new Error('Invalid slide ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const slidesCollection = db.collection<HeroSlideDoc>('hero_slides');

    const updatePayload = { ...updates, updatedAt: new Date() };
    
    // Ensure displayOrder is a number if provided
    if (updates.displayOrder !== undefined && typeof updates.displayOrder === 'string') {
        updatePayload.displayOrder = parseInt(updates.displayOrder, 10);
         if (isNaN(updatePayload.displayOrder)) {
            updatePayload.displayOrder = 0; // Default if parsing fails
        }
    }


    const result = await slidesCollection.findOneAndUpdate(
      { _id: new ObjectId(slideId) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.warn(`[heroSlideService] Hero slide ${slideId} not found or update failed.`);
      return null;
    }
    
    const updatedDoc = result as HeroSlideDoc;
    console.log(`[heroSlideService] Hero slide ${slideId} updated successfully.`);
    return {
      ...updatedDoc,
      id: updatedDoc._id.toString(),
      _id: updatedDoc._id.toString(),
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
    } as HeroSlide;
  } catch (error: any) {
    console.error(`[heroSlideService] Error updating hero slide ${slideId}:`, error.message);
    throw error;
  }
}

/**
 * Deletes a hero slide by its ID.
 */
export async function deleteHeroSlide(slideId: string): Promise<boolean> {
  console.log(`[heroSlideService] deleteHeroSlide called for slideId: ${slideId}`);
  if (!ObjectId.isValid(slideId)) {
    throw new Error('Invalid slide ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const slidesCollection = db.collection<HeroSlideDoc>('hero_slides');
    
    const result = await slidesCollection.deleteOne({ _id: new ObjectId(slideId) });
    
    if (result.deletedCount === 0) {
      console.warn(`[heroSlideService] Hero slide ${slideId} not found for deletion.`);
      return false;
    }
    console.log(`[heroSlideService] Hero slide ${slideId} deleted successfully.`);
    return true;
  } catch (error: any) {
    console.error(`[heroSlideService] Error deleting hero slide ${slideId}:`, error.message);
    throw error;
  }
}


import { connectToDatabase } from '@/lib/mongodb';
import type { Coupon, CouponDoc, CouponDiscountType } from '@/types';
import { ObjectId } from 'mongodb';

const COUPONS_COLLECTION = 'coupons';

function docToCoupon(doc: CouponDoc): Coupon {
  return {
    ...doc,
    id: doc._id.toString(),
    _id: doc._id.toString(),
    expiryDate: doc.expiryDate.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    minPurchaseAmount: doc.minPurchaseAmount ?? undefined, // Convert null to undefined
    usageLimit: doc.usageLimit ?? undefined, // Convert null to undefined
  };
}

/**
 * Fetches all coupons for the admin panel.
 */
export async function getAdminCoupons(): Promise<Coupon[]> {
  console.log('[couponService] getAdminCoupons called');
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);
    const couponDocs = await couponsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return couponDocs.map(docToCoupon);
  } catch (error: any) {
    console.error('[couponService] Error in getAdminCoupons:', error.message);
    throw new Error('Failed to fetch coupons from database.');
  }
}

/**
 * Fetches a single coupon by its ID.
 */
export async function getCouponById(couponId: string): Promise<Coupon | null> {
  console.log(`[couponService] getCouponById called for ID: ${couponId}`);
  if (!ObjectId.isValid(couponId)) {
    throw new Error('Invalid coupon ID format.');
  }
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);
    const couponDoc = await couponsCollection.findOne({ _id: new ObjectId(couponId) });
    return couponDoc ? docToCoupon(couponDoc) : null;
  } catch (error: any) {
    console.error(`[couponService] Error fetching coupon by ID ${couponId}:`, error.message);
    throw error;
  }
}

/**
 * Adds a new coupon.
 */
export async function addCoupon(data: Omit<Coupon, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Coupon> {
  console.log('[couponService] addCoupon called with data:', data);
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);

    const existingCoupon = await couponsCollection.findOne({ code: data.code.toUpperCase() });
    if (existingCoupon) {
      throw new Error(`Coupon code "${data.code.toUpperCase()}" already exists.`);
    }

    const newCouponDoc: Omit<CouponDoc, '_id'> = {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      expiryDate: new Date(data.expiryDate),
      minPurchaseAmount: data.minPurchaseAmount ?? null, // Store as null if undefined
      usageLimit: data.usageLimit ?? null, // Store as null if undefined
      usageCount: 0,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await couponsCollection.insertOne(newCouponDoc as CouponDoc);
    if (!result.insertedId) {
      throw new Error('Failed to insert coupon into database.');
    }
    return docToCoupon({ ...newCouponDoc, _id: result.insertedId });
  } catch (error: any) {
    console.error('[couponService] Error adding coupon:', error.message);
    throw error;
  }
}

/**
 * Updates an existing coupon.
 */
export async function updateCoupon(couponId: string, updates: Partial<Omit<Coupon, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>>): Promise<Coupon | null> {
  console.log(`[couponService] updateCoupon called for ID: ${couponId}`);
  if (!ObjectId.isValid(couponId)) {
    throw new Error('Invalid coupon ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);

    const updatePayload: Partial<CouponDoc> & { updatedAt: Date } = { updatedAt: new Date() };

    if (updates.code) {
        const newCode = updates.code.toUpperCase();
        const existingCoupon = await couponsCollection.findOne({ code: newCode, _id: { $ne: new ObjectId(couponId) } });
        if (existingCoupon) {
            throw new Error(`Coupon code "${newCode}" already exists.`);
        }
        updatePayload.code = newCode;
    }
    if (updates.discountType) updatePayload.discountType = updates.discountType;
    if (updates.discountValue !== undefined) updatePayload.discountValue = updates.discountValue;
    if (updates.expiryDate) updatePayload.expiryDate = new Date(updates.expiryDate);
    
    // Handle optional fields: if explicitly passed as null/undefined, set to null in DB, otherwise keep current value or update
    if (updates.hasOwnProperty('minPurchaseAmount')) updatePayload.minPurchaseAmount = updates.minPurchaseAmount ?? null;
    if (updates.hasOwnProperty('usageLimit')) updatePayload.usageLimit = updates.usageLimit ?? null;
    
    if (updates.isActive !== undefined) updatePayload.isActive = updates.isActive;


    const result = await couponsCollection.findOneAndUpdate(
      { _id: new ObjectId(couponId) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    return result ? docToCoupon(result as CouponDoc) : null;
  } catch (error: any) {
    console.error(`[couponService] Error updating coupon ${couponId}:`, error.message);
    throw error;
  }
}

/**
 * Deletes a coupon by its ID.
 */
export async function deleteCoupon(couponId: string): Promise<boolean> {
  console.log(`[couponService] deleteCoupon called for ID: ${couponId}`);
  if (!ObjectId.isValid(couponId)) {
    throw new Error('Invalid coupon ID format.');
  }
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);
    const result = await couponsCollection.deleteOne({ _id: new ObjectId(couponId) });
    return result.deletedCount > 0;
  } catch (error: any) {
    console.error(`[couponService] Error deleting coupon ${couponId}:`, error.message);
    throw error;
  }
}

/**
 * Validates a coupon code and returns its details if valid and active.
 * This would be used by the checkout process, not admin.
 */
export async function validateAndGetCoupon(code: string): Promise<Coupon | null> {
  console.log(`[couponService] validateAndGetCoupon called for code: ${code}`);
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);
    
    const couponDoc = await couponsCollection.findOne({ code: code.toUpperCase() });

    if (!couponDoc) {
      console.log(`[couponService] Coupon "${code}" not found.`);
      return null;
    }

    if (!couponDoc.isActive) {
      console.log(`[couponService] Coupon "${code}" is not active.`);
      return null;
    }

    if (couponDoc.expiryDate < new Date()) {
      console.log(`[couponService] Coupon "${code}" has expired.`);
      // Optionally update isActive to false here
      // await couponsCollection.updateOne({ _id: couponDoc._id }, { $set: { isActive: false, updatedAt: new Date() } });
      return null;
    }

    if (couponDoc.usageLimit !== null && couponDoc.usageCount >= couponDoc.usageLimit) {
      console.log(`[couponService] Coupon "${code}" has reached its usage limit.`);
      // Optionally update isActive to false here
      return null;
    }

    return docToCoupon(couponDoc);
  } catch (error: any) {
    console.error(`[couponService] Error validating coupon ${code}:`, error.message);
    throw error;
  }
}

/**
 * Increments the usage count of a coupon.
 * This would be called after an order successfully uses a coupon.
 */
export async function incrementCouponUsage(couponId: string): Promise<boolean> {
  console.log(`[couponService] incrementCouponUsage called for ID: ${couponId}`);
  if (!ObjectId.isValid(couponId)) {
    throw new Error('Invalid coupon ID format.');
  }
  try {
    const { db } = await connectToDatabase();
    const couponsCollection = db.collection<CouponDoc>(COUPONS_COLLECTION);
    const result = await couponsCollection.updateOne(
      { _id: new ObjectId(couponId) },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error: any) {
    console.error(`[couponService] Error incrementing usage for coupon ${couponId}:`, error.message);
    throw error;
  }
}

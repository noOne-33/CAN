
import { connectToDatabase } from '@/lib/mongodb';
import type { Address, AddressDoc, ShippingAddress } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches all addresses for a specific user.
 */
export async function getAddressesByUserId(userId: string): Promise<Address[]> {
  console.log(`[addressService] getAddressesByUserId called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const addressesCollection = db.collection<AddressDoc>('user_addresses');
    
    const addressDocs = await addressesCollection.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
    
    return addressDocs.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })) as Address[];
  } catch (error: any) {
    console.error(`[addressService] Error fetching addresses for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Adds a new address for a user. If isDefault is true, unsets other default addresses.
 */
export async function addAddress(userId: string, addressData: Omit<ShippingAddress, 'isDefault'> & { isDefault?: boolean }): Promise<Address> {
  console.log(`[addressService] addAddress called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const addressesCollection = db.collection<AddressDoc>('user_addresses');

    if (addressData.isDefault) {
      await addressesCollection.updateMany(
        { userId: new ObjectId(userId), isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date() } }
      );
    }

    const newAddressDocument: Omit<AddressDoc, '_id'> = {
      userId: new ObjectId(userId),
      ...addressData,
      isDefault: addressData.isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await addressesCollection.insertOne(newAddressDocument as AddressDoc);
    if (!result.insertedId) {
      throw new Error('Failed to insert address into database.');
    }
    
    const createdAddress: Address = {
      _id: result.insertedId.toString(),
      id: result.insertedId.toString(),
      userId: userId,
      ...addressData,
      isDefault: newAddressDocument.isDefault,
      createdAt: newAddressDocument.createdAt.toISOString(),
      updatedAt: newAddressDocument.updatedAt.toISOString(),
    };
    console.log('[addressService] Address added successfully:', createdAddress.id);
    return createdAddress;
  } catch (error: any) {
    console.error(`[addressService] Error adding address for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Updates an existing address for a user. Handles isDefault logic.
 */
export async function updateAddress(addressId: string, userId: string, addressUpdates: Partial<Omit<ShippingAddress, 'isDefault'> & { isDefault?: boolean }>): Promise<Address | null> {
  console.log(`[addressService] updateAddress called for addressId: ${addressId}, userId: ${userId}`);
  if (!ObjectId.isValid(addressId) || !ObjectId.isValid(userId)) {
    throw new Error('Invalid address ID or user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const addressesCollection = db.collection<AddressDoc>('user_addresses');

    // If setting this address as default, unset other defaults for this user
    if (addressUpdates.isDefault === true) {
      await addressesCollection.updateMany(
        { userId: new ObjectId(userId), _id: { $ne: new ObjectId(addressId) }, isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date() } }
      );
    }

    const updatePayload = { ...addressUpdates, updatedAt: new Date() };

    const result = await addressesCollection.findOneAndUpdate(
      { _id: new ObjectId(addressId), userId: new ObjectId(userId) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.warn(`[addressService] Address ${addressId} not found for user ${userId} or update failed.`);
      return null;
    }
    
    const updatedDoc = result as AddressDoc;
    console.log(`[addressService] Address ${addressId} updated successfully.`);
    return {
      ...updatedDoc,
      _id: updatedDoc._id.toString(),
      id: updatedDoc._id.toString(),
      userId: updatedDoc.userId.toString(),
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
    } as Address;
  } catch (error: any) {
    console.error(`[addressService] Error updating address ${addressId} for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Deletes an address for a user.
 */
export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
  console.log(`[addressService] deleteAddress called for addressId: ${addressId}, userId: ${userId}`);
  if (!ObjectId.isValid(addressId) || !ObjectId.isValid(userId)) {
    throw new Error('Invalid address ID or user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const addressesCollection = db.collection<AddressDoc>('user_addresses');
    
    const result = await addressesCollection.deleteOne({ _id: new ObjectId(addressId), userId: new ObjectId(userId) });
    
    if (result.deletedCount === 0) {
      console.warn(`[addressService] Address ${addressId} not found for user ${userId} or delete failed.`);
      return false;
    }
    console.log(`[addressService] Address ${addressId} deleted successfully for user ${userId}.`);
    return true;
  } catch (error: any) {
    console.error(`[addressService] Error deleting address ${addressId} for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Sets a specific address as the default for the user.
 */
export async function setDefaultAddress(addressId: string, userId: string): Promise<boolean> {
  console.log(`[addressService] setDefaultAddress called for addressId: ${addressId}, userId: ${userId}`);
  if (!ObjectId.isValid(addressId) || !ObjectId.isValid(userId)) {
    throw new Error('Invalid address ID or user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const addressesCollection = db.collection<AddressDoc>('user_addresses');

    // Transaction might be better here if atomicity is critical, but for now:
    // 1. Unset other default addresses for this user
    await addressesCollection.updateMany(
      { userId: new ObjectId(userId), isDefault: true },
      { $set: { isDefault: false, updatedAt: new Date() } }
    );

    // 2. Set the specified address as default
    const result = await addressesCollection.updateOne(
      { _id: new ObjectId(addressId), userId: new ObjectId(userId) },
      { $set: { isDefault: true, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      console.warn(`[addressService] Address ${addressId} not found for user ${userId} or was already default.`);
      // Check if it was already default
      const current = await addressesCollection.findOne({ _id: new ObjectId(addressId), userId: new ObjectId(userId) });
      return current?.isDefault === true;
    }
    
    console.log(`[addressService] Address ${addressId} set as default for user ${userId}.`);
    return true;
  } catch (error: any) {
    console.error(`[addressService] Error setting default address ${addressId} for user ${userId}:`, error.message);
    throw error;
  }
}

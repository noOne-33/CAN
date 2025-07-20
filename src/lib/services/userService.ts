
import { connectToDatabase } from '@/lib/mongodb';
import type { User, DbUser } from '@/types';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * Fetches all users from the 'users' collection.
 * Excludes the 'hashedPassword' field.
 */
export async function getUsers(): Promise<User[]> {
  console.log('[userService] getUsers called');
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<DbUser>('users');
    // Find all users and project to exclude hashedPassword
    const usersArray = await usersCollection.find({}, {
      projection: { hashedPassword: 0 }
    }).sort({ createdAt: -1 }).toArray();

    if (usersArray.length === 0) {
      console.log('[userService] No users found in the database.');
    } else {
      console.log(`[userService] Found ${usersArray.length} users in the database.`);
    }

    return usersArray.map(user => ({
      ...user,
      id: user._id.toString(), // Ensure _id is stringified to id
      _id: user._id.toString(),
    })) as User[];
  } catch (error: any) {
    console.error('[userService] Error in getUsers:', error.message);
    throw new Error('Failed to fetch users from database.');
  }
}

/**
 * Updates a user's role.
 */
export async function updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<User | null> {
  console.log(`[userService] updateUserRole called for userId: ${userId}, newRole: ${newRole}`);
  if (!ObjectId.isValid(userId)) {
    console.warn(`[userService] Invalid user ID format for role update: ${userId}`);
    throw new Error('Invalid user ID format.');
  }
  if (newRole !== 'user' && newRole !== 'admin') {
    throw new Error('Invalid role specified. Must be "user" or "admin".');
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<DbUser>('users');

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { role: newRole, updatedAt: new Date() } },
      { returnDocument: 'after', projection: { hashedPassword: 0 } }
    );

    if (!result) {
      console.warn(`[userService] User not found for role update with ID: ${userId}`);
      return null;
    }
    
    const updatedUser = result as DbUser | null;

    if (updatedUser) {
      console.log(`[userService] User role for ${userId} updated successfully to ${newRole}.`);
      return {
        ...updatedUser,
        id: updatedUser._id.toString(),
        _id: updatedUser._id.toString(),
      } as User;
    }
    return null;
  } catch (error: any) {
    console.error(`[userService] Error updating user role for ${userId}:`, error.message);
    throw new Error('Failed to update user role in database.');
  }
}

/**
 * Deletes a user by their ID.
 */
export async function deleteUser(userId: string): Promise<boolean> {
  console.log(`[userService] deleteUser called for ID: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    console.warn(`[userService] Invalid user ID format for deletion: ${userId}`);
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      console.warn(`[userService] User not found for deletion with ID: ${userId}`);
      return false;
    }
    
    console.log(`[userService] User ${userId} deleted successfully.`);
    return true;
  } catch (error: any) {
    console.error(`[userService] Error deleting user ${userId}:`, error.message);
    throw new Error('Failed to delete user from database.');
  }
}

/**
 * Fetches a single user by ID, excluding password.
 */
export async function getUserById(userId: string): Promise<User | null> {
    console.log(`[userService] getUserById called for ID: ${userId}`);
    if (!ObjectId.isValid(userId)) {
        console.warn(`[userService] Invalid user ID format: ${userId}`);
        return null;
    }

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection<DbUser>('users');
        const user = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { hashedPassword: 0 } }
        );

        if (!user) {
            console.warn(`[userService] User not found for ID: ${userId}`);
            return null;
        }
        
        console.log(`[userService] Fetched user: ${user.email}`);
        return {
            ...user,
            id: user._id.toString(),
            _id: user._id.toString(),
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
        } as User;
    } catch (error: any) {
        console.error(`[userService] Error fetching user by ID ${userId}:`, error.message);
        throw new Error('Failed to fetch user by ID from database.');
    }
}

/**
 * Updates user profile information (e.g., name, email, password).
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; email?: string; newPassword?: string }
): Promise<User | null> {
  console.log(`[userService] updateUserProfile called for userId: ${userId} with updates:`, JSON.stringify(updates, (key, value) => key === 'newPassword' ? '***' : value));
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format.');
  }

  const { db } = await connectToDatabase();
  const usersCollection = db.collection<DbUser>('users');

  const updatePayload: Partial<DbUser> & { updatedAt?: Date } = { updatedAt: new Date() };

  if (updates.name && typeof updates.name === 'string' && updates.name.trim() !== '') {
    updatePayload.name = updates.name.trim();
  }

  if (updates.email && typeof updates.email === 'string' && updates.email.trim() !== '') {
    const emailToUpdate = updates.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUpdate)) {
      throw new Error('Invalid email format.');
    }
    const existingUserWithEmail = await usersCollection.findOne({ email: emailToUpdate, _id: { $ne: new ObjectId(userId) } });
    if (existingUserWithEmail) {
      throw new Error('This email address is already in use by another account.');
    }
    updatePayload.email = emailToUpdate;
  }

  if (updates.newPassword && typeof updates.newPassword === 'string') {
    if (updates.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    updatePayload.hashedPassword = await bcrypt.hash(updates.newPassword, 10);
  }
  
  if (Object.keys(updatePayload).length === 1 && updatePayload.updatedAt) {
    console.log('[userService] No valid data updates provided for profile. Returning current user state.');
    const currentUser = await getUserById(userId);
    return currentUser;
  }

  const result = await usersCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updatePayload },
    { returnDocument: 'after', projection: { hashedPassword: 0 } }
  );

  if (!result) {
    console.warn(`[userService] User not found for profile update with ID: ${userId}`);
    return null;
  }

  const updatedUserDoc = result as DbUser;
  console.log(`[userService] User profile for ${userId} updated successfully.`);
  return {
    id: updatedUserDoc._id.toString(),
    _id: updatedUserDoc._id.toString(),
    name: updatedUserDoc.name,
    email: updatedUserDoc.email,
    role: updatedUserDoc.role,
    image: updatedUserDoc.image,
    createdAt: updatedUserDoc.createdAt?.toISOString(),
    updatedAt: updatedUserDoc.updatedAt?.toISOString(),
  } as User;
}

/**
 * Resets a user's password.
 * @param userId - The ID of the user whose password is to be reset.
 * @param newPassword - The new plain text password.
 * @returns True if the password was successfully reset, false otherwise.
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  console.log(`[userService] resetUserPassword called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    console.error('[userService] Invalid user ID format for password reset.');
    throw new Error('Invalid user ID format.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<DbUser>('users');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { hashedPassword, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.warn(`[userService] User not found for password reset: ${userId}`);
      return false;
    }
    console.log(`[userService] Password reset successfully for userId: ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`[userService] Error resetting password for userId ${userId}:`, error.message);
    throw error;
  }
}

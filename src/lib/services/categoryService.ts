
import { connectToDatabase } from '@/lib/mongodb';
import type { Category, Product } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches all categories from the 'categories' collection.
 */
export async function getCategories(): Promise<Category[]> {
  console.log('[categoryService] getCategories called');
  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection<Omit<Category, 'id' | 'productCount'>>('categories');
    const categoriesArray = await categoriesCollection.find({}).sort({ name: 1 }).toArray();

    if (categoriesArray.length === 0) {
      console.log('[categoryService] No categories found in the database.');
    } else {
      console.log(`[categoryService] Found ${categoriesArray.length} categories in the database.`);
    }

    return categoriesArray.map(cat => ({
      ...cat,
      _id: cat._id?.toString(),
      id: cat._id?.toString(),
      imageUrl: cat.imageUrl || '',
      aiHint: cat.aiHint || '',
    })) as Category[];
  } catch (error: any) {
    console.error('[categoryService] Error in getCategories:', error.message);
    return [];
  }
}

/**
 * Fetches all categories and includes a count of products for each.
 */
export async function getCategoriesWithProductCounts(): Promise<Category[]> {
  console.log('[categoryService] getCategoriesWithProductCounts called');
  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection<Omit<Category, 'id' | 'productCount'>>('categories');
    const productsCollection = db.collection<Product>('products');

    const categoriesArray = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
    const productsArray = await productsCollection.find({}, { projection: { category: 1 } }).toArray();

    const productCounts: Record<string, number> = {};
    productsArray.forEach(product => {
      if (product.category) {
        productCounts[product.category] = (productCounts[product.category] || 0) + 1;
      }
    });

    return categoriesArray.map(cat => ({
      ...cat,
      _id: cat._id?.toString(),
      id: cat._id?.toString(),
      imageUrl: cat.imageUrl || '',
      aiHint: cat.aiHint || cat.name.toLowerCase(), // Fallback AI hint
      productCount: productCounts[cat.name] || 0,
    })) as Category[];

  } catch (error: any) {
    console.error('[categoryService] Error in getCategoriesWithProductCounts:', error.message);
    return [];
  }
}


/**
 * Adds a new category to the 'categories' collection.
 * Checks for uniqueness by name (case-insensitive).
 */
export async function addCategory(name: string, imageUrl?: string, aiHint?: string): Promise<Category | null> {
  console.log(`[categoryService] addCategory called for name: ${name}`);
  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection<Omit<Category, 'id' | 'productCount'>>('categories');

    const existingCategory = await categoriesCollection.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingCategory) {
      console.warn(`[categoryService] Category "${name}" already exists.`);
      throw new Error(`Category "${name}" already exists.`);
    }

    const newCategoryDocument: Omit<Category, '_id' | 'id' | 'productCount'> = {
      name: name.trim(),
      imageUrl: imageUrl?.trim() || '',
      aiHint: aiHint?.trim() || name.trim().toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await categoriesCollection.insertOne(newCategoryDocument as any);
    if (!result.insertedId) {
      console.error('[categoryService] Failed to insert category into database.');
      throw new Error('Failed to create category in database.');
    }

    const createdCategory: Category = {
      _id: result.insertedId.toString(),
      id: result.insertedId.toString(),
      name: newCategoryDocument.name,
      imageUrl: newCategoryDocument.imageUrl,
      aiHint: newCategoryDocument.aiHint,
      createdAt: newCategoryDocument.createdAt,
      updatedAt: newCategoryDocument.updatedAt,
    };
    
    console.log('[categoryService] Category created successfully:', createdCategory._id);
    return createdCategory;

  } catch (error: any) {
    console.error(`[categoryService] Error in addCategory for "${name}":`, error.message);
    throw error;
  }
}

/**
 * Updates an existing category's name, imageUrl, and aiHint.
 * Checks for uniqueness by name (case-insensitive), excluding the current category.
 */
export async function updateCategory(categoryId: string, name: string, imageUrl?: string, aiHint?: string): Promise<Category | null> {
  console.log(`[categoryService] updateCategory called for ID: ${categoryId}`);
  if (!ObjectId.isValid(categoryId)) {
    console.warn(`[categoryService] Invalid category ID format for update: ${categoryId}`);
    throw new Error('Invalid category ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection<Category>('categories');

    const trimmedName = name.trim();
    const existingCategoryWithNewName = await categoriesCollection.findOne({
      name: { $regex: `^${trimmedName}$`, $options: 'i' },
      _id: { $ne: new ObjectId(categoryId) },
    });

    if (existingCategoryWithNewName) {
      console.warn(`[categoryService] Another category with name "${trimmedName}" already exists.`);
      throw new Error(`Another category named "${trimmedName}" already exists.`);
    }

    const updatePayload: Partial<Category> = {
      name: trimmedName,
      updatedAt: new Date(),
    };
    if (imageUrl !== undefined) {
        updatePayload.imageUrl = imageUrl.trim();
    }
    if (aiHint !== undefined) {
        updatePayload.aiHint = aiHint.trim() || trimmedName.toLowerCase();
    }


    const result = await categoriesCollection.findOneAndUpdate(
      { _id: new ObjectId(categoryId) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.warn(`[categoryService] Category not found for update with ID: ${categoryId}`);
      throw new Error('Category not found or update failed.');
    }
    
    const updatedDoc = result as Category | null;

    if (updatedDoc) {
         console.log(`[categoryService] Category ${categoryId} updated successfully.`);
         return {
            ...updatedDoc,
            _id: updatedDoc._id?.toString(),
            id: updatedDoc._id?.toString(),
         } as Category;
    }
    return null;

  } catch (error: any) {
    console.error(`[categoryService] Error updating category ${categoryId}:`, error.message);
    throw error;
  }
}

/**
 * Deletes a category by its ID.
 */
export async function deleteCategory(categoryId: string): Promise<boolean> {
  console.log(`[categoryService] deleteCategory called for ID: ${categoryId}`);
  if (!ObjectId.isValid(categoryId)) {
    console.warn(`[categoryService] Invalid category ID format for deletion: ${categoryId}`);
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection('categories');
    const result = await categoriesCollection.deleteOne({ _id: new ObjectId(categoryId) });

    if (result.deletedCount === 0) {
      console.warn(`[categoryService] Category not found for deletion with ID: ${categoryId}`);
      return false;
    }
    
    console.log(`[categoryService] Category ${categoryId} deleted successfully.`);
    return true;
  } catch (error: any) {
    console.error(`[categoryService] Error deleting category ${categoryId}:`, error.message);
    return false;
  }
}


import { connectToDatabase } from '@/lib/mongodb';
import type { Product, ProductSpecification } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches all products for the admin panel.
 * Can be expanded with filtering, sorting, and pagination parameters.
 */
export async function getAdminProducts(): Promise<Product[]> {
  console.log('[productService] getAdminProducts called');
  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    const productsArray = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const productsWithStringIds = productsArray.map(p => ({
      ...p,
      _id: p._id ? p._id.toString() : undefined,
      id: p._id ? p._id.toString() : undefined, // Ensure id is also populated
      discountType: p.discountType || undefined,
      discountValue: p.discountValue === null || p.discountValue === 0 ? undefined : p.discountValue,
      colors: p.colors.map(color => ({
        ...color,
      })),
      specifications: p.specifications || [], // Ensure specifications array exists
    }));

    console.log(`[productService] Fetched ${productsWithStringIds.length} products for admin.`);
    return productsWithStringIds as Product[];
  } catch (error: any) {
    console.error('[productService] Error in getAdminProducts:', error.message);
    return [];
  }
}

/**
 * Fetches products for public display, with an optional limit.
 */
export async function getPublicProducts(limit?: number): Promise<Product[]> {
  console.log(`[productService] getPublicProducts called with limit: ${limit}`);
  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');
    
    const query = productsCollection.find({}).sort({ createdAt: -1 });

    if (limit && limit > 0) {
      query.limit(limit);
    }

    const productsArray = await query.toArray();
    const productsWithStringIds = productsArray.map(p => ({
      ...p,
      _id: p._id ? p._id.toString() : undefined,
      id: p._id ? p._id.toString() : undefined, // Ensure id is also populated
      discountType: p.discountType || undefined,
      discountValue: p.discountValue === null || p.discountValue === 0 ? undefined : p.discountValue,
      colors: p.colors.map(color => ({
        ...color,
      })),
      specifications: p.specifications || [], // Ensure specifications array exists
    }));
    
    console.log(`[productService] Fetched ${productsWithStringIds.length} public products.`);
    return productsWithStringIds as Product[];
  } catch (error: any) {
    console.error('[productService] Error in getPublicProducts:', error.message);
    return [];
  }
}


/**
 * Fetches a single product by its ID.
 */
export async function getProductById(productId: string): Promise<Product | null> {
  console.log(`[productService] getProductById called for ID: ${productId}`);
  if (!ObjectId.isValid(productId)) {
    console.warn(`[productService] Invalid product ID format: ${productId}`);
    return null;
  }

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      console.warn(`[productService] Product not found for ID: ${productId}`);
      return null;
    }
    
    const productWithStringId = {
        ...product,
        _id: product._id.toString(),
        id: product._id.toString(), // Ensure id is also populated
        discountType: product.discountType || undefined,
        discountValue: product.discountValue === null || product.discountValue === 0 ? undefined : product.discountValue,
        specifications: product.specifications || [], // Ensure specifications array exists
    };
    console.log(`[productService] Fetched product: ${productWithStringId.name}`);
    return productWithStringId as Product;
  } catch (error: any) {
    console.error(`[productService] Error fetching product by ID ${productId}:`, error.message);
    return null;
  }
}

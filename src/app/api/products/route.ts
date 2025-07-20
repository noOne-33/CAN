
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicProducts, getProductById } from '@/lib/services/productService';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const productId = searchParams.get('id');
  const limitParam = searchParams.get('limit');

  console.log(`[API /api/products] GET request. URL: ${req.url}`);
  console.log(`[API /api/products] Parsed productId: '${productId}', limitParam: '${limitParam}'`);

  try {
    if (productId) {
      console.log(`[API /api/products] Attempting to fetch single product with ID: ${productId} via service.`);
      if (!ObjectId.isValid(productId)) {
        console.warn(`[API /api/products] Invalid product ID format: ${productId}`);
        return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
      }
      const product = await getProductById(productId);
      if (!product) {
        console.warn(`[API /api/products] Product not found for ID: ${productId}`);
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
      console.log(`[API /api/products] Returning single product: ${product._id}`);
      return NextResponse.json(product, { status: 200 });
    } else {
      console.log(`[API /api/products] Attempting to fetch multiple products via service.`);
      let limit: number | undefined = undefined;
      if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
          console.log(`[API /api/products] Applying limit: ${limit}`);
        } else {
          console.log(`[API /api/products] Invalid or zero limit value: '${limitParam}'. Not applying limit.`);
        }
      } else {
        console.log('[API /api/products] No limit parameter provided for service call.');
      }
      
      const productsArray = await getPublicProducts(limit);
      
      console.log(`[API /api/products] Returning ${productsArray.length} products from service.`);
      return NextResponse.json(productsArray, { status: 200 });
    }
  } catch (error: any) {
    console.error('[API /api/products] Critical error in route handler:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products due to a server error.', error: error.message, details: error.stack },
      { status: 500 }
    );
  }
}

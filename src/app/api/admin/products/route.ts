
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product, ProductColor, ProductSpecification } from '@/types';
import { ObjectId } from 'mongodb';
import { getAdminProducts } from '@/lib/services/productService';


export async function GET(req: NextRequest) {
  console.log('[API /api/admin/products] GET request received');
  try {
    const products = await getAdminProducts();
    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/products] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch products', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[API /api/admin/products] POST request received');
  try {
    const body: Omit<Product, '_id' | 'id' | 'createdAt' | 'updatedAt'> = await req.json();
    console.log('[API /api/admin/products] Request body:', body);

    const { name, description, price, discountType, discountValue, category, imageUrls, colors, sizes, stock, aiHint, specifications } = body;

    if (!name || !description || price === undefined || !category || !imageUrls || imageUrls.length === 0 || !colors || stock === undefined ) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
     if (discountType === 'fixed' && discountValue && discountValue >= price) {
      return NextResponse.json({ message: 'Fixed discount value must be less than the regular price.' }, { status: 400 });
    }
    if (discountType === 'percentage' && discountValue && (discountValue < 1 || discountValue > 99)) {
      return NextResponse.json({ message: 'Percentage discount must be between 1 and 99.' }, { status: 400 });
    }
    if (discountValue && discountValue > 0 && !discountType) {
        return NextResponse.json({ message: 'Discount type is required if discount value is provided.' }, { status: 400 });
    }


    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    const newProduct: Omit<Product, '_id' | 'id'> = {
      name,
      description,
      price: Number(price),
      discountType: discountType || undefined,
      discountValue: (discountValue && discountValue > 0 && discountType) ? Number(discountValue) : undefined,
      category,
      imageUrls,
      colors: colors.map(c => ({ ...c, image: c.image || imageUrls[0] })), 
      sizes: sizes || [], 
      specifications: specifications || [], // Add specifications
      stock: Number(stock),
      aiHint: aiHint || category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (!newProduct.discountType) {
        delete newProduct.discountValue;
    }


    const result = await productsCollection.insertOne(newProduct as any); 
    
    if (!result.insertedId) {
      console.error('[API /api/admin/products] Failed to insert product into database.');
      return NextResponse.json({ message: 'Failed to create product' }, { status: 500 });
    }

    const createdProduct = {
      _id: result.insertedId.toString(),
      ...newProduct,
    };
    
    console.log('[API /api/admin/products] Product created successfully:', createdProduct._id);
    return NextResponse.json(createdProduct, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/admin/products] POST Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create product', error: error.message }, { status: 500 });
  }
}

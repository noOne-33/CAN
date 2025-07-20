
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Product, ProductColor, ProductSpecification } from '@/types';
import { getProductById } from '@/lib/services/productService';

// GET a single product by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/products/[id]] GET request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const product = await getProductById(id); 
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/products/[id]] GET Error for ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch product', error: error.message }, { status: 500 });
  }
}


// PUT (Update) a product by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/products/[id]] PUT request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const body: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>> & { _id?: string } = await req.json();
    console.log(`[API /api/admin/products/[id]] Update body for ID ${id}:`, body);

    const { _id, ...updateData } = body; 

    const { name, description, price, discountType, discountValue, category, imageUrls, colors, sizes, stock, aiHint, specifications } = updateData;

    if (!name || !description || price === undefined || !category || !imageUrls || imageUrls.length === 0 || !colors || stock === undefined ) {
      return NextResponse.json({ message: 'Missing required fields for update' }, { status: 400 });
    }
    if (discountType === 'fixed' && discountValue && Number(discountValue) >= Number(price)) {
        return NextResponse.json({ message: 'Fixed discount value must be less than the regular price.' }, { status: 400 });
    }
    if (discountType === 'percentage' && discountValue && (Number(discountValue) < 1 || Number(discountValue) > 99)) {
      return NextResponse.json({ message: 'Percentage discount must be between 1 and 99.' }, { status: 400 });
    }
    if (discountValue && Number(discountValue) > 0 && !discountType) {
        return NextResponse.json({ message: 'Discount type is required if discount value is provided and positive.' }, { status: 400 });
    }


    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    const productToUpdate: Partial<Product> = {
      name,
      description,
      price: Number(price),
      category,
      imageUrls,
      colors: colors.map(c => ({ ...c, image: c.image || imageUrls[0] })),
      sizes: sizes || [],
      specifications: specifications || [], // Add specifications
      stock: Number(stock),
      aiHint: aiHint || category,
      updatedAt: new Date(),
    };
    
    const $setPayload: any = {...productToUpdate};
    const $unsetPayload: any = {};

    if (discountType && discountValue && Number(discountValue) > 0) {
        $setPayload.discountType = discountType;
        $setPayload.discountValue = Number(discountValue);
    } else {
        $unsetPayload.discountType = "";
        $unsetPayload.discountValue = "";
    }
    
    const updateOperation: any = { $set: $setPayload };
    if (Object.keys($unsetPayload).length > 0) {
        updateOperation.$unset = $unsetPayload;
    }

    const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        updateOperation
    );
    
    if (result.matchedCount === 0) {
        return NextResponse.json({ message: 'Product not found for update' }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount > 0) {
         console.log(`[API /api/admin/products/[id]] Product ${id} data was the same, no modification needed.`);
    }
    
    const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!updatedProduct) return NextResponse.json({ message: 'Product not found after successful update operation' }, { status: 404 });

    const productWithStringId = { 
      ...updatedProduct, 
      _id: updatedProduct._id.toString(),
      discountType: updatedProduct.discountType || undefined, 
      discountValue: updatedProduct.discountValue === null || updatedProduct.discountValue === 0 ? undefined : updatedProduct.discountValue,
    };

    console.log(`[API /api/admin/products/[id]] Product ${id} updated successfully.`);
    return NextResponse.json(productWithStringId, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/products/[id]] PUT Error for ID ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update product', error: error.message }, { status: 500 });
  }
}

// DELETE a product by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/products/[id]] DELETE request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Product not found for deletion' }, { status: 404 });
    }

    console.log(`[API /api/admin/products/[id]] Product ${id} deleted successfully.`);
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/products/[id]] DELETE Error for ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete product', error: error.message }, { status: 500 });
  }
}

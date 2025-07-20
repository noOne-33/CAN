import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product } from '@/types';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ message: 'Search query must be at least 2 characters long.' }, { status: 400 });
  }

  console.log(`[API /api/search] GET request for query: "${query}"`);

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    const regex = new RegExp(query, 'i'); // Case-insensitive regex

    const searchResults = await productsCollection.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { category: { $regex: regex } }
      ]
    }).limit(10).toArray(); // Limit to 10 results for performance

    const productsWithStringIds = searchResults.map(p => ({
      ...p,
      _id: p._id ? p._id.toString() : undefined,
      id: p._id ? p._id.toString() : undefined,
      imageUrls: p.imageUrls || [],
      colors: p.colors || [],
    }));
    
    return NextResponse.json(productsWithStringIds, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/search] Critical error for query "${query}":`, error);
    return NextResponse.json(
      { message: 'Failed to perform search due to a server error.', error: error.message },
      { status: 500 }
    );
  }
}

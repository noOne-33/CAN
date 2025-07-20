
import { NextResponse, type NextRequest } from 'next/server';
import { getCategories, addCategory } from '@/lib/services/categoryService'; // getCategories is not used here but kept for consistency
import type { Category } from '@/types';

export async function GET(req: NextRequest) {
  console.log('[API /api/admin/categories] GET request received');
  try {
    // For admin, we might want a version that includes product counts eventually,
    // but for a generic GET, simple categories are fine. The page.tsx can use a more specific service call.
    const categories = await getCategories(); 
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/categories] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch categories', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[API /api/admin/categories] POST request received');
  try {
    const body: { name: string; imageUrl?: string; aiHint?: string } = await req.json();
    console.log('[API /api/admin/categories] Request body:', body);

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ message: 'Category name is required and must be a non-empty string.' }, { status: 400 });
    }

    const newCategory = await addCategory(body.name.trim(), body.imageUrl, body.aiHint);
    
    console.log('[API /api/admin/categories] Category created successfully:', newCategory?._id);
    return NextResponse.json(newCategory, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/admin/categories] POST Error:', error);
    if (error.message.includes("already exists")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create category', error: error.message }, { status: 500 });
  }
}

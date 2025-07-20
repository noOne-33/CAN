
import { NextResponse, type NextRequest } from 'next/server';
import { deleteCategory, updateCategory } from '@/lib/services/categoryService';
import { ObjectId } from 'mongodb';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/categories/[id]] DELETE request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
  }

  try {
    const success = await deleteCategory(id);

    if (!success) {
      return NextResponse.json({ message: 'Category not found or failed to delete' }, { status: 404 });
    }

    console.log(`[API /api/admin/categories/[id]] Category ${id} deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/categories/[id]] DELETE Error for ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete category', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/categories/[id]] PUT request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
  }

  try {
    const body: { name: string; imageUrl?: string; aiHint?: string } = await req.json();
    console.log(`[API /api/admin/categories/[id]] Update body for ID ${id}:`, body);

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ message: 'New category name is required and must be a non-empty string.' }, { status: 400 });
    }

    const updatedCategory = await updateCategory(id, body.name.trim(), body.imageUrl, body.aiHint);
    
    if (!updatedCategory) {
        return NextResponse.json({ message: 'Category not found or update failed for an unknown reason.' }, { status: 404 });
    }
    
    console.log(`[API /api/admin/categories/[id]] Category ${id} updated successfully.`);
    return NextResponse.json(updatedCategory, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/categories/[id]] PUT Error for ID ${id}:`, error);
    if (error.message.includes("already exists")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update category', error: error.message }, { status: 500 });
  }
}

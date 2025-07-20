
import { NextResponse, type NextRequest } from 'next/server';
import { updateUserRole, deleteUser, getUserById } from '@/lib/services/userService';
import { ObjectId } from 'mongodb';
import type { User } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/users/[id]] GET request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/admin/users/[id]] GET Error for ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user', error: error.message }, { status: 500 });
  }
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/users/[id]] PUT request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const body: { role: 'user' | 'admin' } = await req.json();
    console.log(`[API /api/admin/users/[id]] Update role body for ID ${id}:`, body);

    if (!body.role || (body.role !== 'user' && body.role !== 'admin')) {
      return NextResponse.json({ message: 'Invalid role specified. Must be "user" or "admin".' }, { status: 400 });
    }

    const updatedUser = await updateUserRole(id, body.role);
    
    if (!updatedUser) {
        return NextResponse.json({ message: 'User not found or update failed.' }, { status: 404 });
    }
    
    console.log(`[API /api/admin/users/[id]] User role for ${id} updated successfully.`);
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/users/[id]] PUT Error for ID ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update user role', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API /api/admin/users/[id]] DELETE request for ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const success = await deleteUser(id);

    if (!success) {
      return NextResponse.json({ message: 'User not found or failed to delete' }, { status: 404 });
    }

    console.log(`[API /api/admin/users/[id]] User ${id} deleted successfully.`);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/admin/users/[id]] DELETE Error for ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
  }
}


import { NextResponse, type NextRequest } from 'next/server';
import { getUsers } from '@/lib/services/userService';

export async function GET(req: NextRequest) {
  console.log('[API /api/admin/users] GET request received');
  try {
    const users = await getUsers();
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/users] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}

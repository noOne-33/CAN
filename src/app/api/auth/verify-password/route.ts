
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { connectToDatabase } from '@/lib/mongodb';
import type { DbUser } from '@/types';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  console.log('[API /api/auth/verify-password] POST request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ message: 'Password is required for verification.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection<DbUser>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user || !user.hashedPassword) {
      // This case should ideally not happen for an authenticated user
      console.error(`[API /api/auth/verify-password] User ${userId} not found or has no hashed password.`);
      return NextResponse.json({ message: 'Could not verify password. User data incomplete.' }, { status: 500 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Incorrect password provided.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/verify-password] POST Error:', error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to verify password due to a server error.', error: error.message }, { status: 500 });
  }
}

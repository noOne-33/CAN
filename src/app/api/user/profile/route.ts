
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getUserById, updateUserProfile } from '@/lib/services/userService';
import type { User, DbUser } from '@/types';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  console.log('[API /api/user/profile] GET request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/user/profile] GET Error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch user profile.', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  console.log('[API /api/user/profile] PUT request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = await req.json();

    const updatesForService: { name?: string; email?: string; newPassword?: string } = {};
    let emailChanged = false;

    if (body.name && typeof body.name === 'string' && body.name.trim() !== '') {
      updatesForService.name = body.name.trim();
    }

    if (body.email && typeof body.email === 'string' && body.email.trim() !== '') {
      updatesForService.email = body.email.trim().toLowerCase();
      emailChanged = true;
    }

    if (body.newPassword && typeof body.newPassword === 'string') {
      if (!body.currentPassword) {
        return NextResponse.json({ message: 'Current password is required to change your password.' }, { status: 400 });
      }
      // New password length validation will be handled by the service.

      const { db } = await connectToDatabase();
      const usersCollection = db.collection<DbUser>('users');
      const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!currentUser || !currentUser.hashedPassword) {
        return NextResponse.json({ message: 'Could not verify current password. User data incomplete.' }, { status: 500 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(body.currentPassword, currentUser.hashedPassword);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ message: 'Incorrect current password.' }, { status: 403 });
      }
      updatesForService.newPassword = body.newPassword;
    }
    
    if (Object.keys(updatesForService).length === 0) {
      const currentUserProfile = await getUserById(userId);
      if (!currentUserProfile) {
           return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }
      return NextResponse.json(currentUserProfile, { status: 200 });
    }

    const updatedUser = await updateUserProfile(userId, updatesForService);
    if (!updatedUser) {
      return NextResponse.json({ message: 'Failed to update profile or user not found.' }, { status: 404 });
    }
    
    const responsePayload: any = { ...updatedUser };
    if (emailChanged) {
        responsePayload.message = "Email updated successfully. Please log out and log back in for the change to take full effect across the application.";
    }


    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/user/profile] PUT Error:', error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    if (error.message === 'Invalid email format.' || error.message === 'This email address is already in use by another account.' || error.message === 'New password must be at least 6 characters long.') {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update user profile.', error: error.message }, { status: 500 });
  }
}

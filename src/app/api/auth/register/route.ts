
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { User } from '@/types'; // Assuming your User type is here

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields: name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const { db } = await connectToDatabase(); // This might throw if MONGODB_URI is missing
    const usersCollection = db.collection<Omit<User, 'id'> & { hashedPassword?: string; createdAt: Date; } >('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      hashedPassword,
      role: 'user' as 'user' | 'admin', // Default role
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({ message: 'User registered successfully', userId: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
     if (error.message && (error.message.includes('MONGODB_URI is not defined') || error.message.includes('Could not connect to the database'))) {
        return NextResponse.json({ message: 'Database connection error. Please contact support.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Internal server error during registration.' }, { status: 500 });
  }
}

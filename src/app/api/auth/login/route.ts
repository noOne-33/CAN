
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types'; // Assuming your User type is here

// JWT_SECRET will be checked inside the POST handler.

interface StoredUser extends Omit<User, 'id'> {
  _id: import('mongodb').ObjectId;
  hashedPassword?: string;
  createdAt: Date;
}

export async function POST(req: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || JWT_SECRET === 'YOUR_STRONG_RANDOM_SECRET_HERE_CHANGE_ME' || JWT_SECRET.length < 32) {
    console.error('------------------------------------------------------');
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined, is a placeholder, or is too short.');
    console.error('Please ensure JWT_SECRET is correctly set in your .env file.');
    console.error('Generate a strong secret with the command:');
    console.error('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('and add it to your .env file like this:');
    console.error('JWT_SECRET=your_generated_secret_string_here');
    console.error('------------------------------------------------------');
    return NextResponse.json({ message: 'Authentication system configuration error. Please contact support.' }, { status: 500 });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase(); // This might throw if MONGODB_URI is missing
    const usersCollection = db.collection<StoredUser>('users');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.hashedPassword) {
        console.error(`User ${email} does not have a hashed password. This might indicate an issue with the user account creation process.`);
        return NextResponse.json({ message: 'Authentication error: Account data is incomplete.' }, { status: 500 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(), // ensure id is string
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login API error:', error);
    // Differentiate between known configuration errors and general errors
    if (error.message && (error.message.includes('MONGODB_URI is not defined') || error.message.includes('Could not connect to the database'))) {
        return NextResponse.json({ message: 'Database connection error. Please contact support.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Internal server error during login.' }, { status: 500 });
  }
}

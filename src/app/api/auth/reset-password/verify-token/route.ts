
import { NextResponse, type NextRequest } from 'next/server';
import { verifyPasswordResetToken } from '@/lib/services/passwordResetService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  console.log(`[API /api/auth/reset-password/verify-token] GET request for token: ${token ? token.substring(0,10) + '...' : 'null'}`);

  if (!token) {
    return NextResponse.json({ valid: false, message: 'Reset token is missing.' }, { status: 400 });
  }

  try {
    const tokenDoc = await verifyPasswordResetToken(token);
    if (tokenDoc) {
      return NextResponse.json({ valid: true, message: 'Token is valid.' }, { status: 200 });
    } else {
      return NextResponse.json({ valid: false, message: 'Invalid or expired reset token.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[API /api/auth/reset-password/verify-token] Error verifying token:', error.message);
    return NextResponse.json({ valid: false, message: 'Failed to verify token due to a server error.' }, { status: 500 });
  }
}

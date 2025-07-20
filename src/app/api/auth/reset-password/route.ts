
import { NextResponse, type NextRequest } from 'next/server';
import { verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/services/passwordResetService';
import { resetUserPassword } from '@/lib/services/userService';

export async function POST(req: NextRequest) {
  console.log('[API /api/auth/reset-password] POST request received');
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Token and new password are required.' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const tokenDoc = await verifyPasswordResetToken(token);
    if (!tokenDoc) {
      return NextResponse.json({ message: 'Invalid or expired reset token. Please request a new link.' }, { status: 400 });
    }

    const passwordResetSuccess = await resetUserPassword(tokenDoc.userId.toString(), newPassword);
    if (!passwordResetSuccess) {
      // This might happen if the user was deleted in the meantime, etc.
      return NextResponse.json({ message: 'Failed to reset password. User not found or update error.' }, { status: 500 });
    }

    // Invalidate the token after successful password reset
    await deletePasswordResetToken(tokenDoc._id);

    console.log(`[API /api/auth/reset-password] Password reset successfully for user: ${tokenDoc.userId.toString()}`);
    return NextResponse.json({ message: 'Password has been successfully reset. You can now log in with your new password.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/reset-password] Error:', error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An error occurred while resetting your password. Please try again.' }, { status: 500 });
  }
}

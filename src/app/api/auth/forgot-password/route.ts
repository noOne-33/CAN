
import { NextResponse, type NextRequest } from 'next/server';
import { requestPasswordReset } from '@/lib/services/passwordResetService';

export async function POST(req: NextRequest) {
  console.log('[API /api/auth/forgot-password] POST request received');
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Valid email is required.' }, { status: 400 });
    }

    // The requestPasswordReset service now handles finding the user,
    // generating the token, and attempting to send the email.
    // It returns true if the email was found and an email attempt was made, false otherwise.
    // We don't differentiate responses to client for security (email enumeration).
    await requestPasswordReset(email.toLowerCase());

    // Always return a generic success message
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';
    console.log(`[API /api/auth/forgot-password] Responded to client for email ${email}: "${successMessage}"`);
    return NextResponse.json({ message: successMessage }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/forgot-password] Error:', error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // If error came from emailService (e.g. misconfigured), it will be logged there.
    // We still return a generic message to client.
    return NextResponse.json({ message: 'An error occurred while processing your request. Please try again.' }, { status: 500 });
  }
}

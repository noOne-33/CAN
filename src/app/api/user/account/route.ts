
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { deleteUser } from '@/lib/services/userService';

export async function DELETE(req: NextRequest) {
  console.log('[API /api/user/account] DELETE request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in to delete your account.' }, { status: 401 });
    }

    // Potentially, you might want to add a check here if the user needs to confirm their password
    // before deleting their account, but for now, we'll proceed directly.

    const success = await deleteUser(userId);

    if (success) {
      console.log(`[API /api/user/account] User account ${userId} deleted successfully.`);
      // The client will handle clearing local storage and redirecting.
      return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });
    } else {
      // This might happen if the user was already deleted or an issue occurred in the service.
      console.warn(`[API /api/user/account] Failed to delete account for user ${userId}. User not found or service error.`);
      return NextResponse.json({ message: 'Failed to delete account. User may not exist or an internal error occurred.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('[API /api/user/account] DELETE Error:', error.message);
    // Differentiate error types if needed
    if (error.message.includes('Invalid user ID format')) {
        return NextResponse.json({ message: 'Invalid user ID format for deletion.', error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to delete account due to a server error.', error: error.message }, { status: 500 });
  }
}

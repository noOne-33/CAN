
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { setDefaultAddress } from '@/lib/services/addressService';

export async function POST(req: NextRequest, { params }: { params: { addressId: string } }) {
  const { addressId } = params;
  console.log(`[API /api/user/addresses/${addressId}/default] POST request received`);
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const success = await setDefaultAddress(addressId, userId);
    if (!success) {
      // This could mean the address wasn't found, or it was already default.
      // The service layer handles the "already default" case gracefully.
      return NextResponse.json({ message: 'Failed to set default address or address not found.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Address set as default successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/user/addresses/${addressId}/default] POST Error:`, error.message);
    if (error.message.includes('Invalid ID format')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to set default address.', error: error.message }, { status: 500 });
  }
}

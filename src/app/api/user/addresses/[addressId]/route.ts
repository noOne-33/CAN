
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { updateAddress, deleteAddress } from '@/lib/services/addressService';
import type { ShippingAddress } from '@/types';

export async function PUT(req: NextRequest, { params }: { params: { addressId: string } }) {
  const { addressId } = params;
  console.log(`[API /api/user/addresses/${addressId}] PUT request received`);
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const body: Partial<Omit<ShippingAddress, 'isDefault'> & { isDefault?: boolean }> = await req.json();
    const updatedAddress = await updateAddress(addressId, userId, body);

    if (!updatedAddress) {
      return NextResponse.json({ message: 'Address not found or update failed.' }, { status: 404 });
    }
    return NextResponse.json(updatedAddress, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/user/addresses/${addressId}] PUT Error:`, error.message);
    if (error.message.includes('Invalid ID format')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update address.', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { addressId: string } }) {
  const { addressId } = params;
  console.log(`[API /api/user/addresses/${addressId}] DELETE request received`);
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const success = await deleteAddress(addressId, userId);
    if (!success) {
      return NextResponse.json({ message: 'Address not found or delete failed.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Address deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /api/user/addresses/${addressId}] DELETE Error:`, error.message);
    if (error.message.includes('Invalid ID format')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to delete address.', error: error.message }, { status: 500 });
  }
}

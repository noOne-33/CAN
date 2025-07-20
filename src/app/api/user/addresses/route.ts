
import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/authUtils';
import { getAddressesByUserId, addAddress } from '@/lib/services/addressService';
import type { ShippingAddress } from '@/types';

export async function GET(req: NextRequest) {
  console.log('[API /api/user/addresses] GET request received');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const addresses = await getAddressesByUserId(userId);
    return NextResponse.json(addresses, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/user/addresses] GET Error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch addresses.', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[API /api/user/addresses] POST request received to add address');
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body: Omit<ShippingAddress, 'isDefault'> & { isDefault?: boolean } = await req.json();
    
    // Basic validation (more robust validation should be in Zod schema on client/service)
    if (!body.fullName || !body.phone || !body.streetAddress || !body.city || !body.postalCode || !body.country) {
      return NextResponse.json({ message: 'Missing required address fields.' }, { status: 400 });
    }

    const newAddress = await addAddress(userId, body);
    return NextResponse.json(newAddress, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/user/addresses] POST Error:', error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to add address.', error: error.message }, { status: 500 });
  }
}

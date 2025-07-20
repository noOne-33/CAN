// This file is no longer needed as localStorage cart sync is removed.
// Keeping it empty or deleting it would be appropriate.
// For this operation, I will leave it empty to signify its removal from functionality.
// If you have a CI/CD or build process that checks for empty files, consider deleting it.
// For now, to make the change explicit:

import { NextResponse } from 'next/server';

export async function POST() {
  console.warn('[API /api/cart/sync] This endpoint is deprecated and should not be called. Cart sync is handled differently or removed.');
  return NextResponse.json({ message: 'This cart sync endpoint is deprecated.' }, { status: 410 }); // 410 Gone
}

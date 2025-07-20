
import { NextResponse, type NextRequest } from 'next/server';
import { getSocialLinks, upsertSocialLinks } from '@/lib/services/siteSettingsService';
import type { SocialLinks } from '@/types';

// GET the social links data
export async function GET(req: NextRequest) {
  // TODO: Add admin role check
  console.log('[API /api/admin/social-links] GET request received');
  try {
    const links = await getSocialLinks();
    // Return empty strings for any missing links to ensure form fields are controlled
    const responseLinks = {
      facebook: links.facebook || '',
      instagram: links.instagram || '',
      twitter: links.twitter || '',
      youtube: links.youtube || '',
    };
    return NextResponse.json(responseLinks, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/social-links] GET Error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch social links.', error: error.message }, { status: 500 });
  }
}

// POST (Upsert) the social links data
export async function POST(req: NextRequest) {
    // TODO: Add admin role check
    console.log('[API /api/admin/social-links] POST request received');
    try {
        const body: SocialLinks = await req.json();

        // Basic validation can be done here, but Zod on the client handles it well.
        // We can just pass the data to the service.
        
        const updatedLinks = await upsertSocialLinks(body);
        return NextResponse.json(updatedLinks, { status: 200 });
    } catch (error: any) {
        console.error('[API /api/admin/social-links] POST Error:', error.message);
        return NextResponse.json({ message: 'Failed to update social links.', error: error.message }, { status: 500 });
    }
}

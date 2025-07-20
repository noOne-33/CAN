
import { NextResponse, type NextRequest } from 'next/server';
import { getFeaturedBanner, upsertFeaturedBanner } from '@/lib/services/featuredBannerService';
import type { FeaturedBanner } from '@/types';

// GET the banner data
export async function GET(req: NextRequest) {
  // TODO: Add admin role check
  console.log('[API /api/admin/featured-banner] GET request received');
  try {
    const banner = await getFeaturedBanner();
    if (!banner) {
      // Return a default structure if no banner exists yet, to prevent errors in the form
      return NextResponse.json({
        title: 'Exclusive Deals - Limited Time Only!',
        subtitle: 'Grab a chance to buy your desired clothes and accessories at unbeatable prices. Don\'t miss out on these amazing offers.',
        buttonText: 'Shop Now',
        buttonLink: '/shop?filter=deals',
        imageUrl: 'https://placehold.co/600x450.png',
        aiHint: 'clothing store interior'
      }, { status: 200 });
    }
    return NextResponse.json(banner, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/featured-banner] GET Error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch featured banner.', error: error.message }, { status: 500 });
  }
}

// POST (Upsert) the banner data
export async function POST(req: NextRequest) {
    // TODO: Add admin role check
    console.log('[API /api/admin/featured-banner] POST request received');
    try {
        const body: Omit<FeaturedBanner, 'id' | '_id' | 'updatedAt'> = await req.json();

        // Basic validation
        if (!body.title || !body.subtitle || !body.imageUrl || !body.buttonText || !body.buttonLink) {
            return NextResponse.json({ message: 'Missing required banner fields.' }, { status: 400 });
        }
        
        const updatedBanner = await upsertFeaturedBanner(body);
        return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error: any) {
        console.error('[API /api/admin/featured-banner] POST Error:', error.message);
        return NextResponse.json({ message: 'Failed to update featured banner.', error: error.message }, { status: 500 });
    }
}


import { NextResponse, type NextRequest } from 'next/server';
import { getActiveHeroSlides } from '@/lib/services/heroSlideService';
import type { HeroSlide } from '@/types';

export async function GET(req: NextRequest) {
  console.log('[API /api/hero-slides] GET request received for public hero slides');
  try {
    const activeSlides: HeroSlide[] = await getActiveHeroSlides();
    
    if (!activeSlides) {
      console.warn('[API /api/hero-slides] No active slides returned from service.');
      return NextResponse.json({ slides: [] }, { status: 200 });
    }
    
    console.log(`[API /api/hero-slides] Successfully fetched ${activeSlides.length} active hero slides.`);
    return NextResponse.json({ slides: activeSlides }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/hero-slides] GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch hero slides.', error: error.message }, { status: 500 });
  }
}

// Optional: To ensure this route is dynamically rendered if not fetching from an external API
export const dynamic = 'force-dynamic';

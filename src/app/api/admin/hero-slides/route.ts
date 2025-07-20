
import { NextResponse, type NextRequest } from 'next/server';
import { addHeroSlide, getHeroSlidesForAdmin } from '@/lib/services/heroSlideService';
import type { HeroSlide } from '@/types';

export async function GET(req: NextRequest) {
  console.log('[API /api/admin/hero-slides] GET request received for admin hero slides');
  // TODO: Add admin role check here
  try {
    const slides = await getHeroSlidesForAdmin();
    return NextResponse.json(slides, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/hero-slides] GET Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hero slides.', error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('[API /api/admin/hero-slides] POST request received to add slide');
  // TODO: Add admin role check here
  try {
    const body: Omit<HeroSlide, 'id' | '_id' | 'createdAt' | 'updatedAt'> = await req.json();
    console.log('[API /api/admin/hero-slides] Request body for add:', body);

    if (!body.imageUrl || body.imageUrl.trim() === '') {
      return NextResponse.json({ message: 'Image URL is required for a hero slide.' }, { status: 400 });
    }
    // Add more validation as needed (e.g., displayOrder should be a number)
    if (body.displayOrder !== undefined && typeof body.displayOrder !== 'number') {
        body.displayOrder = Number(body.displayOrder);
        if (isNaN(body.displayOrder)) {
            body.displayOrder = 0; // Default if conversion fails
        }
    }


    const newSlide = await addHeroSlide(body);
    
    console.log('[API /api/admin/hero-slides] Slide created successfully:', newSlide.id);
    return NextResponse.json(newSlide, { status: 201 });

  } catch (e: unknown) {
    const error = e as Error; // Safely cast to Error
    console.error('[API /api/admin/hero-slides] POST Critical Error:', error.message, error.stack);
    
    let errorMessage = 'An unexpected server error occurred while creating the hero slide.';
    if (error instanceof SyntaxError) { // Specific to req.json() failing
      errorMessage = 'Invalid JSON in request body.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { message: 'Failed to create hero slide.', error: errorMessage },
      { status: 500 }
    );
  }
}

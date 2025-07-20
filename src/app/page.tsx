import InteractiveProductCard from '@/components/products/InteractiveProductCard';
import Container from '@/components/shared/Container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { getCategories } from '@/lib/services/categoryService';
import { getFeaturedBanner } from '@/lib/services/featuredBannerService';
import { getActiveHeroSlides } from '@/lib/services/heroSlideService';
import { getPublicProducts } from '@/lib/services/productService';
import { cn } from '@/lib/utils';
import type { Category, FeaturedBanner, HeroSlide, Product } from '@/types';
import { ArrowRight, ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const testimonials = [
  {
    name: 'Kevin Johnson',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'man face',
    text: 'Amazing quality and fast shipping! CAN is my new go-to for stylish outfits. The customer service is top-notch.',
  },
  {
    name: 'Michael Chen',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'asian man face',
    text: 'The variety of styles is fantastic. I always find something unique and trendy. Highly recommended for fashion lovers.',
  },
  {
    name: 'Olivia Davis',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'woman face',
    text: "I love the AI stylist feature! It helped me discover new looks I wouldn't have picked myself. Great experience overall.",
  },
];

async function getHomepageProducts(): Promise<Product[]> {
  console.log(
    '[HomePage] Attempting to fetch products for homepage via service...'
  );
  try {
    const products = await getPublicProducts(6);
    console.log(
      `[HomePage] Successfully fetched ${products.length} products for homepage via service.`
    );
    return products as Product[];
  } catch (error: any) {
    console.error(
      '[HomePage] CRITICAL: Error fetching homepage products via service:',
      error.message
    );
    return [];
  }
}

async function getPublicCategories(): Promise<Category[]> {
  console.log('[HomePage] Attempting to fetch public categories...');
  try {
    const categories = await getCategories();
    console.log(
      `[HomePage] Successfully fetched ${categories.length} categories for homepage.`
    );
    return categories.map((cat) => ({
      ...cat,
      href: `/shop?category=${encodeURIComponent(cat.name)}`,
    }));
  } catch (error: any) {
    console.error(
      '[HomePage] Error fetching public categories:',
      error.message
    );
    return [];
  }
}

async function getHomepageHeroSlides(): Promise<HeroSlide[]> {
  console.log('[HomePage] Attempting to fetch active hero slides...');
  try {
    const slides = await getActiveHeroSlides();
    console.log(
      `[HomePage] Successfully fetched ${slides.length} active hero slides.`
    );
    return slides;
  } catch (error: any) {
    console.error('[HomePage] Error fetching hero slides:', error.message);
    return [];
  }
}

async function getHomePageFeaturedBanner(): Promise<FeaturedBanner | null> {
  console.log('[HomePage] Attempting to fetch featured banner...');
  try {
    const banner = await getFeaturedBanner();
    console.log(`[HomePage] Fetched featured banner.`);
    return banner;
  } catch (error: any) {
    console.error('[HomePage] Error fetching featured banner:', error.message);
    return null;
  }
}

export default async function HomePage() {
  const handpickedProducts = await getHomepageProducts();
  const exploreCategories = await getPublicCategories();
  const heroSlides = await getHomepageHeroSlides();
  const featuredBanner = await getHomePageFeaturedBanner();

  // Default/fallback content for banner if it's null
  const bannerContent = featuredBanner || {
    title: 'Exclusive Deals - Limited Time Only!',
    subtitle:
      "Grab a chance to buy your desired clothes and accessories at unbeatable prices. Don't miss out on these amazing offers.",
    buttonText: 'Shop Now',
    buttonLink: '/shop?filter=deals',
    imageUrl: 'https://placehold.co/600x450.png',
    aiHint: 'clothing store interior',
  };

  return (
    <>
      {heroSlides && heroSlides.length > 0 ? (
        <Carousel opts={{ loop: true }} className="relative w-full group">
          <CarouselContent className="h-[calc(100vh-80px)] min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
            {heroSlides.map((slide, idx) => (
              <CarouselItem key={slide.id || idx} className="relative">
                <Image
                  src={slide.imageUrl || 'https://placehold.co/1600x900.png'}
                  alt={slide.title || 'Homepage hero slide'}
                  data-ai-hint={slide.aiHint || 'fashion model'}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={idx === 0}
                  className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center md:justify-start">
                  <Container className="relative z-10 text-center md:text-left">
                    <div className="max-w-xl">
                      {slide.title && (
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-slideInUp">
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p className="text-lg md:text-xl text-gray-200 mb-8 animate-slideInUp delay-200">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.buttonText && slide.buttonLink && (
                        <Button
                          asChild
                          size="lg"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-6 text-base animate-fadeIn delay-400"
                        >
                          <Link href={slide.buttonLink}>
                            {slide.buttonText}{' '}
                            <ShoppingBag size={20} className="ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Container>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 transition-colors hidden md:inline-flex h-10 w-10" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 hover:bg-black/50 transition-colors hidden md:inline-flex h-10 w-10" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {heroSlides.map((slide, index) => (
              <button
                key={`dot-${slide.id || index}`}
                aria-label={`Go to slide ${index + 1}`}
                className={cn(
                  'h-2 w-2 rounded-full bg-white/50 transition-all duration-300',
                  'hover:bg-white/80'
                  // Consider adding active state based on carousel API if needed for styling
                )}
              />
            ))}
          </div>
        </Carousel>
      ) : (
        <div className="relative h-[calc(100vh-80px)] min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-gray-200">
          <Image
            src="https://placehold.co/1600x900.png"
            alt="Fashion clothes on a rack"
            data-ai-hint="fashion clothes rack"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="opacity-70"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center md:justify-start">
            <Container className="relative z-10 text-center md:text-left">
              <div className="max-w-xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  Discover Your Perfect Style
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8">
                  Shop our curated collection of premium fashion items. Quality
                  and trends, delivered.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-6 text-base"
                >
                  <Link href="/shop">
                    Shop Now <ShoppingBag size={20} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </Container>
          </div>
        </div>
      )}

      {/* Handpicked Styles Section */}
      <Container className="py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          Handpicked Styles Just for You
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Discover our exclusive selection of fashion pieces, carefully chosen
          to elevate your wardrobe.
        </p>
        {handpickedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {handpickedProducts.map((product) => (
              <InteractiveProductCard
                key={product.id?.toString() || product._id?.toString()}
                product={product}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No products to display currently. Check back soon!
          </p>
        )}
        <div className="text-center mt-12">
          <Button variant="outline" asChild>
            <Link href="/shop">
              View All Products <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </div>
      </Container>

      {/* Explore by Category Section */}
      <Container className="py-16 bg-secondary/30">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          Explore by Category
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Find what you're looking for with our curated categories.
        </p>
        {exploreCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {exploreCategories.map((category) => (
              <Link
                href={
                  category.href ||
                  `/shop?category=${encodeURIComponent(category.name)}`
                }
                key={category.id?.toString()}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <Image
                  src={category.imageUrl || 'https://placehold.co/400x500.png'}
                  alt={category.name}
                  data-ai-hint={category.aiHint || category.name.toLowerCase()}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <h3 className="text-2xl font-headline font-semibold text-white">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No categories to display currently. Check back soon!
          </p>
        )}
      </Container>

      {/* Exclusive Deals Section */}
      <div className="bg-primary text-primary-foreground">
        <Container className="py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {bannerContent.title}
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              {bannerContent.subtitle}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6"
            >
              <Link href={bannerContent.buttonLink}>
                {bannerContent.buttonText}{' '}
                <ArrowRight size={20} className="ml-2" />
              </Link>
            </Button>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
            <Image
              src={bannerContent.imageUrl}
              alt={bannerContent.title}
              data-ai-hint={bannerContent.aiHint || 'promotional banner'}
              width={600}
              height={450}
              className="object-cover w-full h-full"
            />
          </div>
        </Container>
      </div>

      {/* Our Happy Customers Section */}
      <Container className="py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Our Happy Customers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      data-ai-hint={testimonial.aiHint}
                    />
                    <AvatarFallback>
                      {testimonial.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold font-headline text-foreground">
                      {testimonial.name}
                    </p>
                    <div className="flex text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {testimonial.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>

      {/* Get 10% Off Section */}
      <div className="bg-rose-500 text-white">
        <Container className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-3">
            Get 10% Off Your First Order
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Subscribe to our newsletter and be the first to know about new
            arrivals, exclusive offers, and style tips.
          </p>
          <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow bg-white/90 text-foreground placeholder:text-muted-foreground focus:bg-white"
              aria-label="Email address"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Subscribe Now
            </Button>
          </form>
        </Container>
      </div>
    </>
  );
}

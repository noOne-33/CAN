
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { calculateEffectivePrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const displayImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : 'https://placehold.co/400x500.png';
  
  const productIdString = product.id?.toString() || product._id?.toString();

  const { effectivePrice, originalPriceDisplay, discountText } = calculateEffectivePrice(
    product.price,
    product.discountType,
    product.discountValue
  );

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${productIdString}`} aria-label={`View details for ${product.name}`}>
          <div className="aspect-[3/4] relative w-full overflow-hidden">
            <Image
              src={displayImage}
              alt={product.name}
              data-ai-hint={product.aiHint || "fashion item"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {discountText && (
              <Badge
                variant="destructive"
                className="absolute top-2 right-2 text-xs px-2 py-1"
              >
                {discountText}
              </Badge>
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline mb-1 leading-tight">
          <Link href={`/products/${productIdString}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm">{product.category}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <div>
          {originalPriceDisplay && originalPriceDisplay > effectivePrice ? (
            <>
              <p className="text-lg font-semibold text-primary font-body">৳{effectivePrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground line-through font-body">
                ৳{originalPriceDisplay.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-xl font-semibold text-primary font-body">৳{product.price.toFixed(2)}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/products/${productIdString}`} aria-label={`View ${product.name}`}>
            View
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

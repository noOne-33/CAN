
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product, CartItem, ProductColor } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { calculateEffectivePrice } from '@/lib/utils';
import { useRouter } from 'next/navigation'; // For redirecting to login

interface InteractiveProductCardProps {
  product: Product;
}

export default function InteractiveProductCard({ product }: InteractiveProductCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const productIdString = product.id?.toString() || product._id?.toString() || 'unknown-product';

  const primaryImage = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls[0]
    : 'https://placehold.co/400x500.png';
  const secondaryImage = product.imageUrls && product.imageUrls.length > 1
    ? product.imageUrls[1]
    : primaryImage;

  const { effectivePrice, originalPriceDisplay, discountText } = calculateEffectivePrice(
    product.price,
    product.discountType,
    product.discountValue
  );

  const updateAuthState = useCallback(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    updateAuthState();
    window.addEventListener('storage', updateAuthState);
    return () => window.removeEventListener('storage', updateAuthState);
  }, [updateAuthState]);


  const checkWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !productIdString || productIdString === 'unknown-product') {
      setIsInWishlist(false);
      return;
    }
    const token = localStorage.getItem('authToken'); // Re-check token, though isAuthenticated should be reliable
    if (!token) { // Should not happen if isAuthenticated is true, but as a safeguard
        setIsInWishlist(false);
        return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: { productIds: string[] } = await response.json();
        if (data.productIds && data.productIds.includes(productIdString)) {
          setIsInWishlist(true);
        } else {
          setIsInWishlist(false);
        }
      } else {
        setIsInWishlist(false);
      }
    } catch (err) {
      console.error("Error checking wishlist status for card:", err);
      setIsInWishlist(false);
    }
  }, [productIdString, isAuthenticated]); // Depend on isAuthenticated

  useEffect(() => {
    if (isAuthenticated) { // Only check wishlist if authenticated
      checkWishlistStatus();
    } else {
      setIsInWishlist(false); // Clear wishlist status if not authenticated
    }
    window.addEventListener('wishlistUpdated', checkWishlistStatus);
    return () => {
      window.removeEventListener('wishlistUpdated', checkWishlistStatus);
    };
  }, [isAuthenticated, checkWishlistStatus]);


  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productIdString || productIdString === 'unknown-product') return;

    if (!isAuthenticated) {
      toast({ title: 'Login Required', description: 'Please log in to manage your wishlist.', variant: 'destructive' });
      router.push('/login?redirect=/shop'); // Or current page
      return;
    }
    setIsAddingToWishlist(true);
    const token = localStorage.getItem('authToken');

    try {
      const apiEndpoint = isInWishlist ? '/api/wishlist/remove' : '/api/wishlist/add';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: productIdString }),
      });
      const result = await response.json();
      if (response.ok) {
        setIsInWishlist(!isInWishlist);
        toast({
          title: isInWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
          description: `${product.name} has been ${isInWishlist ? 'removed from' : 'added to'} your wishlist.`,
        });
        window.dispatchEvent(new Event('wishlistUpdated'));
      } else {
        toast({ title: 'Error', description: result.message || 'Could not update wishlist.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productIdString || productIdString === 'unknown-product' || product.stock === 0) return;
    
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to add items to your cart.", variant: "destructive" });
      router.push('/login?redirect=/shop'); // Or current page
      return;
    }
    setIsAddingToCart(true);

    const selectedSize = product.sizes?.find(s => s.trim() !== '') || null;
    const selectedColorObj = product.colors?.[0] || null;
    const cartKey = `${productIdString}-${selectedSize || 'onesize'}-${selectedColorObj?.name || 'defaultcolor'}`;

    const cartItem: CartItem = {
      productId: productIdString,
      name: product.name,
      price: effectivePrice,
      originalPrice: originalPriceDisplay,
      image: selectedColorObj?.image || primaryImage,
      quantity: 1,
      size: selectedSize,
      color: selectedColorObj?.name,
      colorHex: selectedColorObj?.hex,
      appliedDiscountType: product.discountType,
      appliedDiscountValue: product.discountValue,
      cartKey: cartKey,
    };

    const token = localStorage.getItem('authToken');

    try {
      // User is logged in, add to cart via API
      const response = await fetch('/api/cart/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(cartItem),
      });
      if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.message || 'Failed to add item to server cart.');
      }
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not add item to cart.", variant: "destructive"});
    } finally {
      setIsAddingToCart(false);
    }
  };


  return (
    <Card
      className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-0 relative aspect-[3/4] w-full overflow-hidden">
        <Link href={`/products/${productIdString}`} aria-label={`View details for ${product.name}`}>
          <Image
            src={primaryImage}
            alt={product.name}
            data-ai-hint={product.aiHint || "fashion item"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-opacity duration-500 ease-in-out",
              isHovered && product.imageUrls.length > 1 ? "opacity-0" : "opacity-100"
            )}
          />
          {product.imageUrls.length > 1 && (
            <Image
              src={secondaryImage}
              alt={`${product.name} - secondary view`}
              data-ai-hint={product.aiHint || "fashion item alternate"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={cn(
                "object-cover transition-opacity duration-500 ease-in-out absolute inset-0",
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />
          )}
        </Link>
        {discountText && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 text-xs px-2 py-1 z-10"
          >
            {discountText}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow transition-all duration-300">
        <CardTitle className="text-lg font-headline mb-1 leading-tight">
          <Link href={`/products/${productIdString}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm">{product.category}</p>
      </CardContent>
      <CardFooter className={cn(
        "p-4 pt-0 flex flex-col items-start transition-all duration-300",
        isHovered ? "pb-16" : ""
      )}>
        <div>
          {originalPriceDisplay && originalPriceDisplay > effectivePrice ? (
            <>
              <p className="text-lg font-semibold text-primary font-body">৳{effectivePrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground line-through font-body">
                ৳{originalPriceDisplay.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-primary font-body">৳{product.price.toFixed(2)}</p>
          )}
        </div>
      </CardFooter>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-sm rounded-b-lg",
          "opacity-0 transition-all duration-300 ease-in-out transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex gap-2 justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stock === 0}
          >
            {isAddingToCart ? <Loader2 className="animate-spin" /> : <ShoppingCart size={16} />}
            <span className="ml-2 text-xs">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleWishlistToggle}
            disabled={isAddingToWishlist}
          >
            {isAddingToWishlist ? (
              <Loader2 className="animate-spin" />
            ) : isInWishlist ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <Heart size={16} />
            )}
            <span className="ml-2 text-xs">{isInWishlist ? 'In Wishlist' : 'Wishlist'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

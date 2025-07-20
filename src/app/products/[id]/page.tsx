'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; // Import useParams
import type { Product, CartItem, ProductColor, ProductSpecification } from '@/types';
import Container from '@/components/shared/Container';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Loader2, CheckCircle, AlertTriangle, ListChecks } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { calculateEffectivePrice } from '@/lib/utils';
import { useRouter } from 'next/navigation'; // For redirecting to login


export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const { toast } = useToast();
  const router = useRouter(); // For redirecting to login

  const updateAuthState = useCallback(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    updateAuthState(); // Check auth state on mount
    window.addEventListener('storage', updateAuthState); // Listen for auth changes from other tabs/windows
    return () => window.removeEventListener('storage', updateAuthState);
  }, [updateAuthState]);

  const fetchProductData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?id=${productId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found');
        throw new Error('Failed to fetch product data');
      }
      const data: Product = await res.json();
      setProduct(data);

      if (data.sizes && data.sizes.length > 0 && data.sizes.some(s => s.trim() !== '')) {
        setSelectedSize(data.sizes.filter(s => s.trim() !== '')[0]);
      }
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      } else if (data.imageUrls && data.imageUrls.length > 0) {
        setSelectedColor(null); // No specific color selected, but images exist
      }
    } catch (err: any) {
      setError(err.message);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  const checkWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !product) { // Check isAuthenticated state here
      setIsInWishlist(false);
      return;
    }
    const token = localStorage.getItem('authToken'); // Re-check for safety, though isAuthenticated should be reliable
     if (!token) { // Should not happen if isAuthenticated is true
        setIsInWishlist(false);
        return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: { productIds: string[] } = await response.json();
        const currentProductId = product._id?.toString() || product.id;
        if (data.productIds && currentProductId && data.productIds.includes(currentProductId)) {
          setIsInWishlist(true);
        } else {
          setIsInWishlist(false);
        }
      } else {
        setIsInWishlist(false);
      }
    } catch (err) {
      console.error("Error checking wishlist status:", err);
      setIsInWishlist(false);
    }
  }, [product, isAuthenticated]); // Add isAuthenticated as dependency


  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId, fetchProductData]);

  useEffect(() => {
    if (product && isAuthenticated) { // Check isAuthenticated before checking wishlist
      checkWishlistStatus();
    } else if (!isAuthenticated) {
        setIsInWishlist(false); // Clear wishlist status if not authenticated
    }
    
    window.addEventListener('wishlistUpdated', checkWishlistStatus);
    return () => {
      window.removeEventListener('wishlistUpdated', checkWishlistStatus);
    };
  }, [product, isAuthenticated, checkWishlistStatus]); // Add isAuthenticated


  const handleAddToWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast({ title: 'Login Required', description: 'Please log in to add items to your wishlist.', variant: 'destructive' });
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    setIsAddingToWishlist(true);
    const currentProductId = product._id?.toString() || product.id;
    const token = localStorage.getItem('authToken');

    try {
      const apiEndpoint = isInWishlist ? '/api/wishlist/remove' : '/api/wishlist/add';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: currentProductId }),
      });
      const result = await response.json();
      if (response.ok) {
        setIsInWishlist(!isInWishlist);
        toast({
          title: isInWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
          description: result.message || `${product.name} has been ${isInWishlist ? 'removed from' : 'added to'} your wishlist.`,
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

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to add items to your cart.", variant: "destructive" });
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    setIsAddingToCart(true);

    const currentProductId = product._id?.toString() || product.id;
    if (!currentProductId) {
        toast({ title: "Error", description: "Product ID is missing.", variant: "destructive" });
        setIsAddingToCart(false);
        return;
    }

    if (product.sizes && product.sizes.length > 0 && product.sizes.some(s => s.trim() !== '') && !selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
      });
      setIsAddingToCart(false);
      return;
    }

    const { effectivePrice, originalPriceDisplay } = calculateEffectivePrice(
      product.price,
      product.discountType,
      product.discountValue
    );

    const cartKey = `${currentProductId}-${selectedSize || 'onesize'}-${selectedColor?.name || 'defaultcolor'}`;

    const cartItem: CartItem = {
      productId: currentProductId,
      name: product.name,
      price: effectivePrice,
      originalPrice: originalPriceDisplay,
      image: selectedColor?.image || product.imageUrls?.[0] || 'https://placehold.co/80x100.png',
      quantity: 1,
      size: selectedSize,
      color: selectedColor?.name,
      colorHex: selectedColor?.hex,
      appliedDiscountType: product.discountType,
      appliedDiscountValue: product.discountValue,
      cartKey: cartKey,
    };

    const token = localStorage.getItem('authToken');
    try {
      // User is logged in, add to cart via API
      const response = await fetch('/api/cart/item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(cartItem),
      });
      if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.message || 'Failed to add item to server cart.');
      }
      toast({
        title: "Added to Cart",
        description: `${product.name} ${selectedSize ? `(Size: ${selectedSize})` : ''} ${selectedColor ? `(Color: ${selectedColor.name})` : ''} has been added to your cart.`,
      });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e: any) {
      console.error("Failed to add to cart:", e);
      toast({ title: "Error", description: e.message || "Could not add item to cart.", variant: "destructive"});
    } finally {
      setIsAddingToCart(false);
    }
  };


  if (isLoading) {
    return <Container className="text-center py-20"><LoadingSpinner text="Loading product details..." /></Container>;
  }

  if (error) {
    return (
      <Container className="text-center py-20 flex flex-col items-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold my-4 text-destructive">{error}</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't load the product details.</p>
        <Button asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="text-center py-20 flex flex-col items-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold my-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you are looking for does not exist or may have been removed.</p>
        <Button asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </Container>
    );
  }

  const { effectivePrice, originalPriceDisplay, discountText } = calculateEffectivePrice(
    product.price,
    product.discountType,
    product.discountValue
  );

  return (
    <Container>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <ProductImageGallery product={product} onColorSelect={setSelectedColor} />

        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex justify-between items-start mb-1">
              <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary">
                <Badge variant="outline" className="text-sm cursor-pointer">{product.category}</Badge>
              </Link>
              {discountText && (
                <Badge variant="destructive" className="text-sm px-3 py-1">{discountText}</Badge>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-4">
              <p className="text-2xl font-semibold text-primary font-body">৳{effectivePrice.toFixed(2)}</p>
              {originalPriceDisplay && originalPriceDisplay > effectivePrice && (
                <p className="text-lg text-muted-foreground line-through font-body">
                  ৳{originalPriceDisplay.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-headline font-semibold mb-3">Description</h2>
            <div className="p-4 border rounded-md bg-muted/20 mt-1">
              <p className="text-foreground/90 leading-relaxed text-base font-body whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-headline font-semibold mb-3 flex items-center">
                <ListChecks size={22} className="mr-2 text-primary" />
                Specifications
            </h2>
            <div className="p-4 border rounded-md bg-muted/20 mt-1 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Category:</span>
                    <span className="text-foreground">{product.category}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Stock:</span>
                    <span className={cn("text-foreground", product.stock === 0 ? "text-destructive" : product.stock < 10 ? "text-orange-600" : "text-green-600")}>
                        {product.stock > 0 ? `${product.stock} items available` : 'Out of Stock'}
                    </span>
                </div>
                {product.colors && product.colors.length > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Available Colors:</span>
                        <span className="text-foreground">{product.colors.map(c => c.name).join(', ')}</span>
                    </div>
                )}
                {product.sizes && product.sizes.length > 0 && product.sizes.some(s => s.trim() !== '') && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Available Sizes:</span>
                        <span className="text-foreground">{product.sizes.filter(s => s.trim() !== '').join(', ')}</span>
                    </div>
                )}
                {product.specifications && product.specifications.length > 0 && product.specifications.map((spec, index) => (
                  spec.name && spec.value && (
                    <div key={index} className="flex justify-between">
                      <span className="text-muted-foreground font-medium">{spec.name}:</span>
                      <span className="text-foreground">{spec.value}</span>
                    </div>
                  )
                ))}
            </div>
          </div>

          {product.colors && product.colors.length > 0 && (
             <div>
                <p className="text-sm font-medium text-foreground mb-2">
                    Color: <span className="font-bold">{selectedColor?.name || product.colors[0]?.name || 'Default'}</span>
                </p>
            </div>
          )}


          {product.sizes && product.sizes.length > 0 && product.sizes.some(s => s.trim() !== '') && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Select Size: <span className="font-bold">{selectedSize || 'N/A'}</span></h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.filter(s => s.trim() !== '').map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm",
                      selectedSize === size && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 space-y-3">
            <Button
              size="lg"
              className="w-full text-base py-3"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddingToCart}
            >
              {isAddingToCart ? <Loader2 size={20} className="mr-2 animate-spin" /> : <ShoppingCart size={20} className="mr-2" />}
              {product.stock === 0 ? 'Out of Stock' : (isAddingToCart ? 'Adding...' : 'Add to Cart')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base py-3"
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
            >
              {isAddingToWishlist ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : isInWishlist ? (
                <CheckCircle size={20} className="mr-2 text-green-500" />
              ) : (
                <Heart size={20} className="mr-2" />
              )}
              {isAddingToWishlist ? 'Updating...' : isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
          {product.stock > 0 && product.stock < 10 && (
            <p className="text-sm text-destructive text-center mt-2">Only {product.stock} items left in stock!</p>
          )}
          {product.stock === 0 && (
            <p className="text-sm text-destructive text-center mt-2">This product is currently out of stock.</p>
          )}
        </div>
      </div>
    </Container>
  );
}

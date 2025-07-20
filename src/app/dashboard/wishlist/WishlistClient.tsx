
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, CartItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2, Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'; // Added for potential redirect

export default function WishlistClient() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [isAuthenticatedClient, setIsAuthenticatedClient] = useState(false); // Local auth state for this component
  const { toast } = useToast();
  const router = useRouter();


  const fetchWishlistProductDetails = useCallback(async (productIds: string[]): Promise<Product[]> => {
    if (productIds.length === 0) return [];
    try {
      const productDetailsPromises = productIds.map(id =>
        fetch(`/api/products?id=${id}`).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
          return res.json();
        })
      );
      const products = await Promise.all(productDetailsPromises);
      return products.filter(p => p) as Product[];
    } catch (err: any) {
      console.error('Error fetching product details for wishlist:', err);
      setError('Could not load details for some wishlist items.');
      return [];
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You must be logged in to view your wishlist.');
      setIsAuthenticatedClient(false);
      setIsLoading(false);
      return;
    }
    setIsAuthenticatedClient(true);

    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
            setError('Your session may have expired. Please log in again to view your wishlist.');
            setIsAuthenticatedClient(false);
            // Consider redirecting or showing login prompt more explicitly
            // router.push('/login?redirect=/dashboard/wishlist'); 
        } else {
            throw new Error(errorData.message || 'Failed to fetch wishlist');
        }
        setWishlistItems([]); // Clear items on auth error
      } else {
        const data: { productIds: string[] } = await response.json();
        if (data.productIds && data.productIds.length > 0) {
          const productsWithDetails = await fetchWishlistProductDetails(data.productIds);
          setWishlistItems(productsWithDetails);
        } else {
          setWishlistItems([]);
        }
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err: any) {
      console.error('Error loading wishlist:', err);
      setError(err.message || 'An unexpected error occurred while fetching your wishlist.');
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWishlistProductDetails, router]); // Added router to dependencies

  useEffect(() => {
    loadWishlist();
    // Listen to general storage event to re-check auth if token changes globally
    const handleGlobalAuthChange = () => {
        const currentToken = localStorage.getItem('authToken');
        if (!!currentToken !== isAuthenticatedClient) { // If auth state mismatch
            loadWishlist(); // Re-load based on new global auth state
        }
    };
    window.addEventListener('storage', handleGlobalAuthChange);
    return () => {
        window.removeEventListener('storage', handleGlobalAuthChange);
    };
  }, [loadWishlist, isAuthenticatedClient]);


  const handleRemoveItemFromWishlistAPI = async (productId: string, token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      return response.ok;
    } catch (err) {
      console.error("API error removing from wishlist:", err);
      return false;
    }
  };


  const handleRemoveItem = async (productId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      setIsAuthenticatedClient(false);
      setError('You must be logged in to manage your wishlist.');
      return;
    }
    setRemovingItemId(productId);
    const success = await handleRemoveItemFromWishlistAPI(productId, token);
    if (success) {
      setWishlistItems(prevItems => prevItems.filter(item => (item._id?.toString() || item.id) !== productId));
      toast({ title: 'Success', description: 'Item removed from wishlist.' });
      window.dispatchEvent(new Event('wishlistUpdated'));
    } else {
      toast({ title: 'Error', description: 'Failed to remove item from wishlist.', variant: 'destructive' });
    }
    setRemovingItemId(null);
  };

  const handleAddToCartAndRemoveFromWishlist = async (product: Product) => {
    const token = localStorage.getItem('authToken');
    const productId = product._id?.toString() || product.id;

    if (!token) {
      toast({ title: 'Login Required', description: 'Please log in to add items to your cart.', variant: 'destructive' });
      setIsAuthenticatedClient(false);
      setError('You must be logged in to perform this action.');
      return;
    }
    if (!productId) {
        toast({ title: "Error", description: "Product ID is missing.", variant: "destructive" });
        return;
    }

    setAddingToCartId(productId);

    const selectedSize = product.sizes?.[0] || null;
    const selectedColorObj = product.colors?.[0] || null;
    const cartKey = `${productId}-${selectedSize || 'onesize'}-${selectedColorObj?.name || 'defaultcolor'}`;
    const cartItem: CartItem = {
      productId: productId,
      name: product.name,
      price: product.price,
      image: selectedColorObj?.image || product.imageUrls?.[0] || 'https://placehold.co/80x100.png',
      quantity: 1,
      size: selectedSize,
      color: selectedColorObj?.name,
      colorHex: selectedColorObj?.hex,
      cartKey: cartKey,
    };

    let cartAddedSuccessfully = false;
    try {
      // For logged-in users, add to cart via API
      const cartResponse = await fetch('/api/cart/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(cartItem),
      });
      if (!cartResponse.ok) {
          const errorResult = await cartResponse.json();
          throw new Error(errorResult.message || 'Failed to add item to server cart.');
      }
      cartAddedSuccessfully = true;
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error("Failed to add to cart:", e);
      toast({ title: "Error", description: "Could not add item to cart.", variant: "destructive"});
      setAddingToCartId(null);
      return;
    }

    if (cartAddedSuccessfully) {
      const wishlistRemovedSuccessfully = await handleRemoveItemFromWishlistAPI(productId, token);
      if (wishlistRemovedSuccessfully) {
        setWishlistItems(prevItems => prevItems.filter(item => (item._id?.toString() || item.id) !== productId));
        window.dispatchEvent(new Event('wishlistUpdated'));
        toast({
          title: 'Success!',
          description: `${product.name} added to cart and removed from wishlist.`,
        });
      } else {
        toast({
          title: 'Item Added to Cart',
          description: `${product.name} was added to your cart, but failed to remove from wishlist. Please remove it manually if needed.`,
          variant: 'default',
        });
      }
    }
    setAddingToCartId(null);
  };


  if (isLoading) {
    return <LoadingSpinner text="Loading your wishlist..." />;
  }

  if (error && !isAuthenticatedClient) { // Show login prompt only if not authenticated
    return (
      <Card>
        <CardHeader className="items-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/login?redirect=/dashboard/wishlist">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (error) { // Generic error display if authenticated but something else went wrong
     return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive">{error}</p>
        <Button onClick={loadWishlist} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Heart size={24} className="mr-2 text-primary" />
          Wishlist
        </CardTitle>
        <CardDescription>All products added to your wishlist are shown here.</CardDescription>
      </CardHeader>
      <CardContent>
        {wishlistItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Your wishlist is currently empty. Start adding some favorites!</p>
        ) : (
          <div className="space-y-6">
            {wishlistItems.map((item) => {
              const itemId = item._id?.toString() || item.id!;
              const isCurrentlyAdding = addingToCartId === itemId;
              const isCurrentlyRemoving = removingItemId === itemId;
              const isDisabled = isCurrentlyAdding || isCurrentlyRemoving;

              return (
                <div key={itemId} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Image
                      src={item.imageUrls?.[0] || 'https://placehold.co/80x100.png'}
                      alt={item.name}
                      width={80}
                      height={100}
                      className="rounded-md object-cover aspect-[4/5]"
                      data-ai-hint={item.aiHint || "clothing item"}
                    />
                    <div className="flex-grow">
                      <Link href={`/products/${itemId}`} className="hover:text-primary">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <p className="text-md font-medium text-primary">৳{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild disabled={isDisabled}>
                      <Link href={`/products/${itemId}`}>
                        <ShoppingBag size={16} className="mr-2" />
                        View Product
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleAddToCartAndRemoveFromWishlist(item)}
                      disabled={isDisabled || item.stock === 0}
                    >
                      {isCurrentlyAdding ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart size={16} className="mr-2" />
                      )}
                      {item.stock === 0 ? 'Out of Stock' : (isCurrentlyAdding ? 'Adding...' : 'Add to Cart')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleRemoveItem(itemId)}
                      disabled={isDisabled}
                    >
                      {isCurrentlyRemoving ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <Trash2 size={16} className="mr-2" />
                      )}
                      {isCurrentlyRemoving ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


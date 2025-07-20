
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Cart } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

export default function CartClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [itemBeingModified, setItemBeingModified] = useState<string | null>(null); // cartKey of item
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Removed isSyncingCart as localStorage cart is removed
  const { toast } = useToast();
  const router = useRouter();

  const updateClientCartState = (newItems: CartItem[]) => {
    setCartItems(newItems);
    // No localStorage updates for cart anymore
    window.dispatchEvent(new Event('cartUpdated')); // For header count
  };

  const fetchAndSetCart = useCallback(async (token: string | null) => {
    setPageIsLoading(true);
    if (token) { 
      setIsAuthenticated(true);
      try {
        console.log('[CartClient] Fetching DB cart...');
        const response = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const cartData: Cart = await response.json();
          updateClientCartState(cartData.items);
        } else {
          updateClientCartState([]);
           if (response.status === 401) {
            toast({ title: "Session Expired", description: "Please log in again to see your cart.", variant: "destructive" });
            setIsAuthenticated(false); // Update auth state
          } else {
            toast({ title: "Error", description: "Could not load your cart from server.", variant: "destructive" });
          }
        }
      } catch (error) {
        updateClientCartState([]);
        toast({ title: "Error", description: "Could not connect to server for cart.", variant: "destructive" });
      }
    } else { 
      setIsAuthenticated(false);
      updateClientCartState([]); // Guest cart is empty
    }
    setPageIsLoading(false);
  }, [toast]); 

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetchAndSetCart(token);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken' || event.key === 'userRole' || event.key === null) {
        const currentToken = localStorage.getItem('authToken');
        const newIsAuthenticated = !!currentToken;
        if (newIsAuthenticated !== isAuthenticated) {
           console.log('[CartClient] Storage event detected, auth status changed, refetching cart.');
           setIsAuthenticated(newIsAuthenticated); 
           fetchAndSetCart(currentToken);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchAndSetCart, isAuthenticated]);


  const handleQuantityChange = async (cartKey: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Handled by API as well, but good client check
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to modify your cart.", variant: "destructive" });
      return;
    }
    setItemBeingModified(cartKey);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/cart/item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cartKey, quantity: newQuantity }),
      });
      if (response.ok) {
        const updatedCart: Cart = await response.json();
        updateClientCartState(updatedCart.items);
      } else {
        toast({ title: "Error", description: "Failed to update quantity on server.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not update quantity.", variant: "destructive" });
    }
    setItemBeingModified(null);
  };

  const handleRemoveItem = async (cartKey: string) => {
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to modify your cart.", variant: "destructive" });
      return;
    }
    setItemBeingModified(cartKey);
    const itemToRemove = cartItems.find(item => item.cartKey === cartKey);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/cart/item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cartKey }),
      });
      if (response.ok) {
        const updatedCart: Cart = await response.json();
        updateClientCartState(updatedCart.items);
        toast({ title: "Item Removed", description: `${itemToRemove?.name || 'Item'} removed from cart.` });
      } else {
        toast({ title: "Error", description: "Failed to remove item from server.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not remove item.", variant: "destructive" });
    }
    setItemBeingModified(null);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal > 0 ? 50 : 0; // Assuming fixed shipping or free over a certain amount
  const grandTotal = subtotal + shippingCost;

  const handleProceedToCheckout = () => {
    if (subtotal === 0) return;
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to proceed to checkout.", variant: "destructive" });
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (pageIsLoading) {
    return <LoadingSpinner text="Loading your cart..." />;
  }

  if (!isAuthenticated) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">Please Log In</CardTitle>
          <CardDescription>Log in to view your shopping cart and add items.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild size="lg">
            <Link href="/login?redirect=/cart">Log In</Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            New user? <Link href="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    );
  }


  if (cartItems.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
          <CardDescription>Looks like you haven't added anything to your cart yet.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {cartItems.map(item => (
          <Card key={item.cartKey} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 shadow-sm hover:shadow-md transition-shadow relative">
            {itemBeingModified === item.cartKey && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
                <Loader2 className="animate-spin text-primary" size={32}/>
              </div>
            )}
            <div className="relative w-24 h-32 sm:w-28 sm:h-36 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-cover"
                data-ai-hint="product clothing"
              />
            </div>
            <div className="flex-grow">
              <Link href={`/products/${item.productId}`} className="hover:text-primary">
                <h3 className="text-lg font-semibold">{item.name}</h3>
              </Link>
              <div className="text-sm text-muted-foreground">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <>
                    <span className="line-through">৳{item.originalPrice.toFixed(2)}</span>
                    <span className="text-primary font-semibold ml-2">৳{item.price.toFixed(2)}</span>
                    {item.appliedDiscountType === 'percentage' && item.appliedDiscountValue && (
                       <Badge variant="destructive" className="ml-2 text-xs">{item.appliedDiscountValue}% OFF</Badge>
                    )}
                    {item.appliedDiscountType === 'fixed' && item.appliedDiscountValue && (
                       <Badge variant="destructive" className="ml-2 text-xs">৳{item.appliedDiscountValue.toFixed(0)} OFF</Badge>
                    )}
                  </>
                ) : (
                  <span>Price: ৳{item.price.toFixed(2)}</span>
                )}
                {item.size && ` / Size: ${item.size}`}
                {item.color && ` / Color: ${item.color}`}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.cartKey, item.quantity - 1)} disabled={item.quantity <= 1 || !!itemBeingModified}>
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value, 10);
                    if (!isNaN(newQty) && newQty >= 1) {
                      handleQuantityChange(item.cartKey, newQty);
                    }
                  }}
                  onBlur={(e) => {
                     const newQty = parseInt(e.target.value, 10);
                     if (isNaN(newQty) || newQty < 1) {
                       const currentItem = cartItems.find(ci => ci.cartKey === item.cartKey);
                       if (currentItem) handleQuantityChange(item.cartKey, currentItem.quantity); 
                     }
                  }}
                  className="h-8 w-16 text-center px-1"
                  aria-label="Quantity"
                  disabled={!!itemBeingModified}
                />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.cartKey, item.quantity + 1)} disabled={!!itemBeingModified}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end sm:ml-auto mt-4 sm:mt-0">
              <p className="text-md font-semibold text-primary mb-2">
                Subtotal: ৳{(item.price * item.quantity).toFixed(2)}
              </p>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.cartKey)} disabled={!!itemBeingModified}>
                <Trash2 size={16} className="mr-1" /> Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="md:col-span-1">
        <Card className="shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle className="text-xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{shippingCost === 0 && subtotal > 0 ? 'Free' : (subtotal === 0 ? 'N/A' : `৳${shippingCost.toFixed(2)}`)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg text-foreground">
              <span>Grand Total</span>
              <span>৳{grandTotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-3">
             {subtotal === 0 && isAuthenticated && ( // Only show if logged in and cart is empty
                 <div className="flex items-center text-sm text-destructive p-3 bg-destructive/10 rounded-md w-full">
                    <AlertTriangle size={18} className="mr-2" />
                    <span>Your cart is empty. Add items to proceed.</span>
                 </div>
             )}
            <Button
              size="lg"
              className="w-full"
              onClick={handleProceedToCheckout}
              disabled={subtotal === 0 || pageIsLoading || !!itemBeingModified || !isAuthenticated}
            >
              Proceed to Checkout <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="link" asChild className="text-sm text-muted-foreground">
              <Link href="/shop">or Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

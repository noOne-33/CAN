
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, ShippingAddress, Address, OrderItem, Coupon, Cart } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, CheckCircle, AlertTriangle, CreditCard, Truck, DollarSign, Percent, Tag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const addressFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^(\+?880|0)1[3-9]\d{8}$/, "Please enter a valid BD phone number."),
  streetAddress: z.string().min(5, { message: "Street address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  postalCode: z.string().min(4, { message: "Postal code is required." }),
  country: z.string().min(2, { message: "Country is required." }),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

type PaymentMethod = "CashOnDelivery" | "Card" | "bKash";

type ValidatedCouponInfo = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  message?: string;
};


export default function CheckoutClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CashOnDelivery");
  const [addressFormSubtitle, setAddressFormSubtitle] = useState("Please provide your shipping details.");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [couponInputValue, setCouponInputValue] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCouponInfo | null>(null);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      streetAddress: '',
      city: '',
      postalCode: '',
      country: 'Bangladesh',
    },
  });

  const loadCheckoutData = useCallback(async () => {
    let isMounted = true;
    setPageIsLoading(true);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      if (isMounted) setIsAuthenticated(false);
      toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
      router.push('/login?redirect=/checkout');
      if (isMounted) setPageIsLoading(false);
      return;
    }
    if (isMounted) setIsAuthenticated(true);

    // Fetch cart from DB if logged in
    try {
      const cartResponse = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (!cartResponse.ok) throw new Error('Failed to fetch cart from server.');
      const cartData: Cart = await cartResponse.json();
      if (cartData.items.length === 0) {
        toast({ title: "Empty Cart", description: "Redirecting to shop...", variant: "default" });
        router.push('/shop');
        if (isMounted) setPageIsLoading(false);
        return;
      }
      if (isMounted) setCartItems(cartData.items);
    } catch (error) {
      console.error("Error loading cart from DB:", error);
      toast({ title: "Error", description: "Could not load cart items from server.", variant: "destructive" });
      router.push('/cart');
      if (isMounted) setPageIsLoading(false);
      return;
    }

    // Fetch addresses
    try {
        const response = await fetch('/api/user/addresses', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch addresses');
        const addressData: Address[] = await response.json();

        const sortedAddresses = [...addressData].sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime();
        });

        if (isMounted) setSavedAddresses(sortedAddresses);

        if (sortedAddresses.length > 0) {
          const addressToPreFill = sortedAddresses.find(addr => addr.isDefault) || sortedAddresses[0];
          if (isMounted) {
            form.reset({
              fullName: addressToPreFill.fullName,
              phone: addressToPreFill.phone,
              streetAddress: addressToPreFill.streetAddress,
              city: addressToPreFill.city,
              postalCode: addressToPreFill.postalCode,
              country: addressToPreFill.country,
            });
            setSelectedSavedAddressId(addressToPreFill.id!);
            setAddressFormSubtitle("Using your saved address. You can edit details below or choose another.");
          }
        } else {
           if (isMounted) setAddressFormSubtitle("No saved addresses. Please enter your shipping details.");
        }
      } catch (error) {
        console.error("Error loading saved addresses:", error);
        if (isMounted) {
            setSavedAddresses([]);
            setAddressFormSubtitle("Could not load saved addresses. Please enter shipping details.");
        }
      } finally {
         if (isMounted) setPageIsLoading(false);
      }
      return () => { isMounted = false; };
  }, [form, toast, router]);


  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);


  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal > 0 ? 50 : 0;
  const grandTotal = subtotal + shippingCost - couponDiscountAmount;


  const handleApplyCoupon = async () => {
    if (!couponInputValue.trim()) {
      toast({ title: "Enter Coupon", description: "Please enter a coupon code.", variant: "destructive" });
      return;
    }
    setIsApplyingCoupon(true);
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('/api/coupons/validate-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponCode: couponInputValue.trim(),
          cartSubtotal: subtotal,
        }),
      });

      const result: ValidatedCouponInfo & { message?: string; error?: string } = await response.json();

      if (response.ok && result.code) {
        let discountCalculated = 0;
        if (result.discountType === 'percentage') {
          discountCalculated = (subtotal * result.discountValue) / 100;
        } else {
          discountCalculated = result.discountValue;
        }
        discountCalculated = Math.min(discountCalculated, subtotal + shippingCost);

        setAppliedCoupon(result);
        setCouponDiscountAmount(discountCalculated);
        toast({ title: "Coupon Applied", description: result.message || `Coupon "${result.code}" applied successfully. Discount: ৳${discountCalculated.toFixed(2)}` });
      } else {
        toast({ title: "Invalid Coupon", description: result.message || result.error || "The coupon code entered is not valid or conditions not met.", variant: "destructive" });
        setAppliedCoupon(null);
        setCouponDiscountAmount(0);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast({ title: "Error", description: "An unexpected error occurred while applying the coupon.", variant: "destructive" });
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInputValue('');
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    toast({ title: "Coupon Removed", description: "The coupon has been removed." });
  };


  const onPlaceOrderSubmit: SubmitHandler<AddressFormData> = async (addressData) => {
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Cannot place an order with an empty cart.", variant: "destructive" });
      return;
    }
    setIsPlacingOrder(true);

    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
      image: item.image,
      size: item.size,
      color: item.color,
      appliedDiscountType: item.appliedDiscountType,
      appliedDiscountValue: item.appliedDiscountValue,
    }));

    const orderPayload = {
      items: orderItems,
      totalAmount: grandTotal,
      shippingAddress: addressData,
      paymentMethod: selectedPaymentMethod,
      orderStatus: "Pending" as "Pending",
      appliedCouponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
    };

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const result = await response.json();
        // Clear DB cart if logged in
        if (authToken) {
            try {
                await fetch('/api/cart', { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` }});
            } catch (clearError) {
                console.error("Failed to clear DB cart:", clearError);
                // Non-critical, proceed
            }
        }
        localStorage.removeItem('cart'); // Clear local just in case
        window.dispatchEvent(new Event('cartUpdated'));
        toast({
          title: "Order Placed Successfully!",
          description: `Your order #${result.orderId} has been placed.`,
          variant: "default",
          duration: 7000,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        });
        router.push(`/order-confirmation?orderId=${result.orderId}`);
      } else {
        const errorResult = await response.json();
        toast({
          title: "Order Placement Failed",
          description: errorResult.message || "Could not place your order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to place order. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (pageIsLoading) {
    return <LoadingSpinner text="Loading checkout details..." />;
  }

  if (cartItems.length === 0 && !pageIsLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
          <CardDescription>Redirecting you to shop...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-2 space-y-6">

        {savedAddresses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Saved Address</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedSavedAddressId || ''}
                onValueChange={(addressId) => {
                  const selectedAddr = savedAddresses.find(addr => addr.id === addressId);
                  if (selectedAddr) {
                    form.reset({
                      fullName: selectedAddr.fullName,
                      phone: selectedAddr.phone,
                      streetAddress: selectedAddr.streetAddress,
                      city: selectedAddr.city,
                      postalCode: selectedAddr.postalCode,
                      country: selectedAddr.country,
                    });
                    setSelectedSavedAddressId(addressId);
                    setAddressFormSubtitle("Using selected saved address. You can edit details below.");
                  }
                }}
                className="space-y-3"
              >
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="flex items-start space-x-3 border p-4 rounded-md has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary transition-all">
                    <RadioGroupItem value={addr.id!} id={`addr-${addr.id}`} className="mt-1"/>
                    <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{addr.fullName}</span>
                        {addr.isDefault && <Badge variant="outline" className="ml-2 text-xs border-primary text-primary px-1.5 py-0.5">Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {addr.streetAddress}, {addr.city}, {addr.postalCode}
                      </p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                variant="link"
                className="mt-4 pl-0 text-sm"
                onClick={() => {
                  form.reset({ fullName: '', phone: '', streetAddress: '', city: '', postalCode: '', country: 'Bangladesh' });
                  setSelectedSavedAddressId(null);
                  setAddressFormSubtitle("Enter new shipping address details below.");
                }}
              >
                Or, Enter a New Address
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
            <CardDescription>{addressFormSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onPlaceOrderSubmit)} id="checkout-form" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 01xxxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="streetAddress" render={({ field }) => (
                  <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="House no, Road, Area" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Dhaka" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="postalCode" render={({ field }) => (
                    <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="e.g., 1216" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="CashOnDelivery" onValueChange={(value: PaymentMethod) => setSelectedPaymentMethod(value)} value={selectedPaymentMethod}>
              <div className="flex items-center space-x-3 p-4 border rounded-md hover:border-primary transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary">
                <RadioGroupItem value="CashOnDelivery" id="cod" />
                <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                  Cash on Delivery
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-md text-muted-foreground cursor-not-allowed has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="Card" id="card" disabled />
                <Label htmlFor="card" className="flex-1 opacity-50 cursor-not-allowed flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Card Payment <span className="ml-2 text-xs">(Coming Soon)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-md text-muted-foreground cursor-not-allowed has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="bKash" id="bkash" disabled />
                <Label htmlFor="bkash" className="flex-1 opacity-50 cursor-not-allowed flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  bKash <span className="ml-2 text-xs">(Coming Soon)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card className="shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle className="text-xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {cartItems.map(item => (
              <div key={item.cartKey} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                <div className="relative w-16 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" data-ai-hint="product clothing" />
                </div>
                <div className="flex-grow">
                  <Link href={`/products/${item.productId}`} className="hover:text-primary text-xs font-medium leading-tight">
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                   {item.originalPrice && item.originalPrice > item.price && (
                    <div className="text-xs text-muted-foreground">
                        <span className="line-through">৳{item.originalPrice.toFixed(2)}</span>
                         {item.appliedDiscountType === 'percentage' && item.appliedDiscountValue && (
                           <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">{item.appliedDiscountValue}%</Badge>
                        )}
                        {item.appliedDiscountType === 'fixed' && item.appliedDiscountValue && (
                           <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">৳{item.appliedDiscountValue.toFixed(0)} off</Badge>
                        )}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-primary">৳{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>

          <Separator className="my-3"/>

          <CardContent className="py-3 space-y-2">
            <Label htmlFor="coupon-code" className="text-sm font-medium">Have a Coupon?</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                placeholder="Enter coupon code"
                value={couponInputValue}
                onChange={(e) => setCouponInputValue(e.target.value)}
                disabled={isApplyingCoupon || !!appliedCoupon}
                className="h-9 text-sm flex-grow"
              />
              {!appliedCoupon ? (
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInputValue.trim()}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 shrink-0"
                >
                  {isApplyingCoupon ? <LoadingSpinner size={16} /> : 'Apply'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleRemoveCoupon}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X size={14} className="mr-1"/>Remove
                </Button>
              )}
            </div>
            {appliedCoupon && (
              <p className="text-xs text-green-600 flex items-center mt-1">
                <Tag size={12} className="mr-1"/> Coupon "{appliedCoupon.code}" applied: -৳{couponDiscountAmount.toFixed(2)}
              </p>
            )}
          </CardContent>

          <Separator className="my-3"/>

          <CardContent className="space-y-2">
             <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>{shippingCost === 0 && subtotal > 0 ? 'Free' : (subtotal === 0 ? 'N/A' : `৳${shippingCost.toFixed(2)}`)}</span>
            </div>
            {couponDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Coupon Discount</span>
                <span>-৳{couponDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-md text-foreground">
              <span>Grand Total</span>
              <span>৳{grandTotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-3 mt-2">
            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              className="w-full"
              disabled={cartItems.length === 0 || isPlacingOrder || isApplyingCoupon || pageIsLoading}
            >
              {isPlacingOrder ? (
                <LoadingSpinner size={20} className="mr-2" />
              ) : (
                <CheckCircle size={20} className="mr-2" />
              )}
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </Button>
            <Button variant="link" asChild className="text-sm text-muted-foreground">
              <Link href="/cart">Back to Cart</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
       <style jsx global>{`
        .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--muted)) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted));
            border-radius: 10px;
            border: 2px solid transparent;
             background-clip: content-box;
        }
      `}</style>
    </div>
  );
}

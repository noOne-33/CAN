
'use client';
import Container from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <Container className="max-w-2xl">
      <Card className="shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Order Confirmed!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Thank you for your purchase.
            {orderId && <span className="block mt-1 font-medium">Your Order ID is: #{orderId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            You will receive an email confirmation shortly with your order details.
            If you selected Cash on Delivery, please prepare the exact amount.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/shop">
                <ShoppingBag size={20} className="mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/orders">
                View My Orders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}


export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<Container className="text-center py-10">Loading confirmation...</Container>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}

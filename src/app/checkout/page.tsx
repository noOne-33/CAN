
import CheckoutClient from './CheckoutClient';
import Container from '@/components/shared/Container';

export const metadata = {
  title: 'Checkout - CAN',
  description: 'Complete your purchase.',
};

export default function CheckoutPage() {
  return (
    <Container>
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-lg text-muted-foreground">Review your order and place it.</p>
      </header>
      <CheckoutClient />
    </Container>
  );
}

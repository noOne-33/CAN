
import CartClient from './CartClient';
import Container from '@/components/shared/Container';

export const metadata = {
  title: 'Shopping Cart - CAN',
  description: 'Review the items in your shopping cart and proceed to checkout.',
};

export default function CartPage() {
  return (
    <Container>
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-lg text-muted-foreground">Review your items and proceed to checkout.</p>
      </header>
      <CartClient />
    </Container>
  );
}

import Container from '@/components/shared/Container';
import FashionForm from './FashionForm';

export const metadata = {
  title: 'AI Stylist - CAN',
  description: 'Get personalized fashion suggestions from our AI Stylist.',
};

export default function AIStylistPage() {
  return (
    <Container className="max-w-2xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">AI Fashion Stylist</h1>
        <p className="text-lg text-muted-foreground">
          Describe your style or occasion, and let our AI find the perfect pieces for you.
        </p>
      </header>
      <FashionForm />
    </Container>
  );
}


import OrderDetailClient from './OrderDetailClient';

export const metadata = {
  title: 'Order Details - CAN',
  description: 'View the details of your order.',
};

interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <OrderDetailClient orderId={params.orderId} />
  );
}

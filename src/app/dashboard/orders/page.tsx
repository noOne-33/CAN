
import MyOrdersClient from './MyOrdersClient';

export const metadata = {
  title: 'My Orders - CAN',
  description: 'View your past orders and their status.',
};

export default function MyOrdersPage() {
  console.log('[MyOrdersPage] Rendering MyOrdersPage server component.');
  return (
    <MyOrdersClient />
  );
}

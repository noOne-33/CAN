
import WishlistClient from './WishlistClient';

export const metadata = {
  title: 'Wishlist - CAN',
  description: 'View all products added to your wishlist.',
};

// This page will now primarily render the client component
// which handles its own data fetching based on client-side auth.
export default function WishlistPage() {
  return (
    <WishlistClient />
  );
}

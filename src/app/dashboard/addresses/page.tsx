
import AddressesClient from './AddressesClient';

export const metadata = {
  title: 'Manage Addresses - CAN',
  description: 'View and manage your saved shipping addresses.',
};

export default function AddressesPage() {
  return (
    <AddressesClient />
  );
}

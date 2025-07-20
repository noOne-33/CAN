
import type { ReactNode } from 'react';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, ListOrdered, Heart, MapPin, CreditCard, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const navItems = [
    // { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Currently inactive
    { href: '/dashboard/profile', label: 'My Profile', icon: User },
    { href: '/dashboard/orders', label: 'My Orders', icon: ListOrdered },
    { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/dashboard/addresses', label: 'Manage Addresses', icon: MapPin },
    { href: '/dashboard/payment-methods', label: 'Payment Methods', icon: CreditCard },
    { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <Container>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <h2 className="text-2xl font-headline font-semibold mb-6">User Dashboard</h2>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="w-full justify-start text-base"
              >
                <Link href={item.href} prefetch={item.href === '/dashboard/orders' ? false : undefined}>
                  <item.icon size={20} className="mr-3" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          {children}
        </main>
      </div>
    </Container>
  );
}

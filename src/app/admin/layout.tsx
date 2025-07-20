
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Container from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, Users, Tags, BarChart3, LogOut, TicketPercent, Wrench, Film, Link2 } from 'lucide-react'; // Added Link2
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: Tags },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    { href: '/admin/features', label: 'Features', icon: Wrench },
    { href: '/admin/social-links', label: 'Social Links', icon: Link2 }, // New nav item
    // { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    // Dispatch a storage event so other components (like Header) can react
    window.dispatchEvent(new Event('storage'));
    router.push('/login');
  };

  return (
    <Container>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <h2 className="text-2xl font-headline font-semibold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {adminNavItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="w-full justify-start text-base"
              >
                <Link href={item.href}>
                  <item.icon size={20} className="mr-3" />
                  {item.label}
                </Link>
              </Button>
            ))}
             <hr className="my-4" />
             <Button
                asChild
                variant="outline"
                className="w-full justify-start text-base"
              >
                <Link href="/">
                  Back to Site
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </Button>
          </nav>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5 bg-card p-6 rounded-lg shadow">
          {children}
        </main>
      </div>
    </Container>
  );
}

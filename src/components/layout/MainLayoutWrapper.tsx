'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';

interface MainLayoutWrapperProps {
  children: ReactNode;
  footer: ReactNode; // Accept footer as a prop
}

export default function MainLayoutWrapper({ children, footer }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && footer} {/* Render the passed footer */}
    </>
  );
}

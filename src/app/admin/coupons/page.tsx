
import AdminCouponClient from './AdminCouponClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketPercent } from 'lucide-react';
import { getAdminCoupons } from '@/lib/services/couponService';
import type { Coupon } from '@/types';

export const metadata = {
  title: 'Manage Coupons - Admin - CAN',
  description: 'Create, edit, and manage discount coupons for your store.',
};

export const dynamic = 'force-dynamic';

async function fetchAdminCouponsPageData(): Promise<Coupon[]> {
  console.log('[AdminCouponsPage] Attempting to fetch coupons via service...');
  try {
    const coupons = await getAdminCoupons();
    console.log(`[AdminCouponsPage] Successfully fetched ${coupons.length} coupons.`);
    // Service already converts dates to ISO strings and _id to id.
    return coupons;
  } catch (error: any) {
    console.error('[AdminCouponsPage] CRITICAL: Error fetching coupons:', error.message);
    return [];
  }
}


export default async function AdminCouponsPage() {
  const initialCoupons = await fetchAdminCouponsPageData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <TicketPercent size={24} className="mr-2 text-primary" />
          Manage Coupons
        </CardTitle>
        <CardDescription>Create, view, edit, and manage discount coupons for your e-commerce platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminCouponClient initialCoupons={initialCoupons} />
      </CardContent>
    </Card>
  );
}

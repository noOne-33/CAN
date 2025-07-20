'use client';

import AdminHeroSliderClient from '@/app/admin/hero-slider/AdminHeroSliderClient'; // Corrected alias path
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Film } from 'lucide-react';
import AdminFeaturedBannerClient from './AdminFeaturedBannerClient';

export default function AdminFeaturesClient() {
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Film size={22} className="mr-2 text-primary" />
            CAN Slider Management
          </CardTitle>
          <CardDescription>
            Manage the images, text, and links for the slides displayed in the
            main hero carousel on your homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The AdminHeroSliderClient component handles its own data fetching and state */}
          <AdminHeroSliderClient />
        </CardContent>
      </Card>

      <AdminFeaturedBannerClient />
    </div>
  );
}

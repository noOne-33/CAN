
import AdminFeaturesClient from './AdminFeaturesClient';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export const metadata = {
  title: 'Manage Features - Admin - CAN',
  description: 'Configure various site features like the hero slider, promotions, etc.',
};

export default async function AdminFeaturesPage() {
  // No specific data needs to be fetched here for now,
  // as AdminHeroSliderClient (used within AdminFeaturesClient) fetches its own data.
  // If other features need initial data, fetch it here.
  return (
    <div className="space-y-6">
        <Card className="shadow-lg border-none">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-3xl font-headline">
                    <Wrench size={30} className="mr-3 text-primary" />
                    Site Features
                </CardTitle>
                <CardDescription className="text-md pt-1">
                    Manage and configure different interactive and promotional features of your e-commerce platform.
                </CardDescription>
            </CardHeader>
        </Card>
        <AdminFeaturesClient />
    </div>
  );
}

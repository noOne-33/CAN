
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';
import AdminSocialLinksClient from './AdminSocialLinksClient';

export const metadata = {
  title: 'Manage Social Links - Admin - CAN',
  description: 'Update the social media links for the site footer.',
};

export default function AdminSocialLinksPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Link2 size={24} className="mr-2 text-primary" />
          Manage Social Links
        </CardTitle>
        <CardDescription>
          Provide the full URLs for your social media profiles. These will be displayed in the site footer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* The client component will fetch the data and handle form submission */}
        <AdminSocialLinksClient />
      </CardContent>
    </Card>
  );
}

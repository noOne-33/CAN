
import AdminUserClient from './AdminUserClient';
import { getUsers } from '@/lib/services/userService';
import type { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';


export const metadata = {
  title: 'Manage Users - Admin - CAN',
  description: 'View and manage user accounts and roles.',
};

export const dynamic = 'force-dynamic'; 

async function fetchUsersForAdminPage(): Promise<User[]> {
  console.log('[AdminUsersPage] Attempting to fetch users via service...');
  try {
    const users = await getUsers(); // This already stringifies _id to id
    console.log(`[AdminUsersPage] Successfully fetched ${users.length} users.`);
    // Ensure createdAt is serializable for the client component if not already a string
    return users.map(user => ({
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    }));
  } catch (error: any) {
    console.error('[AdminUsersPage] CRITICAL: Error fetching users:', error.message);
    return [];
  }
}

export default async function AdminUsersPage() {
  const initialUsers = await fetchUsersForAdminPage();

  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-2xl text-destructive">
                <Users size={24} className="mr-2" />
                Configuration Error
                </CardTitle>
                <CardDescription>
                User management is currently unavailable due to missing server configuration (MONGODB_URI or JWT_SECRET).
                Please check the server setup.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                Admin user management features require essential environment variables to be set.
                </p>
            </CardContent>
        </Card>
     );
  }
  
  return (
    <AdminUserClient initialUsers={initialUsers} />
  );
}

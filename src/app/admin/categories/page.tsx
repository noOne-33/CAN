
import AdminCategoryClient from './AdminCategoryClient';
import { getCategoriesWithProductCounts } from '@/lib/services/categoryService';
import type { Category } from '@/types';

export const metadata = {
  title: 'Manage Categories - Admin - CAN',
  description: 'Add, edit, and manage all product categories in the CAN store.',
};

export const dynamic = 'force-dynamic'; 

async function fetchCategoriesForAdminPage(): Promise<Category[]> {
  console.log('[AdminCategoriesPage] Attempting to fetch categories with product counts via service...');
  try {
    const categories = await getCategoriesWithProductCounts();
    console.log(`[AdminCategoriesPage] Successfully fetched ${categories.length} categories with counts.`);
    // Ensure _id is stringified (service should handle this)
    return categories.map(c => ({
        ...c, 
        _id: c._id?.toString(), 
        id: c._id?.toString(),
        productCount: c.productCount || 0,
    }));
  } catch (error: any) {
    console.error('[AdminCategoriesPage] CRITICAL: Error fetching categories with counts:', error.message);
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const initialCategories = await fetchCategoriesForAdminPage();

  return (
    <AdminCategoryClient initialCategories={initialCategories} />
  );
}

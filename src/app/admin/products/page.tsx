
import AdminProductListClient from './AdminProductListClient';
import type { Product } from '@/types';
import { getAdminProducts } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService'; // Import getCategories

export const metadata = {
  title: 'Manage Products - Admin - CAN',
  description: 'Add, edit, and manage all products in the CAN store.',
};

async function fetchProductsForAdminPage(): Promise<Product[]> {
  console.log('[AdminProductsPage] Attempting to fetch products via service...');
  try {
    const products = await getAdminProducts();
    console.log(`[AdminProductsPage] Successfully fetched ${products.length} admin products via service.`);
    return products.map(p => ({...p, _id: p._id?.toString() }));
  } catch (error: any) {
    console.error('[AdminProductsPage] CRITICAL: Error fetching admin products via service:', error.message);
    return [];
  }
}

async function fetchAllCategoriesForAdminPage(): Promise<string[]> {
  console.log('[AdminProductsPage] Attempting to fetch all categories via service...');
  try {
    const categories = await getCategories();
    console.log(`[AdminProductsPage] Successfully fetched ${categories.length} categories for dropdown. Data:`, categories);
    const categoryNames = categories.map(c => c.name).sort();
    console.log(`[AdminProductsPage] Category names for dropdown:`, categoryNames);
    return categoryNames;
  } catch (error: any) {
    console.error('[AdminProductsPage] CRITICAL: Error fetching all categories:', error.message);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await fetchProductsForAdminPage();
  const allCategories = await fetchAllCategoriesForAdminPage(); // Fetch all categories

  return (
    <AdminProductListClient initialProducts={products} categories={allCategories} />
  );
}


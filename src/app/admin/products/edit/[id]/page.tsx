
import ProductForm from '../../ProductForm';
import { getProductById } from '@/lib/services/productService'; 
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCategories } from '@/lib/services/categoryService';

export const metadata = {
  title: 'Edit Product - Admin - CAN',
  description: 'Edit an existing product.',
};

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = params;
  // Fetch product data directly using the service
  const product = await getProductById(id);

  // Fetch all categories for the dropdown
  const categoriesData = await getCategories();
  const availableCategoryNames = categoriesData.map(cat => cat.name).sort();
  console.log('[EditProductPage] Fetched availableCategoryNames for dropdown:', availableCategoryNames);


  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The product you are trying to edit could not be found.</p>
          <Button asChild variant="link" className="mt-4">
            <Link href="/admin/products">Back to Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Ensure product._id is a string for the form and API calls
  const productWithStrId = { ...product, _id: product._id?.toString() };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Edit size={24} className="mr-2 text-primary" />
          Edit Product: {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm 
          mode="edit" 
          initialData={productWithStrId as Product} 
          availableCategories={availableCategoryNames}
        />
      </CardContent>
    </Card>
  );
}

// Enable dynamic rendering for this page as product IDs are dynamic
export const dynamic = 'force-dynamic';

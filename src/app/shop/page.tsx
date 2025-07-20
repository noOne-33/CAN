
import ShopPageClient from './ShopPageClient';
import Container from '@/components/shared/Container';
import { getPublicProducts } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService';
import type { Product, Category } from '@/types';

export const metadata = {
  title: 'Shop - CAN',
  description: 'Browse our latest collection of clothing and accessories.',
};

async function fetchShopData() {
  console.log('[ShopPage] Fetching products for shop page...');
  const products: Product[] = await getPublicProducts();
  console.log(`[ShopPage] Fetched ${products.length} products.`);

  console.log('[ShopPage] Fetching categories for shop page...');
  const categoriesData: Category[] = await getCategories();
  const categoryNames: string[] = categoriesData.map(cat => cat.name).sort();
  console.log(`[ShopPage] Fetched ${categoryNames.length} category names:`, categoryNames);

  return { products, categoryNames };
}

export default async function ShopPage() {
  const { products, categoryNames } = await fetchShopData();

  return (
    <Container>
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Our Collection</h1>
        <p className="text-lg text-muted-foreground">Discover your new favorite pieces.</p>
      </header>
      <ShopPageClient products={products} categories={categoryNames} />
    </Container>
  );
}

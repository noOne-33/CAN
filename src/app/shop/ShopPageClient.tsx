
'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/types';
import InteractiveProductCard from '@/components/products/InteractiveProductCard'; // Changed import
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShopPageClientProps {
  products: Product[];
  categories: string[];
}

export default function ShopPageClient({ products, categories }: ShopPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-xl font-headline font-semibold mb-4 flex items-center">
          <Filter size={20} className="mr-2 text-primary" />
          Categories
        </h2>
        <div className="hidden md:block space-y-2">
          <Button
            variant={selectedCategory === 'All' ? 'default' : 'ghost'}
            onClick={() => setSelectedCategory('All')}
            className="w-full justify-start"
            aria-pressed={selectedCategory === 'All'}
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(category)}
              className="w-full justify-start"
              aria-pressed={selectedCategory === category}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="md:hidden mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>

      <main className="w-full md:w-3/4 lg:w-4/5">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <InteractiveProductCard key={product.id?.toString() || product._id?.toString()} product={product} /> // Changed component
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}

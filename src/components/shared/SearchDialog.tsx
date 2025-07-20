'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Product } from '@/types';
import LoadingSpinner from './LoadingSpinner';

export function SearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data: Product[] = await response.json();
        setResults(data);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);
  
  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setQuery('');
        setResults([]);
        setIsLoading(false);
      }, 300); // Delay to allow fade out animation
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Products</DialogTitle>
          <DialogDescription>
            Start typing to search for products by name, description, or category. Results will appear below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center px-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products by name, description, or category..." 
            className="h-14 w-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="p-6 text-center">
              <LoadingSpinner text="Searching..." />
            </div>
          )}
          
          {!isLoading && query.trim().length > 1 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No products found for "{query}".</p>
          )}

          {results.length > 0 && !isLoading && (
            <div className="p-2">
               <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Products</p>
               <div className="space-y-1">
                 {results.map((product) => (
                  <Link
                    key={product._id?.toString()}
                    href={`/products/${product._id!.toString()}`}
                    onClick={handleSelect}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Image 
                      src={(product.imageUrls && product.imageUrls[0]) || 'https://placehold.co/40x50.png'} 
                      alt={product.name} 
                      width={40} 
                      height={50} 
                      className="rounded-md object-cover aspect-[4/5] bg-muted"
                      data-ai-hint={product.aiHint || "product clothing"}
                    />
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">৳{product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
               </div>
            </div>
          )}

          {!isLoading && query.trim().length < 2 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Enter at least 2 characters to start searching.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

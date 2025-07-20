
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Search, Filter, Eye, ChevronLeft, ChevronRight, PlusCircle, Package as PackageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ProductForm from './ProductForm'; // Assuming ProductForm is in the same directory

interface AdminProductListClientProps {
  initialProducts: Product[];
  categories: string[];
}

export default function AdminProductListClient({ initialProducts, categories }: AdminProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts.map(p => ({...p, _id: p._id?.toString() })));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const { toast } = useToast();

  console.log('[AdminProductListClient] Received categories prop:', categories);

  useEffect(() => {
    setProducts(initialProducts.map(p => ({...p, _id: p._id?.toString() })));
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
      return nameMatch && categoryMatch;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !productToDelete._id) return;

    try {
      const response = await fetch(`/api/admin/products/${productToDelete._id.toString()}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productToDelete._id));
        toast({
          title: "Product Deleted",
          description: `"${productToDelete.name}" has been successfully deleted.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error Deleting Product",
          description: errorData.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Deleting Product",
        description: "An unexpected network error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    // Ensure _id is a string before adding to state
    const productWithStrId = { ...newProduct, _id: newProduct._id?.toString() };
    setProducts(prevProducts => [productWithStrId, ...prevProducts].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    setIsAddProductModalOpen(false);
    toast({
      title: "Product Added",
      description: `"${newProduct.name}" has been successfully added.`,
    });
  };
  
  const currentPage = 1;
  const totalPages = Math.ceil(filteredProducts.length / 10); // Example: 10 items per page

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-2xl">
            <PackageIcon size={26} className="mr-2 text-primary" />
            Product Management
          </CardTitle>
          <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle size={16} className="mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm 
                mode="add" 
                onProductAdded={handleProductAdded} 
                onOperationCancel={() => setIsAddProductModalOpen(false)}
                availableCategories={categories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter size={16} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {(categories || []).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <TableRow key={product._id?.toString()}>
                    <TableCell>
                      <Image
                        src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/40x50.png'}
                        alt={product.name}
                        width={40}
                        height={50}
                        className="rounded object-cover aspect-[4/5]"
                        data-ai-hint={product.aiHint || "product fashion"}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">৳{(product.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center">{product.stock ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product._id?.toString()}`} target="_blank" className="flex items-center">
                              <Eye size={16} className="mr-2" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/edit/${product._id?.toString()}`} className="flex items-center">
                              <Edit size={16} className="mr-2" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive flex items-center">
                            <Trash2 size={16} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found. {searchTerm || selectedCategory !== 'All' ? 'Try adjusting your search or filters.' : 'Add some products!'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Placeholder - Logic not fully implemented */}
        {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <div>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>
            {/* Placeholder page numbers */}
            {[...Array(totalPages > 0 ? totalPages : 1)].map((_, i) => (
              <Button key={i+1} variant={currentPage === i+1 ? "default" : "outline"} size="sm" className="w-9 h-9 p-0">{i+1}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0}>
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                &quot;{productToDelete?.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

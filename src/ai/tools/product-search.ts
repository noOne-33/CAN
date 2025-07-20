'use server';
/**
 * @fileOverview Product search tool for Genkit.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product } from '@/types';
import { ObjectId } from 'mongodb';

// Define the input schema for the tool
const ProductSearchInputSchema = z.object({
  query: z.string().describe('The search query for products. Can be keywords, style descriptions, product names, or categories.'),
});

// Define a schema that is a subset of the full Product type, but contains everything needed for the product card.
const ProductCardSchema = z.object({
  id: z.string(),
  _id: z.string(), // `_id` is also needed by the card's key
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  imageUrls: z.array(z.string()),
  stock: z.number(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().optional(),
  colors: z.array(
    z.object({ name: z.string(), hex: z.string(), image: z.string(), aiHint: z.string() })
  ),
  sizes: z.array(z.string()).optional(),
  aiHint: z.string().optional(),
});
const ProductSearchOutputSchema = z.array(ProductCardSchema).describe('A list of products matching the query.');


// The function that performs the search
async function searchProducts(input: { query: string }): Promise<Product[]> {
  const { db } = await connectToDatabase();
  const productsCollection = db.collection<Product>('products');
  const regex = new RegExp(input.query, 'i');

  const searchResults = await productsCollection.find({
    $or: [
      { name: { $regex: regex } },
      { description: { $regex: regex } },
      { category: { $regex: regex } },
    ],
  }).limit(3).toArray();

  return searchResults.map(p => ({
    ...p,
    id: p._id!.toString(),
    _id: p._id!.toString(),
  }));
}

// Define the Genkit tool
export const productSearchTool = ai.defineTool(
  {
    name: 'productSearchTool',
    description: 'Searches the e-commerce store for products based on a query. Use this to find relevant clothing items to recommend to the user.',
    inputSchema: ProductSearchInputSchema,
    outputSchema: ProductSearchOutputSchema,
  },
  async (input) => {
    console.log(`[productSearchTool] Searching for products with query: "${input.query}"`);
    const products = await searchProducts(input);
    // Map to the format expected by the output schema
    return products.map(p => ({
      id: p.id!,
      _id: p._id!.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      imageUrls: p.imageUrls,
      stock: p.stock,
      discountType: p.discountType === null ? undefined : p.discountType,
      discountValue: p.discountValue === null ? undefined : p.discountValue,
      colors: p.colors,
      sizes: p.sizes,
      aiHint: p.aiHint,
    }));
  }
);

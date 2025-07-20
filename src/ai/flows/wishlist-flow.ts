
'use server';
/**
 * @fileOverview Wishlist management AI flows.
 *
 * - getWishlistFlow - Retrieves a user's wishlist product IDs.
 * - addToWishlistFlow - Adds a product to a user's wishlist.
 * - removeFromWishlistFlow - Removes a product from a user's wishlist.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as wishlistService from '@/lib/services/wishlistService'; // Import the new service

// Input and output schema definitions
const UserIdInputSchema = z.object({
  userId: z.string().describe('User ID'),
});
export type UserIdInput = z.infer<typeof UserIdInputSchema>;

const WishlistProductInputSchema = z.object({
  userId: z.string().describe('User ID'),
  productId: z.string().describe('Product ID'),
});
export type WishlistProductInput = z.infer<typeof WishlistProductInputSchema>;

// Output schema for getWishlistFlow - just product IDs
const WishlistOutputSchema = z.object({
  productIds: z.array(z.string()).describe('List of product IDs in the wishlist'),
});
export type WishlistOutput = z.infer<typeof WishlistOutputSchema>;

const WishlistMutationOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().optional().describe('Message about the result of the operation'),
});
export type WishlistMutationOutput = z.infer<typeof WishlistMutationOutputSchema>;


// Updated functions calling the service
/**
 * Retrieves a specific user's wishlist product IDs.
 * This function is called by the Genkit flow.
 */
async function getWishlistProducts(input: UserIdInput): Promise<WishlistOutput> {
  console.log(`[wishlist-flow] getWishlistProducts called for user: ${input.userId}`);
  const wishlist = await wishlistService.getWishlist(input.userId);
  if (wishlist) {
    return { productIds: wishlist.productIds };
  }
  return { productIds: [] }; // Return empty list if wishlist not found or error
}

/**
 * Adds a product to the wishlist using the service.
 * This function is called by the Genkit flow.
 */
async function addProductToWishlist(input: WishlistProductInput): Promise<WishlistMutationOutput> {
  console.log(`[wishlist-flow] addProductToWishlist called for user ${input.userId}, product ${input.productId}`);
  const success = await wishlistService.addProductToWishlist(input.userId, input.productId);
  return {
    success,
    message: success ? 'Product added to wishlist.' : 'Failed to add product to wishlist.',
  };
}

/**
 * Removes a product from the wishlist using the service.
 * This function is called by the Genkit flow.
 */
async function removeProductFromWishlist(input: WishlistProductInput): Promise<WishlistMutationOutput> {
  console.log(`[wishlist-flow] removeProductFromWishlist for user ${input.userId}, product ${input.productId}`);
  const success = await wishlistService.removeProductFromWishlist(input.userId, input.productId);
  return {
    success,
    message: success ? 'Product removed from wishlist.' : 'Failed to remove product from wishlist.',
  };
}

// Genkit flows
// Flow for getting wishlist
export const getWishlistFlow = ai.defineFlow(
  {
    name: 'getWishlistFlow',
    inputSchema: UserIdInputSchema,
    outputSchema: WishlistOutputSchema,
  },
  async (input) => {
    return getWishlistProducts(input);
  }
);

// Flow for adding to wishlist
export const addToWishlistFlow = ai.defineFlow(
  {
    name: 'addToWishlistFlow',
    inputSchema: WishlistProductInputSchema,
    outputSchema: WishlistMutationOutputSchema,
  },
  async (input) => {
    return addProductToWishlist(input);
  }
);

// Flow for removing from wishlist
export const removeFromWishlistFlow = ai.defineFlow(
  {
    name: 'removeFromWishlistFlow',
    inputSchema: WishlistProductInputSchema,
    outputSchema: WishlistMutationOutputSchema,
  },
  async (input) => {
    return removeProductFromWishlist(input);
  }
);


/**
 * Genkit Prompt (Example, if wishlist-based recommendations are needed)
 * This prompt is not currently used, but it's an idea for the future.
 */
const wishlistRecommendationPrompt = ai.definePrompt({
  name: 'wishlistRecommendationPrompt',
  input: { schema: WishlistOutputSchema }, // Wishlist as input
  // Output schema needs to be defined here (e.g., list of recommended products)
  // output: { schema: RecommendedProductsSchema },
  prompt: `A user's wishlist is provided below:
{{#each productIds}}
- Product ID: {{this}}
{{/each}}

Based on this list, recommend some more products to them.`,
});

'use server';

/**
 * @fileOverview AI fashion suggestion agent.
 *
 * - generateFashionSuggestions - A function that generates fashion suggestions and finds relevant products.
 * - GenerateFashionSuggestionsInput - The input type for the generateFashionSuggestions function.
 * - GenerateFashionSuggestionsOutput - The return type for the generateFashionSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { productSearchTool } from '@/ai/tools/product-search';

const GenerateFashionSuggestionsInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords describing a style or occasion for fashion suggestions.'),
});
export type GenerateFashionSuggestionsInput = z.infer<
  typeof GenerateFashionSuggestionsInputSchema
>;

// This schema must match the output schema of the tool
const ProductCardSchema = z.object({
  id: z.string(),
  _id: z.string(),
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

const GenerateFashionSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of 3-5 suggested general clothing items or style tips based on the keywords. Be creative and helpful.'),
  recommendedProducts: z.array(ProductCardSchema).optional().describe('A list of specific products from the store that match the user\'s query.'),
});
export type GenerateFashionSuggestionsOutput = z.infer<
  typeof GenerateFashionSuggestionsOutputSchema
>;

export async function generateFashionSuggestions(
  input: GenerateFashionSuggestionsInput
): Promise<GenerateFashionSuggestionsOutput> {
  return generateFashionSuggestionsFlow(input);
}

// A more focused prompt just for generating text-based suggestions.
const textSuggestionPrompt = ai.definePrompt({
  name: 'textSuggestionPrompt',
  input: { schema: GenerateFashionSuggestionsInputSchema },
  output: { schema: z.object({
    suggestions: z
      .array(z.string())
      .describe('A list of 3-5 suggested general clothing items or style tips based on the keywords. Be creative and helpful.'),
  })},
  prompt: `You are a personal fashion assistant. Based on the keywords that the user provides, provide a few (3-5) general style suggestions or tips. Only suggest clothing, and do not suggest other accessories such as jewelry.

Keywords: {{{keywords}}}`,
});


const generateFashionSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateFashionSuggestionsFlow',
    inputSchema: GenerateFashionSuggestionsInputSchema,
    outputSchema: GenerateFashionSuggestionsOutputSchema,
  },
  async (input) => {
    // We orchestrate the calls to the text model and the tool separately
    // to ensure the products are always from our database via the tool.
    
    // 1. Call the product search tool with the user's keywords.
    const recommendedProducts = await productSearchTool({ query: input.keywords });

    // 2. Call the language model to get creative text suggestions.
    const { output: suggestionsOutput } = await textSuggestionPrompt(input);

    // 3. Combine the results and return them.
    return {
      suggestions: suggestionsOutput?.suggestions || [],
      recommendedProducts: recommendedProducts || [],
    };
  }
);

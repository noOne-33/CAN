'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateFashionSuggestions } from '@/ai/flows/generate-fashion-suggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Sparkles, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Product } from '@/types';
import InteractiveProductCard from '@/components/products/InteractiveProductCard';
import { Separator } from '@/components/ui/separator';


const formSchema = z.object({
  keywords: z.string().min(3, { message: 'Please enter at least 3 characters.' }).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function FashionForm() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setRecommendedProducts([]);
    
    try {
      const result = await generateFashionSuggestions({ keywords: data.keywords });
      
      let hasContent = false;
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
        hasContent = true;
      }
      
      if (result.recommendedProducts && result.recommendedProducts.length > 0) {
        setRecommendedProducts(result.recommendedProducts as Product[]);
        hasContent = true;
      }

      if (!hasContent) {
        setError("No specific suggestions or products found. Try different keywords!");
      }

    } catch (e) {
      console.error(e);
      setError('An error occurred while generating suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Sparkles size={28} className="mr-2 text-primary" />
          Get Your Style Suggestions
        </CardTitle>
        <CardDescription>
          Enter keywords like "summer beach party" or "formal business meeting" to get ideas and find related products from our store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., casual weekend, wedding guest" {...field} className="text-base py-2 px-3"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full text-base py-3">
              {isLoading ? (
                <LoadingSpinner size={20} className="mr-2" />
              ) : (
                <Sparkles size={18} className="mr-2" />
              )}
              Get Suggestions
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-8 text-center">
            <LoadingSpinner text="Our AI stylist is thinking..." />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-8">
            <Bot className="h-4 w-4" />
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (suggestions.length > 0 || recommendedProducts.length > 0) && (
          <div className="mt-8 space-y-8">
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-xl font-headline font-semibold mb-4">Style Ideas:</h3>
                <ul className="list-disc list-inside space-y-2 pl-4 bg-secondary/30 p-4 rounded-md">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-foreground/90">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {recommendedProducts.length > 0 && (
              <div>
                <Separator className="my-6" />
                <h3 className="text-xl font-headline font-semibold mb-4">Recommended Products From Our Store:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {recommendedProducts.map((product) => (
                    <InteractiveProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && !error && suggestions.length === 0 && recommendedProducts.length === 0 && form.formState.isSubmitted && (
           <Alert className="mt-8">
            <Bot className="h-4 w-4" />
            <AlertTitle>No Results</AlertTitle>
            <AlertDescription>
              We couldn't find any suggestions or products for your keywords. Please try something else!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

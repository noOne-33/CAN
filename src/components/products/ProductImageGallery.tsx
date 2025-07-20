
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Product, ProductColor } from '@/types';
import ColorSwatch from './ColorSwatch';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  product: Product;
  onColorSelect?: (color: ProductColor) => void; // Callback to inform parent of color selection
}

export default function ProductImageGallery({ product, onColorSelect }: ProductImageGalleryProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [imageLoadKey, setImageLoadKey] = useState<number>(Date.now());

  const getDefaultImage = useCallback(() => {
    const firstColorWithImage = product.colors.find(c => c.image && c.image.trim() !== '');
    return firstColorWithImage?.image || product.imageUrls?.[0] || 'https://placehold.co/600x800.png';
  }, [product.colors, product.imageUrls]);

  useEffect(() => {
    const initialColor = product.colors.length > 0 ? product.colors[0] : null;
    if (initialColor) {
      setSelectedColorName(initialColor.name);
      setActiveImageUrl(initialColor.image || product.imageUrls?.[0] || 'https://placehold.co/600x800.png');
      if (onColorSelect) {
        onColorSelect(initialColor);
      }
    } else {
      setActiveImageUrl(product.imageUrls?.[0] || 'https://placehold.co/600x800.png');
    }
    setImageLoadKey(Date.now());
  }, [product, onColorSelect]);


  const handleThumbnailClick = (imageUrl: string) => {
    if (activeImageUrl !== imageUrl) {
      setActiveImageUrl(imageUrl);
      // If a general thumbnail is clicked, we assume it might not correspond to a specific color variant,
      // or the user is overriding the color-specific image choice.
      // We could clear selectedColorName or find the color that matches this URL if it exists.
      // For simplicity, let's find if any color has this as its primary image.
      const matchingColor = product.colors.find(c => c.image === imageUrl);
      if (matchingColor) {
        setSelectedColorName(matchingColor.name);
        if (onColorSelect) onColorSelect(matchingColor);
      } else {
        setSelectedColorName(null); // Clear selected color if thumbnail doesn't match a color variant image
         if (onColorSelect && product.colors.length > 0) { // Pass first color if available
            onColorSelect(product.colors[0]);
        }
      }
      setImageLoadKey(Date.now());
    }
  };

  const handleColorSwatchSelect = (color: ProductColor) => {
    if (selectedColorName !== color.name) {
      setSelectedColorName(color.name);
      setActiveImageUrl(color.image || getDefaultImage()); // Use color-specific image or fallback
      if (onColorSelect) {
        onColorSelect(color);
      }
      setImageLoadKey(Date.now());
    }
  };

  const placeholderImage = 'https://placehold.co/600x800.png';
  const mainImageAiHint = product.colors.find(c => c.name === selectedColorName)?.aiHint || product.aiHint || 'fashion product';


  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg bg-muted">
        <Image
          key={imageLoadKey} 
          src={activeImageUrl || placeholderImage}
          alt={`${product.name}${selectedColorName ? ` - ${selectedColorName}` : ''}`}
          data-ai-hint={mainImageAiHint}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-opacity duration-500 ease-in-out animate-fadeIn"
          priority
          onError={() => {
             console.warn(`Failed to load image: ${activeImageUrl}. Falling back.`);
             setActiveImageUrl(getDefaultImage());
             setImageLoadKey(Date.now());
          }}
        />
      </div>

      {product.imageUrls && product.imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {product.imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(url)}
              className={cn(
                "block w-20 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                (activeImageUrl === url ) ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/50"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={url || placeholderImage}
                alt={`${product.name} thumbnail ${index + 1}`}
                data-ai-hint={product.aiHint || "product thumbnail"}
                width={80}
                height={96}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {product.colors && product.colors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Color: <span className="font-bold">{selectedColorName || product.colors[0]?.name || 'Default'}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <ColorSwatch
                key={color.name}
                color={color.name}
                hex={color.hex}
                isSelected={selectedColorName === color.name}
                onClick={() => handleColorSwatchSelect(color)}
              />
            ))}
          </div>
        </div>
      )}
       <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--muted)) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
            height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted));
            border-radius: 10px;
            border: 3px solid transparent;
        }
      `}</style>
    </div>
  );
}


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateEffectivePrice(
  originalPrice: number,
  discountType?: 'percentage' | 'fixed',
  discountValue?: number
): { effectivePrice: number; discountAmount: number; originalPriceDisplay?: number; discountText?: string } {
  let discountText: string | undefined;
  if (discountType && discountValue && discountValue > 0 && originalPrice > 0) {
    if (discountType === 'percentage') {
      if (discountValue >= 1 && discountValue <= 99) {
        const discount = (originalPrice * discountValue) / 100;
        discountText = `${discountValue}% OFF`;
        return {
          effectivePrice: parseFloat((originalPrice - discount).toFixed(2)),
          discountAmount: parseFloat(discount.toFixed(2)),
          originalPriceDisplay: originalPrice,
          discountText,
        };
      }
    } else if (discountType === 'fixed') {
      if (discountValue < originalPrice) {
        discountText = `৳${discountValue.toFixed(0)} OFF`;
        return {
          effectivePrice: parseFloat((originalPrice - discountValue).toFixed(2)),
          discountAmount: discountValue,
          originalPriceDisplay: originalPrice,
          discountText,
        };
      }
    }
  }
  return { effectivePrice: originalPrice, discountAmount: 0, discountText: undefined };
}

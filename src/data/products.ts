import type { Product } from '@/types';

export const productsData: Product[] = [
  {
    id: '1',
    name: 'Classic Cotton Tee',
    description: 'A timeless classic, this 100% cotton t-shirt offers comfort and style. Perfect for everyday wear.',
    price: 29.99,
    category: 'Shirts',
    defaultImage: 'https://placehold.co/600x800.png',
    aiHint: 'white t-shirt',
    colors: [
      { name: 'White', hex: '#FFFFFF', image: 'https://placehold.co/600x800.png', aiHint: 'white t-shirt' },
      { name: 'Black', hex: '#000000', image: 'https://placehold.co/600x800.png', aiHint: 'black t-shirt' },
      { name: 'Navy', hex: '#000080', image: 'https://placehold.co/600x800.png', aiHint: 'navy t-shirt' },
    ],
  },
  {
    id: '2',
    name: 'Slim Fit Chinos',
    description: 'Versatile and stylish, these slim fit chinos are made from a comfortable stretch cotton blend. Ideal for smart-casual occasions.',
    price: 79.99,
    category: 'Pants',
    defaultImage: 'https://placehold.co/600x800.png',
    aiHint: 'khaki pants',
    colors: [
      { name: 'Khaki', hex: '#F0E68C', image: 'https://placehold.co/600x800.png', aiHint: 'khaki pants' },
      { name: 'Olive', hex: '#808000', image: 'https://placehold.co/600x800.png', aiHint: 'olive pants' },
      { name: 'Grey', hex: '#808080', image: 'https://placehold.co/600x800.png', aiHint: 'grey pants' },
    ],
  },
  {
    id: '3',
    name: 'Leather Belt',
    description: 'A high-quality genuine leather belt with a classic metal buckle. Adds a finishing touch to any outfit.',
    price: 49.99,
    category: 'Accessories',
    defaultImage: 'https://placehold.co/400x300.png',
    aiHint: 'brown belt',
    colors: [
      { name: 'Brown', hex: '#A52A2A', image: 'https://placehold.co/400x300.png', aiHint: 'brown belt' },
      { name: 'Black', hex: '#000000', image: 'https://placehold.co/400x300.png', aiHint: 'black belt' },
    ],
  },
  {
    id: '4',
    name: 'Silk Scarf',
    description: 'Luxurious 100% silk scarf with a vibrant print. An elegant accessory for any season.',
    price: 65.00,
    category: 'Accessories',
    defaultImage: 'https://placehold.co/400x300.png',
    aiHint: 'floral scarf',
    colors: [
      { name: 'Floral Blue', hex: '#ADD8E6', image: 'https://placehold.co/400x300.png', aiHint: 'blue scarf' },
      { name: 'Abstract Red', hex: '#FFC0CB', image: 'https://placehold.co/400x300.png', aiHint: 'red scarf' },
    ],
  },
  {
    id: '5',
    name: 'Denim Jacket',
    description: 'A rugged and stylish denim jacket, perfect for layering. Features classic button-front styling and chest pockets.',
    price: 119.99,
    category: 'Outerwear',
    defaultImage: 'https://placehold.co/600x800.png',
    aiHint: 'blue jacket',
    colors: [
      { name: 'Classic Blue', hex: '#4682B4', image: 'https://placehold.co/600x800.png', aiHint: 'blue jacket' },
      { name: 'Washed Black', hex: '#36454F', image: 'https://placehold.co/600x800.png', aiHint: 'black jacket' },
    ],
  },
  {
    id: '6',
    name: 'Linen Shirt',
    description: 'Lightweight and breathable linen shirt, ideal for warm weather. Features a relaxed fit and button-down collar.',
    price: 75.50,
    category: 'Shirts',
    defaultImage: 'https://placehold.co/600x800.png',
    aiHint: 'white shirt',
    colors: [
      { name: 'Natural White', hex: '#F5F5DC', image: 'https://placehold.co/600x800.png', aiHint: 'white shirt' },
      { name: 'Sky Blue', hex: '#87CEEB', image: 'https://placehold.co/600x800.png', aiHint: 'blue shirt' },
    ],
  },
];


import type { ReactNode } from 'react';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  category?: string;
  excerpt: string;
  image: string;
  aiHint: string;
  // The 'content' property which contained JSX has been removed.
}

export const blogPosts: Omit<BlogPost, 'content'>[] = [
  {
    id: '1',
    slug: 'summer-trends-2024',
    title: 'Top 5 Fashion Trends for Summer 2024',
    date: 'July 15, 2024',
    category: 'Trends',
    excerpt: 'Discover the hottest looks for the summer season, from vibrant colors and sheer fabrics to the revival of \'90s minimalism...',
    image: 'https://images.unsplash.com/photo-1598363777525-4818477ba9f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxzdW1tZXIlMjBmYXNoaW9uJTIwdHJlbmRzfGVufDB8fHx8MTc1MTEzMjEzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'summer fashion trends',
  },
  {
    id: '2',
    slug: 'style-denim-jacket',
    title: 'How to Style Your Denim Jacket: 7 Creative Ways',
    date: 'July 10, 2024',
    category: 'Style Guides',
    excerpt: 'The denim jacket is a versatile wardrobe staple. Learn new ways to style it for any occasion, from classic double denim to smart casual looks...',
    image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGphY2tldCUyMHN0eWxlfGVufDB8fHx8MTc1MTEzMjEzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'denim jacket style',
  },
  {
    id: '3',
    slug: 'sustainable-fashion-commitment',
    title: 'Behind the Seams: Our Commitment to Sustainable Fashion',
    date: 'July 5, 2024',
    category: 'Our Brand',
    excerpt: 'At CAN, we believe in fashion that feels good and does good. Read about our sustainability efforts, from materials to production...',
    image: 'https://images.unsplash.com/photo-1711016948399-70b57cd06d90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzdXN0YWluYWJsZSUyMGZhc2hpb24lMjBicmFuZHxlbnwwfHx8fDE3NTExMzIxMzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'sustainable fashion brand',
  },
];

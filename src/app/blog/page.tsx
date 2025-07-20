
import Container from '@/components/shared/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { blogPosts } from '@/data/blogData'; // Import from the new data source

export const metadata = {
  title: 'Blog - CAN',
  description: 'Read the latest fashion news, style tips, and updates from CAN.',
};

export default function BlogPage() {
  return (
    <Container>
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-3">Our Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest fashion trends, style guides, and news from CAN.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Card key={post.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="aspect-video relative w-full">
                <Image
                  src={post.image}
                  alt={post.title}
                  data-ai-hint={post.aiHint}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </Link>
            <CardHeader>
              <CardTitle className="text-xl leading-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">{post.date}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild variant="link" className="p-0 text-primary">
                <Link href={`/blog/${post.slug}`}>Read More &rarr;</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}

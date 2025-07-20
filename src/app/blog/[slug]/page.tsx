
import { blogPosts } from '@/data/blogData';
import { notFound } from 'next/navigation';
import Container from '@/components/shared/Container';
import Image from 'next/image';
import { Calendar, Tag } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next'
import type { ReactNode } from 'react';

type Props = {
  params: { slug: string }
}

const blogContentMap: Record<string, ReactNode> = {
  'summer-trends-2024': (
    <>
      <p className="lead">As the days get longer and the weather warms up, it's time to refresh your wardrobe with the latest summer styles. This season is all about embracing bold expressions, functional designs, and a touch of nostalgic elegance. Here are the top five fashion trends you need to know for Summer 2024.</p>
      
      <h2>1. Utility and Cargo Everywhere</h2>
      <p>Practicality meets high fashion this summer with the explosion of utility wear. Cargo pants, once a relic of the early 2000s, are back with a vengeance in more refined silhouettes. Look for tailored cargo trousers in neutral tones like khaki, olive, and beige. It’s not just about pants; multi-pocketed vests, boiler suits, and safari jackets are also making a statement. The key is to balance the functional elements with more polished pieces—pair your cargo pants with a simple silk camisole or a fitted bodysuit for a chic, modern look.</p>

      <h2>2. Dopamine Dressing with Bold Hues</h2>
      <p>Say goodbye to muted tones and hello to a riot of color! Summer 2024 is all about "dopamine dressing"—wearing clothes that boost your mood. Think vibrant, saturated shades like cobalt blue, fiery red, canary yellow, and kelly green. Don't be afraid to go for a full monochromatic look or mix and match contrasting bold colors for a truly eye-catching ensemble. A bright yellow sundress or a sharp red blazer can instantly elevate your style and your spirits.</p>

      <h2>3. The Elegance of Sheer Fabrics</h2>
      <p>Sheer fabrics are adding a layer of sophisticated allure to summer fashion. Organza, chiffon, and fine mesh are being used in everything from blouses and dresses to skirts and outerwear. The beauty of this trend lies in its versatility. You can layer a sheer blouse over a bralette for a daring evening look, or wear a sheer dress over a slip for a more demure, ethereal vibe. It’s a delicate balance of revealing and concealing that feels both romantic and modern.</p>

      <h2>4. The '90s Minimalism Revival</h2>
      <p>On the other end of the spectrum from bold colors, '90s minimalism is making a major comeback. This trend focuses on clean lines, simple silhouettes, and a neutral color palette. Key pieces include slip dresses, straight-leg trousers, simple tank tops, and tube skirts. The fabrics are understated but luxurious—think silks, satins, and lightweight knits. It’s an effortlessly cool aesthetic that prioritizes quality and fit over flashy details.</p>

      <h2>5. Statement Accessories</h2>
      <p>No outfit is complete without the right accessories, and this summer, they are anything but subtle. Jewelry is big and bold—chunky chain necklaces, oversized hoop earrings, and sculptural cuffs are the go-to pieces. In eyewear, futuristic, shield-like sunglasses are competing with classic oversized frames. Handbags are also getting the statement treatment with unique shapes and vibrant colors. These accessories are the perfect way to add a personal touch and a dose of drama to even the simplest outfits.</p>

      <p className="mt-6">Ultimately, Summer 2024 fashion is about expressing your unique personality. Whether you gravitate towards the practicality of utility wear or the mood-boosting power of bright colors, these trends offer a fantastic playground for style exploration. Mix, match, and have fun with it!</p>
    </>
  ),
  'style-denim-jacket': (
     <>
      <p className="lead">The denim jacket is arguably one of the most timeless and versatile pieces of clothing anyone can own. It transcends seasons, styles, and occasions. But are you getting the most out of yours? Here are seven creative ways to style your denim jacket and unlock its full potential.</p>

      <h3>1. The Classic Double Denim</h3>
      <p>Once considered a fashion faux pas, "double denim" is now a certified style move when done right. The trick is to play with contrasting shades. Pair a light-wash denim jacket with dark-wash or black skinny jeans. This creates a clear separation and avoids the "denim suit" look. Complete the outfit with a simple white tee and your favorite sneakers or ankle boots.</p>

      <h3>2. Over a Summer Dress</h3>
      <p>Create a beautiful juxtaposition by throwing a slightly oversized denim jacket over a delicate, feminine dress. Whether it's a floral maxi dress or a simple satin slip, the ruggedness of the denim adds a cool, casual edge. This is the perfect transitional outfit for a cool summer evening or a crisp autumn day.</p>

      <h3>3. Layered with a Hoodie</h3>
      <p>For an ultimate off-duty, street-style look, layer your denim jacket over a comfortable hoodie. A grey, black, or even a brightly colored hoodie works perfectly. Pair this combo with leggings, joggers, or relaxed-fit jeans. It's a look that’s both stylish and incredibly comfortable.</p>

      <h3>4. Paired with Tailored Trousers</h3>
      <p>Elevate your denim jacket for a smart-casual setting by pairing it with tailored trousers. A dark, well-fitted denim jacket looks surprisingly sharp with pleated wool trousers or slim-fit chinos. This high-low combination is unexpected and chic, perfect for a creative workplace or a stylish weekend brunch.</p>

      <h3>5. Worn as a Shirt</h3>
      <p>Who says a jacket can't be a top? Choose a softer, more lightweight denim jacket and wear it fully buttoned up as a shirt. You can tuck it into a high-waisted skirt or wide-leg trousers for a fashion-forward, structured look. This works best with jackets that have a slimmer fit.</p>

      <h3>6. Draped Over the Shoulders</h3>
      <p>For an effortlessly cool and sophisticated vibe, simply drape your denim jacket over your shoulders without putting your arms through the sleeves. This styling trick works beautifully over a cocktail dress, a jumpsuit, or a simple top-and-trousers combo. It adds a touch of structure and an "I just threw this on" elegance.</p>

      <h3>7. With a Statement Skirt</h3>
      <p>Let your skirt do the talking by pairing a bold piece with your simple denim jacket. A metallic pleated midi skirt, a vibrant sequined mini, or a flowy tulle skirt all look fantastic when grounded by the classic, casual nature of denim. The jacket acts as the perfect neutral canvas to let your statement piece shine.</p>

      <p className="mt-6">The denim jacket is more than just an outerwear item; it’s a styling tool. Experiment with these ideas and see how this humble classic can transform your wardrobe.</p>
    </>
  ),
  'sustainable-fashion-commitment': (
     <>
      <p className="lead">In a world of fast fashion, we at CAN believe in a different approach. For us, style and sustainability are not mutually exclusive. We are on a journey to build a brand that not only makes you look good but also feel good about your choices. This is our commitment to a more sustainable future in fashion.</p>

      <h3>Pillar 1: Eco-Conscious Materials</h3>
      <p>Our journey begins with the very threads of our clothing. We prioritize materials that have a lower impact on the environment. This includes using GOTS-certified organic cotton, which is grown without harmful pesticides; linen, which requires minimal water; and innovative recycled fabrics that give new life to post-consumer waste. By choosing better materials, we reduce our environmental footprint from the ground up.</p>

      <h3>Pillar 2: Ethical Production</h3>
      <p>We believe that the people who make our clothes are just as important as the people who wear them. We partner with manufacturers who share our values of fairness and transparency. This means ensuring that every worker in our supply chain receives fair wages, works in safe conditions, and is treated with dignity and respect. We build long-term relationships with our partners to foster a community of ethical craftsmanship.</p>

      <h3>Pillar 3: Timeless Design, Not Fast Trends</h3>
      <p>Fast fashion thrives on fleeting trends, encouraging a cycle of overconsumption. We design our pieces to be timeless and durable. Our goal is to create high-quality wardrobe staples that you can wear and love for years, not just a single season. By focusing on classic silhouettes and superior craftsmanship, we encourage a more mindful and lasting relationship with your clothes.</p>

      <h3>Pillar 4: Mindful Packaging and Reduced Waste</h3>
      <p>Our commitment extends to how our products reach you. We have eliminated single-use plastics from our packaging, opting instead for recycled and recyclable materials. We also produce in smaller, considered batches to avoid overproduction and minimize waste. Every step of our process is an opportunity to make a more responsible choice.</p>

      <h3>Our Journey Ahead</h3>
      <p>We know that sustainability is an ongoing journey, not a final destination. We are continuously learning and seeking new ways to improve. Our goals for the future include exploring more innovative materials, achieving greater transparency in our supply chain, and finding circular solutions for our products at the end of their life.</p>
      
      <p className="mt-6">When you choose CAN, you are not just buying a piece of clothing—you are supporting a vision for a more beautiful, equitable, and sustainable fashion industry. Thank you for being a part of our journey.</p>
    </>
  ),
};

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const post = blogPosts.find((post) => post.slug === slug);

  if (!post) {
    return {
      title: 'Post Not Found - CAN',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  return {
    title: `${post.title} - CAN Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  }
}

// Generate static paths at build time
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <Container className="max-w-4xl">
      <article>
        <header className="mb-8">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-6">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
              data-ai-hint={post.aiHint}
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground space-x-4">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1.5" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center">
              <Tag size={14} className="mr-1.5" />
              <span>{post.category || "Fashion"}</span>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none text-foreground/90 prose-h2:font-headline prose-h2:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
          {blogContentMap[post.slug] || <p>Blog content could not be loaded.</p>}
        </div>
      </article>
    </Container>
  );
}

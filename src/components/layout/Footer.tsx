
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/shared/Container';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { getSocialLinks } from '@/lib/services/siteSettingsService';

export default async function Footer() {
  const socialLinks = await getSocialLinks();

  return (
    <footer className="bg-primary text-primary-foreground mt-auto pt-10 pb-4">
      <Container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: About & Social */}
        <div>
          <h2 className="text-2xl font-headline font-bold mb-4">CAN</h2>
          <p className="text-sm text-primary-foreground/80 mb-4">
            Discover your perfect style with our curated collection of premium fashion items. Quality and trends delivered to your doorstep.
          </p>
          <div className="flex space-x-4">
            {socialLinks.facebook && (
              <Link href={socialLinks.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:scale-110 transform">
                <Facebook size={20} />
              </Link>
            )}
            {socialLinks.instagram && (
              <Link href={socialLinks.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:scale-110 transform">
                <Instagram size={20} />
              </Link>
            )}
            {socialLinks.twitter && (
              <Link href={socialLinks.twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:scale-110 transform">
                <Twitter size={20} />
              </Link>
            )}
            {socialLinks.youtube && (
              <Link href={socialLinks.youtube} aria-label="Youtube" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:scale-110 transform">
                <Youtube size={20} />
              </Link>
            )}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-lg font-headline font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Home</Link></li>
            <li><Link href="/shop" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Shop</Link></li>
            <li><Link href="/about" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">About Us</Link></li>
            <li><Link href="/contact" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Contact Us</Link></li>
            <li><Link href="/blog" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Blog</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Service */}
        <div>
          <h3 className="text-lg font-headline font-semibold mb-4">Customer Service</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard/profile" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">My Account</Link></li>
            <li><Link href="/dashboard/orders" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Order Tracking</Link></li>
            <li><Link href="/dashboard/wishlist" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Wishlist</Link></li>
            <li><Link href="/terms" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="block text-primary-foreground/80 hover:text-accent transition-all duration-300 hover:translate-x-1">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Our Location */}
        <div>
          <h3 className="text-lg font-headline font-semibold mb-4">Our Location</h3>
          <div className="aspect-video w-full rounded-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!m12!1m3!1d1809.6097979586339!2d91.86200423860689!3d24.89049012754853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3751aacd70cd7665%3A0xc8ae330ad72490dd!2sNorth%20East%20University%20Bangladesh%2CSylhet!5e0!3m2!1sen!2sbd!4v1746296865948!5m2!1sen!2sbd"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Our Location Map"
              className="w-full h-full"
            ></iframe>
          </div>
          <p className="text-sm mt-2 text-primary-foreground/80">North East University Bangladesh,Sylhet</p>
        </div>
      </Container>
      <div className="border-t border-primary-foreground/20 mt-6 pt-4 text-center">
        <p className="text-xs text-primary-foreground/70">
          &copy; {new Date().getFullYear()} CAN Fashion. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { Shirt, Sparkles, HomeIcon, LogIn, UserPlus, LayoutDashboard, Search, Heart, ShoppingCart, User, Menu, Info, MessageSquare, LogOut, UserCog } from 'lucide-react';
import Container from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Cart, CartItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { SearchDialog } from '@/components/shared/SearchDialog'; // New Import

export default function Header() {
  const [loggedInUserRole, setLoggedInUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New State

  const router = useRouter();

  // Add keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])


  const checkAuth = useCallback(() => {
    console.log("[Header] checkAuth called");
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const currentIsAuthenticated = !!token;

    setIsAuthenticated(currentIsAuthenticated);
    setLoggedInUserRole(currentIsAuthenticated ? role : null);
    setIsLoadingAuth(false);
    console.log("[Header] checkAuth - isAuthenticated:", currentIsAuthenticated, "Role:", currentIsAuthenticated ? role : null);
    return currentIsAuthenticated;
  }, []);


  const updateCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("[Header] updateCartCount - Not authenticated, setting count to 0");
      setCartItemCount(0);
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log("[Header] updateCartCount - No token, setting count to 0");
      setCartItemCount(0);
      return;
    }
    console.log("[Header] updateCartCount - Authenticated, fetching DB cart count");
    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const cartData: Cart = await response.json();
        setCartItemCount(cartData.items.reduce((total, item) => total + item.quantity, 0));
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("Error fetching DB cart for header:", error);
      setCartItemCount(0);
    }
  }, [isAuthenticated]);

  const updateWishlistCount = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("[Header] updateWishlistCount - Not authenticated, setting count to 0");
      setWishlistItemCount(0);
      return;
    }
     const token = localStorage.getItem('authToken');
     if (!token) {
        console.log("[Header] updateWishlistCount - No token, setting count to 0");
        setWishlistItemCount(0);
        return;
    }
    console.log("[Header] updateWishlistCount - Authenticated, fetching DB wishlist count");
    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: { productIds: string[] } = await response.json();
        setWishlistItemCount(data.productIds ? data.productIds.length : 0);
      } else {
        setWishlistItemCount(0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
      setWishlistItemCount(0);
    }
  }, [isAuthenticated]);


  useEffect(() => {
    checkAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken' || event.key === 'userRole' || event.key === null) {
        console.log("[Header] Storage event triggered for auth keys or clear all. Re-checking auth.");
        checkAuth();
      }
    };

    const handleCartUpdate = () => {
      console.log("[Header] cartUpdated event received, re-fetching cart count if authenticated.");
      if (isAuthenticated) updateCartCount(); else setCartItemCount(0);
    };
    const handleWishlistUpdate = () => {
      console.log("[Header] wishlistUpdated event received, re-fetching wishlist count if authenticated.");
      if (isAuthenticated) updateWishlistCount(); else setWishlistItemCount(0);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [checkAuth, isAuthenticated, updateCartCount, updateWishlistCount]);


  useEffect(() => {
    console.log("[Header] isAuthenticated changed to:", isAuthenticated, "Updating counts accordingly.");
    if (isAuthenticated) {
      updateCartCount();
      updateWishlistCount();
    } else {
      setCartItemCount(0);
      setWishlistItemCount(0);
    }
  }, [isAuthenticated, updateCartCount, updateWishlistCount]);


  const handleLogout = () => {
    const tokenBeforeLogout = localStorage.getItem('authToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.dispatchEvent(new StorageEvent('storage', { key: 'authToken', oldValue: tokenBeforeLogout, newValue: null, storageArea: localStorage }));
    router.push('/login');
    setIsSheetOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/shop', label: 'Shop', icon: Shirt },
    { href: '/ai-stylist', label: 'AI Stylist', icon: Sparkles },
    { href: '/blog', label: 'Blog', icon: Info },
    { href: '/contact', label: 'Contact', icon: MessageSquare },
  ];

  let authActionIcon;
  let authActionLink = "/login";
  let authActionLabel = "Login";

  if (!isLoadingAuth) {
    if (isAuthenticated && loggedInUserRole === 'admin') {
      authActionIcon = <UserCog className="h-5 w-5" />;
      authActionLink = "/admin/dashboard";
      authActionLabel = "Admin Panel";
    } else if (isAuthenticated && loggedInUserRole === 'user') {
      authActionIcon = <User className="h-5 w-5" />;
      authActionLink = "/dashboard/profile";
      authActionLabel = "My Account";
    } else { 
      authActionIcon = <LogIn className="h-5 w-5" />;
    }
  } else { 
    authActionIcon = <LogIn className="h-5 w-5 opacity-50" />;
  }

  const wishlistLink = isAuthenticated ? "/dashboard/wishlist" : "/login?redirect=/dashboard/wishlist";
  const cartLink = isAuthenticated ? "/cart" : "/login?redirect=/cart";

  return (
    <>
    <header className="sticky top-0 z-50">
      <div className="bg-card border-b border-border shadow-sm">
        <Container className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-headline font-bold text-primary hover:text-primary/80 transition-colors mr-6" aria-label="CAN Home">
              CAN
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group text-sm font-medium text-foreground transition-colors duration-300"
                >
                  {link.label}
                  <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-primary"></span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" asChild>
              <Link href={wishlistLink} aria-label="Wishlist">
                 <div className="relative">
                  <Heart className="h-5 w-5" />
                  {isAuthenticated && wishlistItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {wishlistItemCount}
                    </Badge>
                  )}
                </div>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" aria-label="Shopping Cart" asChild>
              <Link href={cartLink}>
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {isAuthenticated && cartItemCount > 0 && ( 
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
              </Link>
            </Button>

            {isLoadingAuth ? (
                <Button variant="ghost" size="icon" disabled>
                    <LogIn className="h-5 w-5 opacity-50" />
                </Button>
            ) : (
              <>
                <Link href={authActionLink} aria-label={authActionLabel}>
                  <Button variant="ghost" size="icon">
                    {authActionIcon}
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Section */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" asChild>
              <Link href={wishlistLink} aria-label="Wishlist">
                 <div className="relative">
                  <Heart className="h-5 w-5" />
                  {isAuthenticated && wishlistItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {wishlistItemCount}
                    </Badge>
                  )}
                </div>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" asChild>
              <Link href={cartLink}>
                 <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {isAuthenticated && cartItemCount > 0 && ( 
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
              </Link>
            </Button>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-card p-6">
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                  <Link href="/" onClick={() => setIsSheetOpen(false)} className="text-2xl font-headline font-bold text-primary mb-6 block">
                    CAN
                  </Link>
                </SheetHeader>
                <nav className="flex flex-col space-y-3 mt-4">
                  {navLinks.map(link => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsSheetOpen(false)}
                      className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base"
                    >
                      <link.icon size={20} className="mr-3" />
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-3"/>
                  {isLoadingAuth ? (
                     <div className="flex items-center py-2 px-3 rounded-md text-muted-foreground text-base opacity-50">
                        <LogIn size={20} className="mr-3" /> Loading...
                     </div>
                  ) : (
                    <>
                      {isAuthenticated && loggedInUserRole === 'admin' && (
                        <Link href="/admin/dashboard" onClick={() => setIsSheetOpen(false)} className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base">
                          <UserCog size={20} className="mr-3" /> Admin Panel
                        </Link>
                      )}
                      {isAuthenticated && loggedInUserRole === 'user' && (
                        <Link href="/dashboard/profile" onClick={() => setIsSheetOpen(false)} className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base">
                          <User size={20} className="mr-3" /> My Profile
                        </Link>
                      )}
                      {isAuthenticated ? (
                        <Button onClick={handleLogout} variant="ghost" className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base justify-start w-full">
                           <LogOut size={20} className="mr-3" /> Logout
                        </Button>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setIsSheetOpen(false)} className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base">
                            <LogIn size={20} className="mr-3" /> Login
                          </Link>
                          <Link href="/register" onClick={() => setIsSheetOpen(false)} className="flex items-center py-2 px-3 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors text-base">
                            <UserPlus size={20} className="mr-3" /> Register
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </Container>
      </div>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
    </>
  );
}
    
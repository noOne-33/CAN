
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayoutWrapper from '@/components/layout/MainLayoutWrapper'; // Import the wrapper
import Footer from '@/components/layout/Footer'; // Import Footer here in the Server Component

export const metadata: Metadata = {
  title: 'CAN - Fashion Forward',
  description: 'Discover the latest trends with CAN.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background text-foreground">
        <MainLayoutWrapper footer={<Footer />}> {/* Pass Footer as a prop */}
          <main className="flex-grow">
            {children}
          </main>
        </MainLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}

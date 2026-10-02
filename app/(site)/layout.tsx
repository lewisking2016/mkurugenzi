import type { Metadata } from 'next';
import { Bricolage_Grotesque, Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { PageLoader } from '@/components/PageLoader';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mkurugenzi ® — Premium Streetwear | Est. 2020',
  description:
    'Mkurugenzi ® is a luxury Kenyan streetwear house. Shop sweatsuits, quarter zips, hoodies, track jackets, tote bags and signature socks — modern collections defined by simplicity.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/images/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/assets/images/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/images/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#fcfcfc] text-[#0f0f11] antialiased selection:bg-[#0d0d0d] selection:text-white"
      >
        <CartProvider>
          {/* Framer Motion Handwritten Video Launch Intro Loader */}
          <PageLoader />

          {/* Navigation Bar */}
          <Navbar />

          {/* Cart Side Drawer */}
          <CartDrawer />

          {/* Page Content */}
          <main className="min-h-screen">{children}</main>

          {/* Footer */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

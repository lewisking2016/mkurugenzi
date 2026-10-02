import type { Metadata } from 'next';
import { Bricolage_Grotesque, Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mkurugenzi Admin',
  description: 'Store operations for Mkurugenzi — products, promotions, clients and deliveries.',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/images/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
  },
};

/**
 * The admin is a separate root layout so it never inherits the storefront
 * navbar, footer, cart drawer or intro loader.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body className="bg-[#fafafa] text-[#0d0d0d] antialiased selection:bg-[#0d0d0d] selection:text-white">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { SITE_CONFIG, BRAND } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageTracker } from '@/components/analytics/PageTracker';
import { CustomerActivityProvider } from '@/components/customer/CustomerActivityProvider';
import { WebsiteAccountProvider } from '@/lib/auth/useWebsiteAccount';
import { Suspense } from 'react';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${BRAND.name}`,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_CONFIG.url,
    siteName: BRAND.name,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: BRAND.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-surface-muted antialiased">
        {/* Skip Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-navy focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <PageTracker />
          </Suspense>
          <WebsiteAccountProvider>
            <CustomerActivityProvider>
              {/* <Header /> */}
              <main id="main-content" className="flex-1 pt-16 md:pt-18">
                {children}
              </main>
              {/* <Footer /> */}
            </CustomerActivityProvider>
          </WebsiteAccountProvider>
        </div>
      </body>
    </html>
  );
}

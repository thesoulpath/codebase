import type { Metadata } from 'next';
import { cormorantGaramond, lato } from './fonts';
import './globals.css';
import { createAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

// Fetch SEO data on the server
async function getSeoData() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('seo').select('*').single();
    return data;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData();

  return {
    title: seo?.title || 'Full-Page Scroll Website',
    description: seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
    keywords: seo?.keywords || ['astrology', 'counseling', 'spiritual guidance'],
    openGraph: {
      title: seo?.ogTitle || seo?.title || 'Full-Page Scroll Website',
      description: seo?.ogDescription || seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
      images: seo?.ogImage ? [seo.ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.ogTitle || seo?.title || 'Full-Page Scroll Website',
      description: seo?.ogDescription || seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
      images: seo?.ogImage ? [seo.ogImage] : [],
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${lato.variable}`}>
      <body className={cn(
        "antialiased",
        cormorantGaramond.variable,
        lato.variable
      )}>
        {children}
      </body>
    </html>
  );
}

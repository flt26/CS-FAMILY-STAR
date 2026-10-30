import type { Metadata, Viewport } from 'next';
import { Archivo, Handjet, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Footer } from '@/components/footer';
import { Masthead } from '@/components/masthead';
import { RateProvider } from '@/components/rate-context';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// Condensed display (Archivo's width axis), dot-matrix numerals and Arabic
// (Handjet), the receipt mono (Plex Mono) and Arabic body text.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });
const handjet = Handjet({ subsets: ['latin', 'arabic'], axes: ['ELGR', 'ELSH'], variable: '--font-handjet' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-arabic',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — where are we eating today?`, template: `%s · ${SITE_NAME}` },
  description:
    '100 food spots around Future University in Egypt, rated 1 to 5 by the students who eat there. Made by the CS Family.',
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_EG' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#161412',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${handjet.variable} ${plexMono.variable} ${plexArabic.variable}`}
    >
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <RateProvider>
          <Masthead />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </RateProvider>
      </body>
    </html>
  );
}

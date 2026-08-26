import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { ThemeProvider } from '@team-portal/hooks';
import { AppLayout } from '../../components/layout/AppLayout';
import { QueryProvider } from '../../components/providers/QueryProvider';
import { WebVitals } from '../../components/WebVitals';
import { locales } from '../../i18n';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  // Get the current pathname (without locale prefix) to build path-aware alternates
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  // pathname is like /zh/tickets or /en/dashboard; strip the locale segment
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';

  // In local/dev/CI, derive origin from the request host so that canonical and
  // hreflang URLs match the URL actually being audited (otherwise Lighthouse
  // flags the canonical as "points to another hreflang location").
  // In production NEXT_PUBLIC_SITE_URL takes precedence.
  const host = headersList.get('host') || 'localhost:3100';
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol =
    forwardedProto ?? (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const origin = configuredSiteUrl || `${protocol}://${host}`;

  const buildUrl = (l: string) =>
    `${origin}/${l}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

  return {
    metadataBase: new URL(origin),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: buildUrl(locale),
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, buildUrl(l)])),
        'x-default': `${origin}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body>
        <WebVitals />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <AppLayout>{children}</AppLayout>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

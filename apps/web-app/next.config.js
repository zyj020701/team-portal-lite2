/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@team-portal/ui',
    '@team-portal/icons',
    '@team-portal/hooks',
    '@team-portal/config-store',
    '@team-portal/ws-client',
    '@team-portal/utils',
    '@team-portal/types',
    '@team-portal/design-tokens',
  ],
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));

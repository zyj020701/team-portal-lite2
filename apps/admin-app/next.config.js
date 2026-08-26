/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@team-portal/ui',
    '@team-portal/icons',
    '@team-portal/hooks',
    '@team-portal/config-store',
  ],
};
module.exports = nextConfig;

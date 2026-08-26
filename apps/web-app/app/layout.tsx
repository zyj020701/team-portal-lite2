import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  // themeColor is a browser/OS UI hint (PWA status bar / tab bar), not
  // in-app styling, so it cannot reference a CSS variable. It mirrors
  // --color-primary-600 from the Design Tokens package.
  // eslint-disable-next-line no-restricted-syntax
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

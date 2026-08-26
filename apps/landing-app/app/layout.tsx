import type { ReactNode } from 'react';

export const metadata = {
  title: 'Team Portal Lite',
  description: 'B2B SaaS Ticket Management Platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

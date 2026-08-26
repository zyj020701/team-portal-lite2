import type { ReactNode } from 'react';

export const metadata = { title: 'Mobile', description: 'Team Portal Lite Mobile' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

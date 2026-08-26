'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { MobileNav, HamburgerButton } from './MobileNav';
import { LanguageSwitcher } from './LanguageSwitcher';

// The notification bell pulls in the WebSocket client (heartbeat / reconnect /
// message queue). It is non-critical chrome, not the LCP element, so we
// lazy-load it after hydration to keep first-screen JS/hydration work minimal.
const NotificationBell = dynamic(
  () => import('@/components/NotificationBell').then((mod) => ({ default: mod.NotificationBell })),
  {
    ssr: false,
    loading: () => <div className="h-10 w-10" aria-hidden="true" />,
  },
);

// TenantSwitcher hosts the tenant/theme dropdown; defer it off the critical path too.
const TenantSwitcher = dynamic(
  () => import('@/components/TenantSwitcher').then((mod) => ({ default: mod.TenantSwitcher })),
  {
    ssr: false,
    loading: () => <div className="h-9 w-28" aria-hidden="true" />,
  },
);

/**
 * Top application bar — shown on all breakpoints.
 * On mobile it includes the hamburger button; on desktop the sidebar
 * toggle lives inside the Sidebar itself.
 */
function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <HamburgerButton />
      <div className="flex-1" />
      <div className="hidden sm:block">
        <TenantSwitcher />
      </div>
      <Suspense fallback={<div className="h-9 w-10" />}>
        <LanguageSwitcher />
      </Suspense>
      <NotificationBell />
    </header>
  );
}

/**
 * Application shell layout.
 *
 * Structure (mobile first):
 *   ┌─────────────────────────┐
 *   │ TopBar (hamburger)      │  ← sticky
 *   ├─────────────────────────┤
 *   │                         │
 *   │       children          │  ← flex-1, scrollable
 *   │                         │
 *   ├─────────────────────────┤
 *   │ Bottom tab bar (mobile) │  ← fixed, h-16
 *   └─────────────────────────┘
 *
 * On ≥ md the bottom bar disappears and a left Sidebar appears.
 * The main content uses `pb-16 md:pb-0` so content isn't hidden
 * behind the mobile bottom bar.
 *
 * Height uses 100dvh (dynamic viewport height) to avoid the mobile
 * browser address-bar bug (see agents.md §7.4).
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white">
      <Sidebar />
      <MobileNav />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-16 md:pb-0"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav, HamburgerButton } from './MobileNav';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import { LanguageSwitcher } from './LanguageSwitcher';

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

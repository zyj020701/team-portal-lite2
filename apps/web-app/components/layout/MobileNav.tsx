'use client';

import { useTranslations } from 'next-intl';
import { useUiStore } from '@/stores/ui-store';
import { NAV_ITEMS, type NavItem } from './nav-config';
import { cn } from '@/lib/cn';

/**
 * Hamburger button — only visible on mobile (< md).
 * Toggles the mobile drawer via the UI store.
 */
export function HamburgerButton() {
  const t = useTranslations('common.actions');
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <button
      type="button"
      onClick={() => setMobileNavOpen(!mobileNavOpen)}
      aria-label={t('openMenu')}
      aria-expanded={mobileNavOpen}
      aria-controls="mobile-nav-drawer"
      className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent md:hidden"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {mobileNavOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}

function MobileNavItem({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const t = useTranslations('nav');
  const Icon = item.icon;
  const label = t(item.key);

  return (
    <a
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent min-h-[44px]"
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}

/**
 * Mobile slide-in drawer — only visible on mobile (< md).
 * Slides in from the left when mobileNavOpen is true.
 */
export function MobileNav() {
  const t = useTranslations('common.actions');
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <>
      {/* Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-nav-drawer"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface shadow-xl transition-transform duration-200 ease-in-out md:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('openMenu')}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-bold text-foreground">Team Portal</span>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <MobileNavItem key={item.key} item={item} onClick={() => setMobileNavOpen(false)} />
          ))}
        </nav>
      </div>
    </>
  );
}

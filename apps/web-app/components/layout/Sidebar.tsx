'use client';

import { memo } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useUiStore } from '@/stores/ui-store';
import { NAV_ITEMS, type NavItem } from './nav-config';
import { cn } from '@/lib/cn';

const TranslatedNavItem = memo(function TranslatedNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;
  const label = t(item.key);

  return (
    <a
      href={item.href}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'min-h-[44px]',
        collapsed ? 'justify-center' : 'gap-3',
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{label}</span>}
    </a>
  );
});

export function Sidebar() {
  const t = useTranslations('common.actions');
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'z-30 flex h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-in-out',
        'hidden md:flex',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-neutral-900">Team Portal</span>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('collapseSidebar')}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <svg
            className={cn(
              'h-5 w-5 transition-transform duration-200',
              sidebarCollapsed && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <TranslatedNavItem key={item.key} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>
    </aside>
  );
}

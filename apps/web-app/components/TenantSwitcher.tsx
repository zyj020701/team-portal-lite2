'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@team-portal/hooks';
import { Button } from '@team-portal/ui';

interface Tenant {
  id: string;
  name: string;
  /** CSS variable reference for the brand color dot */
  colorVar: string;
}

const TENANTS: readonly Tenant[] = [
  { id: 'company-a', name: 'Acme Corp', colorVar: 'var(--color-primary-500)' },
  { id: 'company-b', name: 'Globex Inc', colorVar: 'var(--color-secondary-500)' },
  { id: 'company-c', name: 'Initech', colorVar: 'var(--color-error-500)' },
  { id: 'company-d', name: 'Umbrella LLC', colorVar: 'var(--color-info-500)' },
  { id: 'company-e', name: 'Stark Industries', colorVar: 'var(--color-warning-500)' },
] as const;

export function TenantSwitcher() {
  const t = useTranslations('tenant');
  const [open, setOpen] = useState(false);
  const { tenantId, setTenant, availableTenants } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTenant = TENANTS.find((tenant) => tenant.id === tenantId) ?? TENANTS[0]!;

  const handleSelect = (tenant: Tenant) => {
    if (availableTenants.includes(tenant.id)) {
      setTenant(tenant.id);
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${currentTenant.name}, ${t('switchTenant')}`}
        className="flex items-center gap-2"
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: currentTenant.colorVar }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{currentTenant.name}</span>
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-surface p-1 shadow-lg"
          role="listbox"
          aria-label={t('selectTenant')}
        >
          {TENANTS.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              role="option"
              aria-selected={tenant.id === tenantId}
              onClick={() => handleSelect(tenant)}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent min-h-[44px]"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: tenant.colorVar }}
                aria-hidden="true"
              />
              {tenant.name}
              {tenant.id === tenantId && (
                <svg
                  className="ml-auto h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

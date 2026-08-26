'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, type Locale } from '@/i18n';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const LOCALE_LABELS: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  'zh-TW': '繁體中文',
};

const LOCALE_SHORT: Record<Locale, string> = {
  zh: '中',
  en: 'EN',
  ja: '日',
  ko: '한',
  'zh-TW': '繁',
};

export function LanguageSwitcher() {
  const t = useTranslations('common.language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function persistLocale(nextLocale: Locale) {
    // Persist to localStorage
    try {
      localStorage.setItem('locale', nextLocale);
    } catch {
      // localStorage may be unavailable (SSR/private mode)
    }
    // Persist to Cookie (1 year)
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
  }

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    persistLocale(nextLocale);
    startTransition(() => {
      // Preserve query parameters when switching language
      const queryString = searchParams.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(href, { locale: nextLocale });
      setOpen(false);
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        aria-label={t('switchLanguage')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-md border border-neutral-300 bg-white px-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
      >
        {LOCALE_SHORT[locale]}
        <svg
          className={`ml-1 h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('switchLanguage')}
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-md"
        >
          {locales.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              type="button"
              onClick={() => handleSelect(loc)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
                loc === locale ? 'bg-neutral-100 font-medium text-neutral-900' : 'text-neutral-700'
              }`}
            >
              {LOCALE_LABELS[loc]}
              {loc === locale && (
                <svg
                  className="ml-auto h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

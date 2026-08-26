import { defineRouting } from 'next-intl/routing';

export const locales = ['zh', 'en', 'ja', 'ko', 'zh-TW'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  'zh-TW': '繁體中文',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

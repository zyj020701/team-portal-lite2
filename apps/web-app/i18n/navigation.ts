import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { locales } from '../i18n';

const routing = defineRouting({
  locales,
  defaultLocale: 'zh',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

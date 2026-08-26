import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from '../i18n';

/**
 * Shape of a translation JSON module. Each supported locale exports its
 * messages as the default export.
 */
interface MessagesModule {
  default: AbstractIntlMessages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  // Dynamic JSON import is not statically analysable by TypeScript, so it
  // resolves to `any`. Narrow it explicitly to the MessagesModule shape to
  // satisfy @typescript-eslint/no-unsafe-* rules.
  const messagesModule = (await import(`../messages/${locale}.json`)) as unknown as MessagesModule;

  return {
    locale,
    messages: messagesModule.default,
  };
});

import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Expose the current pathname to server components via request header,
  // so generateMetadata can build path-aware canonical/hreflang URLs.
  const url = new URL(request.url);
  request.headers.set('x-pathname', url.pathname);
  const response = intlMiddleware(request);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

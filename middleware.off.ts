import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'tl', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'el', 'ru', 'pl', 'uk', 'cs', 'sk', 'hu', 'ro', 'bg', 'sr', 'sv', 'da', 'no', 'fi', 'is', 'ar', 'tr', 'fa', 'he', 'ku', 'ps', 'zh-CN', 'zh-HK', 'ja', 'ko', 'hi', 'bn', 'th', 'vi', 'ms', 'id', 'ur', 'ta', 'sw', 'ha', 'am', 'yo', 'zu', 'af'],
  defaultLocale: 'en'
});

// Run on all paths EXCEPT: /api, Next.js assets, and any files with dots
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'pl', 'es', 'ru', 'uk', 'cs', 'sk', 'no', 'sv', 'th', 'id', 'pt'];
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'never', // Używaj wyłącznie rewrite pod adresem / zamiast redirect
    localeDetection: true
});

export default function proxy(request: NextRequest) {
    const response = intlMiddleware(request);
    
    // Wyłączenie cache w przeglądarce klienta (WebView) dla zawsze świeżej wersji
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
}

export const config = {
    // Matcher ignoruje api, admin, tabs, static, pliki graficzne itd.
    matcher: ['/((?!api|admin|tabs|_next|.*\\..*).*)']
};

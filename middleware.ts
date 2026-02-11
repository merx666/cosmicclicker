import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'pl', 'es', 'ru', 'uk', 'cs', 'sk', 'no', 'sv', 'th', 'id', 'pt'];
const defaultLocale = 'en';

// Country to Language Map (Cloudflare CF-IPCountry)
const countryToLocale: Record<string, string> = {
    'PL': 'pl',
    'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
    'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',
    'UA': 'uk',
    'CZ': 'cs',
    'SK': 'sk',
    'NO': 'no',
    'SE': 'sv',
    'TH': 'th',
    'ID': 'id',
    'PT': 'pt', 'BR': 'pt',
    'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en'
};

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
    // Check if there is already a locale in the pathname
    const pathname = request.nextUrl.pathname;
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return intlMiddleware(request);
    }

    // If no locale in path, try to detect from check cookie first
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
    if (localeCookie && locales.includes(localeCookie)) {
        // intlMiddleware will handle the redirect based on cookie if configured, 
        // but we want to ensure it respects it or falls back to IP.
        // actually intlMiddleware handles cookie automatically.
        return intlMiddleware(request);
    }

    // If no cookie, check Cloudflare IP Country
    const country = request.headers.get('CF-IPCountry');
    if (country && countryToLocale[country]) {
        const targetLocale = countryToLocale[country];
        request.nextUrl.pathname = `/${targetLocale}${pathname}`;
        return NextResponse.redirect(request.nextUrl);
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

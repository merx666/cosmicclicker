import type { Metadata } from "next";
import "../globals.css";
import { MiniKitProvider } from "@/components/providers/MiniKitProvider";
import { Toaster } from "react-hot-toast";
import ApiTinyAd from '@/components/ApiTinyAd'
import AniAdsBanner from '@/components/AniAdsBanner'
import { Outfit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Void Collector - WorldApp Mini App",
  description: "Collect Void Particles, upgrade your system and earn WLD!",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  themeColor: '#0a0415',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!['en', 'pl', 'es', 'ru', 'uk', 'cs', 'sk', 'no', 'sv', 'th', 'id', 'pt'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true';

  return (
    <html lang={locale}>
      <head>
        {isTelegram && (
          <Script 
            src="https://telegram.org/js/telegram-web-app.js" 
            strategy="beforeInteractive"
          />
        )}
        {isTelegram && (
          <script
            id="tg-init-capturer"
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  let initData = '';
                  const hash = window.location.hash;
                  if (hash) {
                    const hashData = hash.substring(1);
                    if (hashData.includes('tgWebAppData=')) {
                      const params = new URLSearchParams(hashData);
                      initData = params.get('tgWebAppData') || '';
                    } else if (hashData.includes('hash=') && (hashData.includes('user=') || hashData.includes('query_id='))) {
                      initData = hashData;
                    }
                  }
                  if (!initData) {
                    const search = window.location.search;
                    if (search) {
                      const searchData = search.substring(1);
                      if (searchData.includes('tgWebAppData=')) {
                        const params = new URLSearchParams(searchData);
                        initData = params.get('tgWebAppData') || '';
                      } else if (searchData.includes('hash=') && (searchData.includes('user=') || searchData.includes('query_id='))) {
                        initData = searchData;
                      }
                    }
                  }
                  if (initData) {
                    sessionStorage.setItem('tg_init_data', initData);
                    sessionStorage.setItem('initParams', initData);
                    console.log('[TG Capturer] Saved initData to sessionStorage');
                  }
                } catch (e) {
                  console.error('[TG Capturer] Error:', e);
                }
              `
            }}
          />
        )}
        {isTelegram && (
          <Script 
            src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"
            strategy="beforeInteractive" 
          />
        )}
        {isTelegram && (
          <Script 
            src="//libtl.com/sdk.js"
            data-zone="11049498"
            data-sdk="show_11049498"
            strategy="beforeInteractive" 
          />
        )}

        <script
          id="error-logger"
          dangerouslySetInnerHTML={{
            __html: `
              const originalError = console.error;
              console.error = function(...args) {
                originalError.apply(console, args);
                try {
                  const errorContent = args.map(a => 
                    typeof a === 'object' ? (a instanceof Error ? a.stack || a.message : JSON.stringify(a)) : String(a)
                  ).join(' ');
                  
                  if (errorContent.includes('Warning:') || errorContent.includes('Download the React DevTools')) return;

                  fetch('/api/client-error', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: 'CONSOLE.ERROR CAPTURED',
                      error: errorContent,
                      type: 'console_error'
                    })
                  }).catch(() => {});
                } catch(e) {}
              };
              
              window.addEventListener('error', function(e) {
                fetch('/api/client-error', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: e.message,
                    source: e.filename,
                    error: e.error ? e.error.stack : null,
                    type: 'error_event'
                  })
                }).catch(() => {});
              });

              // Debug Logger for Telegram Client State
              function sendDebugReport(label) {
                try {
                  const report = {
                    message: 'CLIENT-SIDE DEBUG REPORT (' + label + ')',
                    href: window.location.href,
                    hash: window.location.hash,
                    hasTelegram: typeof window.Telegram !== 'undefined',
                    hasWebApp: typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined',
                    initData: (typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined') ? window.Telegram.WebApp.initData || '' : '',
                    sessionStorageInitData: sessionStorage.getItem('tg_init_data') || '',
                    sessionStorageInitParams: sessionStorage.getItem('initParams') || '',
                  };
                  fetch('/api/client-error', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                  }).catch(() => {});
                } catch (e) {}
              }

              // Send reports at different intervals to capture fast reloads
              setTimeout(function() { sendDebugReport('100ms'); }, 100);
              setTimeout(function() { sendDebugReport('500ms'); }, 500);
              setTimeout(function() { sendDebugReport('1500ms'); }, 1500);
            `
          }}
        />

        {/* Monetag Vignette Ad Script - Only for WorldApp */}
        {!isTelegram && (
          <script
            id="monetag-vignette"
            dangerouslySetInnerHTML={{
              __html: `(function(s){s.dataset.zone='11060294',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
            }}
          />
        )}
      </head>
      <body className={`${outfit.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <MiniKitProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1a0b2e',
                  color: '#f0f0f0',
                  border: '1px solid #6b2fb5',
                },
              }}
            />
          </MiniKitProvider>
        </NextIntlClientProvider>

        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-WNQ3YFGEF5"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            let clientId = null;
            try {
              clientId = localStorage.getItem('ga_client_id');
              if (!clientId) {
                clientId = 'ga4.' + Math.random().toString(36).substring(2, 15) + '.' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('ga_client_id', clientId);
              }
            } catch (e) {
              clientId = 'temp.' + Math.random().toString(36).substring(2, 15);
            }

            gtag('config', 'G-WNQ3YFGEF5', {
              'client_id': clientId,
              'cookie_flags': 'SameSite=None;Secure'
            });
          `}
        </Script>
      </body>
    </html>
  );
}

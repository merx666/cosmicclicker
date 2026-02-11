import type { Metadata } from "next";
import "../globals.css";
import { MiniKitProvider } from "@/components/providers/MiniKitProvider";
import { Toaster } from "react-hot-toast";
import ApiTinyAd from '@/components/ApiTinyAd'
import { Outfit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

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

  return (
    <html lang={locale}>
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
            <ApiTinyAd />
          </MiniKitProvider>
        </NextIntlClientProvider>

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-WNQ3YFGEF5"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WNQ3YFGEF5');
          `
        }} />
      </body>
    </html>
  );
}

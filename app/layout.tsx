import type { Metadata } from "next";
import "./globals.css";
import { MiniKitProvider } from "@/components/providers/MiniKitProvider";
import { Toaster } from "react-hot-toast";
import ApiTinyAd from '@/components/ApiTinyAd'
import { Outfit } from 'next/font/google'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
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

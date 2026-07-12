import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "E-Cədvəl — Ağıllı Dərs Cədvəli İdarəetməsi",
  description:
    "Multi-tenant cədvəl sistemi ilə universitetin bütün fakültə, qrup və müəllim cədvəlini rahatlıqla yaradın, paylaşın və konflikt olmadan idarə edin.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fcfaee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fcfaee" />
        <meta name="apple-mobile-web-app-title" content="E-Cədvəl" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/ec-icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('it24_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
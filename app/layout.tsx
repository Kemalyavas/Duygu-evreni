import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { HomePageJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.duyguevreni.com";

export const metadata: Metadata = {
  title: {
    default: "Duygu Evreni - Duygularını Yıldızlara Dönüştür",
    template: "%s | Duygu Evreni",
  },
  description:
    "Duygularını yıldızlara dönüştür ve evrende paylaş. 3D interaktif bir evren deneyimi ile duygularını keşfet, yeni yıldızlar oluştur ve başkalarının duygularını oku.",
  keywords: [
    "duygu",
    "evren",
    "yıldız",
    "duygular",
    "3D",
    "interaktif",
    "paylaşım",
    "gezegen",
    "umut",
    "sevgi",
    "mutluluk",
  ],
  authors: [{ name: "Duygu Evreni" }],
  creator: "Duygu Evreni",
  publisher: "Duygu Evreni",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Duygu Evreni",
    title: "Duygu Evreni - Duygularını Yıldızlara Dönüştür",
    description:
      "Duygularını yıldızlara dönüştür ve evrende paylaş. 3D interaktif bir evren deneyimi.",
    // OG görseli app/opengraph-image.tsx tarafından otomatik üretilir
  },
  twitter: {
    card: "summary_large_image",
    title: "Duygu Evreni - Duygularını Yıldızlara Dönüştür",
    description:
      "Duygularını yıldızlara dönüştür ve evrende paylaş. 3D interaktif bir evren deneyimi.",
    // Twitter görseli app/twitter-image.tsx tarafından otomatik üretilir
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0E27" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0E27" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <HomePageJsonLd />
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

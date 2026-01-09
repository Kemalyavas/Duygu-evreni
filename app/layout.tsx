import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { HomePageJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://duygu-evreni.vercel.app";

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Duygu Evreni - 3D interaktif duygu evreni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duygu Evreni - Duygularını Yıldızlara Dönüştür",
    description:
      "Duygularını yıldızlara dönüştür ve evrende paylaş. 3D interaktif bir evren deneyimi.",
    images: ["/og-image.png"],
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
  maximumScale: 1,
  userScalable: false,
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
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AnalyticsProvider } from "@/components/analytics-provider";
import { product } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(product.siteUrl),
  title: {
    default: product.name,
    template: `%s | ${product.shortName}`,
  },
  description: product.description,
  applicationName: product.name,
  authors: [{ name: "Matheus Siqueira", url: "https://www.matheussiqueira.dev" }],
  creator: "Matheus Siqueira",
  publisher: "Matheus Siqueira",
  category: "portfolio",
  keywords: [
    "Flappy Bird",
    "controle por gestos",
    "visão computacional",
    "Next.js",
    "Vercel",
    "React",
    "TypeScript",
    "PWA",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111417",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}

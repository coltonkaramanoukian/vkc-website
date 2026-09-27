import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { archivo, plexMono } from "@/app/fonts";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/content";
import { isLocale, locales } from "@/i18n/pathnames";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  metadataBase: new URL(site.baseUrl),
  title: { template: `%s | ${site.brandName}`, default: site.brandName },
  applicationName: site.brandName,
  formatDetection: { telephone: false, email: false, address: false },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d22" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale === "fr" ? "fr-CA" : "en-CA"}
      className={`${archivo.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
        <JsonLd />
        <Analytics />
      </body>
    </html>
  );
}

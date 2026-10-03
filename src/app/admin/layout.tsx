import type { Metadata } from "next";
import type { ReactNode } from "react";
import { archivo, plexMono } from "@/app/fonts";
import "../globals.css";

// The content editor sits outside the bilingual site (its own <html>, no
// next-intl), so it needs its own root layout — app/layout.tsx is a pass-through
// and the real <html>/<body> normally lives in app/[locale]/layout.tsx.
export const metadata: Metadata = {
  title: "Content editor — VKC Packaging",
  // The one surface that must never be indexed: owner-only, behind auth.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LongformPage } from "@/components/longform";
import { PrivacyContact } from "@/components/privacy-contact";
import { pageMetadata } from "@/lib/seo";
import { isLocale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/privacy", "privacy");
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <LongformPage
      locale={locale}
      route="/privacy"
      pageKey="privacy"
      slots={{ privacyContact: <PrivacyContact locale={locale} /> }}
    />
  );
}

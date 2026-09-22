import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/page-shell";
import { QuoteFormSection } from "@/components/quote-form-section";
import { contact, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/quote", "quote");
}

export default async function QuotePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const helps = raw<string[]>("quote.helps");
  const phoneHref = telHref(contact.phone);

  return (
    <PageShell locale={locale} route="/quote">
      <div className="wrap grid gap-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="quote-heading">
          <h1 id="quote-heading">{t("quote.heading")}</h1>
          <p className="mt-4 max-w-[56ch] text-[1.125rem]">{t("quote.lead")}</p>
          {contact.phone && phoneHref && (
            <p className="mt-4">
              <a href={phoneHref} className="btn btn-secondary">
                {t("common.cta.call", { phone: contact.phone })}
              </a>
            </p>
          )}
          <div className="mt-8">
            <QuoteFormSection locale={locale} mode="full" />
          </div>
        </section>

        <aside className="space-y-8 lg:pt-2">
          <div>
            <h2 className="text-[1.375rem]">{t("quote.nextHeading")}</h2>
            <p className="mt-2">{t("quote.next")}</p>
          </div>
          <div>
            <h2 className="text-[1.375rem]">{t("quote.helpsHeading")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {helps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[1.375rem]">{t("quote.dataHeading")}</h2>
            <p className="mt-2">
              {t("quote.data")}{" "}
              <Link href={localizedPath(locale, "/privacy")}>{t("common.nav.privacy")}</Link>
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLdScript } from "@/components/json-ld";
import { Inline } from "@/components/longform";
import { PageShell } from "@/components/page-shell";
import { Pictogram } from "@/components/pictograms";
import { Placard, type PlacardField } from "@/components/placard";
import { QuoteFormSection } from "@/components/quote-form-section";
import { RelatedPages } from "@/components/related-pages";
import { absoluteUrl, addressLine, contact, site, telHref } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { buildContactPageJsonLd } from "@/lib/structured-data";
import { isLocale, localizedPath, type Locale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/contact", "contact");
}

/** The rows contact.json can fill; each renders only once it has a value (§1). */
async function contactRows(locale: Locale): Promise<PlacardField[]> {
  const { t } = await getCopy(locale, "common.contact");
  const phoneHref = telHref(contact.phone);
  const address = addressLine();
  const hours = contact.hours[locale];
  const rows: (PlacardField | null)[] = [
    contact.phone && phoneHref ? { name: t("phone"), value: <a href={phoneHref}>{contact.phone}</a> } : null,
    contact.email ? { name: t("email"), value: <a href={`mailto:${contact.email}`}>{contact.email}</a> } : null,
    address ? { name: t("address"), value: address } : null,
    hours ? { name: t("hours"), value: hours } : null,
  ];
  return rows.filter((row): row is PlacardField => row !== null);
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const rows = await contactRows(locale);
  const after = raw<string[]>("pages.contact.after");
  const phoneHref = telHref(contact.phone);

  return (
    <PageShell locale={locale} route="/contact">
      <section className="wrap pb-8 pt-6 sm:pt-8">
        <Breadcrumbs locale={locale} route="/contact" />
        <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">{t("pages.contact.eyebrow")}</p>
            <h1 className="mt-4 max-w-[20ch]">{t("pages.contact.h1")}</h1>
            <p className="lead mt-5">{rows.length > 0 ? t("pages.contact.leadDetails") : t("pages.contact.leadFormOnly")}</p>
            {contact.phone && phoneHref && (
              <p className="mt-6">
                <a href={phoneHref} className="btn btn-primary">
                  {t("common.cta.call", { phone: contact.phone })}
                </a>
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <Pictogram name="phone" className="page-picto" />
          </div>
        </div>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      <div className="wrap grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <section aria-labelledby="contact-form-heading" className="placard p-5 sm:p-8 lg:p-10">
          <p className="eyebrow">{t("pages.contact.formEyebrow")}</p>
          <h2 id="contact-form-heading" className="mt-3">
            {t("pages.contact.formHeading")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-graphite">{t("pages.contact.formIntro")}</p>
          {/* Shared furniture: the form's strings belong to the quote page, not this one. */}
          <div className="mt-8" data-shared="form">
            <QuoteFormSection locale={locale} mode="short" source="contact" />
          </div>
        </section>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {rows.length > 0 && <Placard title={t("pages.contact.detailsHeading")} headingLevel="h2" fields={rows} />}
          <div>
            <p className="eyebrow">{t("pages.contact.afterHeading")}</p>
            <ol className="mt-3 space-y-3">
              {after.map((step) => (
                <li key={step} className="border-l-[3px] border-ink pl-4">
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <p className="text-graphite">
            <Inline text={t("pages.contact.quoteNote")} locale={locale} />
          </p>
        </aside>
      </div>

      <div className="mt-14">
        <RelatedPages locale={locale} route="/contact" />
      </div>
      <p className="wrap mt-4">
        <Link href={localizedPath(locale, "/quote")} className="btn btn-secondary">
          {t("common.cta.quote")}
        </Link>
      </p>
      <JsonLdScript
        data={buildContactPageJsonLd({
          name: t("meta.contact.title"),
          url: absoluteUrl(localizedPath(locale, "/contact")),
          organizationId: `${site.baseUrl}/#organization`,
        })}
      />
    </PageShell>
  );
}

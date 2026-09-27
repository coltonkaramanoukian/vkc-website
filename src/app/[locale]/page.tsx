import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClientList } from "@/components/client-list";
import { ClientStories } from "@/components/client-stories";
import { ContainerLabel } from "@/components/container-label";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { DemoVideo } from "@/components/demo-video";
import { Faq } from "@/components/faq";
import { HeroGauge } from "@/components/hero-gauge";
import { Manifest, type ManifestItem } from "@/components/manifest";
import { PageShell } from "@/components/page-shell";
import { PhotoRow } from "@/components/photo";
import { RelatedPages } from "@/components/related-pages";
import { SceneCover, SceneGalleries } from "@/components/scene";
import type { PictogramName } from "@/components/pictograms";
import { ServiceChooserSection } from "@/components/service-chooser-section";
import { ServicePlacards } from "@/components/service-placards";
import { site, tagline } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import type { FaqItem } from "@/lib/structured-data";
import { isLocale, localizedPath, type AppPathname } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/", "home", { absoluteTitle: true });
}

const INDUSTRIES: { route: AppPathname; label: string; key: string; picto: PictogramName }[] = [
  { route: "/industries/cleaners", label: "cleaners", key: "cleaners", picto: "spray" },
  { route: "/industries/lubricants", label: "lubricants", key: "lubricants", picto: "oilcan" },
  { route: "/industries/sealers-and-coatings", label: "sealersCoatings", key: "sealersCoatings", picto: "roller" },
];

/**
 * The home page reads as one pallet label after another, on the floor, in
 * the site's order (lib/nav.ts): the two services, the chooser, the
 * industries, the containers, how a job starts, straight talk, the FAQ,
 * then who VKC works for and the three pages that close the site (where it
 * works, who it is, how to reach it). Layout families, each used once: the
 * hero (tagline beside the gauge), two service placards, the chooser,
 * manifest rows (industries), one label with three fields (containers),
 * ticked steps, a ruled statement, the FAQ, ruled cells, and the negative
 * band. Two eyebrows on the page: the hero's and "straight talk".
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const steps = raw<{ title: string; body: string }[]>("home.steps");
  const faq = raw<FaqItem[]>("home.faq.items");
  const industries: ManifestItem[] = INDUSTRIES.map(({ route, label, key, picto }) => ({
    href: localizedPath(locale, route),
    title: t(`common.nav.${label}`),
    body: t(`home.industries.${key}`),
    picto,
  }));

  return (
    <PageShell locale={locale} route="/">
      {/* Hero: the tagline, and the tagline drawn. */}
      <section className="wrap pb-12 pt-10 sm:pt-14 lg:pb-16 xl:pt-16">
        <div className="grid items-end gap-12 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-16">
          <div>
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1 className="hero-title mt-5 max-w-[18ch]">{tagline(locale)}</h1>
            <p className="lead mt-6">{t("home.sub")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaActions locale={locale} />
              <Link href={localizedPath(locale, "/services")} className="btn btn-secondary">
                {t("home.heroSecondary")}
              </Link>
            </div>
          </div>
          <div className="max-w-[36rem] xl:max-w-none xl:justify-self-end">
            <HeroGauge locale={locale} label={t("home.gaugeAlt")} />
          </div>
        </div>
      </section>

      {/* The cover strip (content/scenes.json, slot home-cover) and the demo video (content/media.json). */}
      <SceneCover route="/" locale={locale} preload className="wrap mb-10" />
      <div className="wrap">
        <DemoVideo locale={locale} label={site.brandName} />
      </div>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* Services: the two labels. */}
      <section id="services" className="wrap section scroll-mt-4" aria-labelledby="services-heading">
        <div className="section-head">
          <h2 id="services-heading">{t("home.servicesHeading")}</h2>
          <p className="text-graphite">{t("home.servicesIntro")}</p>
        </div>
        <div className="mt-8">
          <ServicePlacards locale={locale} showNameNote />
        </div>
        <PhotoRow ids={["home-second-shift", "home-bottleneck"]} locale={locale} className="mt-5" />
      </section>

      {/* The floor gallery (content/scenes.json, gallery home-floor). */}
      <SceneGalleries route="/" locale={locale} className="!mt-0" />

      <ServiceChooserSection locale={locale} />

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* Industries: a manifest, not more boxes. */}
      <section className="wrap section" aria-labelledby="industries-heading">
        <div className="section-head">
          <h2 id="industries-heading">{t("home.industriesHeading")}</h2>
          <p>{t("home.industriesIntro")}</p>
        </div>
        <div className="mt-8">
          <Manifest items={industries} />
        </div>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* Containers: one label, three fields. */}
      <section className="wrap section" aria-labelledby="containers-heading">
        <div className="section-head">
          <h2 id="containers-heading">{t("home.containersHeading")}</h2>
          <p>{t("home.containersIntro")}</p>
        </div>
        <div className="mt-8">
          <ContainerLabel locale={locale} />
        </div>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* How a first job starts: three ticked steps. */}
      <section className="wrap section" aria-labelledby="steps-heading">
        <div className="section-head">
          <h2 id="steps-heading">{t("home.stepsHeading")}</h2>
        </div>
        <ol className="steps mt-8" style={{ "--steps": 3 } as React.CSSProperties}>
          {steps.map((step) => (
            <li key={step.title} className="step">
              <h3>{step.title}</h3>
              <p className="mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Straight talk: the one ruled statement on the page. */}
      <section className="wrap section-tight" aria-labelledby="plain-heading">
        <div className="grid gap-6 border-y border-hairline py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div className="section-head">
            <p className="eyebrow">{t("home.plain.eyebrow")}</p>
            <h2 id="plain-heading">{t("home.plain.heading")}</h2>
          </div>
          <p className="lead self-center">{t("home.plain.body")}</p>
        </div>
      </section>

      <Faq locale={locale} heading={t("home.faq.heading")} items={faq} />

      <ClientStories locale={locale} heading={t("common.storiesHeading")} />
      <ClientList heading={t("common.clientsHeading")} />

      {/* Where this leads next: Montreal, About, Contact, the end of the site's order. */}
      <div className="mt-14">
        <RelatedPages locale={locale} route="/" />
      </div>
      <CtaBand locale={locale} />
    </PageShell>
  );
}

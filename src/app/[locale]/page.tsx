import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClientList } from "@/components/client-list";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { DemoVideo } from "@/components/demo-video";
import { Faq } from "@/components/faq";
import { HeroGauge } from "@/components/hero-gauge";
import { PageShell } from "@/components/page-shell";
import { PhotoRow } from "@/components/photo";
import { Pictogram, type PictogramName } from "@/components/pictograms";
import { ServiceChooserSection } from "@/components/service-chooser-section";
import { ServicePlacards } from "@/components/service-placards";
import { containersIn, fillMethods, site, tagline, type ContainerGroup } from "@/lib/content";
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

const CONTAINER_GROUPS: { group: ContainerGroup; route: AppPathname; label: string; picto: PictogramName }[] = [
  { group: "bottles-and-jugs", route: "/containers/bottles-and-jugs", label: "bottlesAndJugs", picto: "jug" },
  { group: "pails", route: "/containers/pails", label: "pails", picto: "pail" },
  { group: "kits", route: "/containers/kits", label: "kits", picto: "kit" },
];

const INDUSTRIES: { route: AppPathname; label: string; key: string; picto: PictogramName }[] = [
  { route: "/industries/cleaners", label: "cleaners", key: "cleaners", picto: "spray" },
  { route: "/industries/lubricants", label: "lubricants", key: "lubricants", picto: "oilcan" },
  { route: "/industries/sealers-and-coatings", label: "sealersCoatings", key: "sealersCoatings", picto: "roller" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const steps = raw<{ title: string; body: string }[]>("home.steps");
  const faq = raw<FaqItem[]>("home.faq.items");

  return (
    <PageShell locale={locale} route="/">
      {/* Hero: the tagline, and the tagline drawn. */}
      <section className="wrap pb-14 pt-10 sm:pt-16 lg:pb-20 lg:pt-20">
        <div className="grid items-end gap-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-14">
          <div>
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1 className="hero-title mt-4 max-w-[20ch]">{tagline(locale)}</h1>
            <p className="lead mt-6">{t("home.sub")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaActions locale={locale} />
              <a href="#services" className="btn btn-secondary">
                {t("home.heroSecondary")}
              </a>
            </div>
          </div>
          <div className="xl:justify-self-end">
            <HeroGauge locale={locale} label={t("home.gaugeAlt")} />
          </div>
        </div>
      </section>

      <div className="wrap">
        <DemoVideo locale={locale} label={site.brandName} />
      </div>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* The two services. */}
      <section id="services" className="wrap section scroll-mt-4" aria-labelledby="services-heading">
        <div className="section-head">
          <p className="eyebrow">{t("home.servicesEyebrow")}</p>
          <h2 id="services-heading">{t("home.servicesHeading")}</h2>
          <p className="text-graphite">{t("home.servicesIntro")}</p>
        </div>
        <div className="mt-8">
          <ServicePlacards locale={locale} showNameNote />
        </div>
        <PhotoRow ids={["home-second-shift", "home-bottleneck"]} locale={locale} className="mt-5" />
      </section>

      <ServiceChooserSection locale={locale} />

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* Containers: the families that have run, one label per group. */}
      <section className="wrap section" aria-labelledby="containers-heading">
        <div className="section-head">
          <p className="eyebrow">{t("home.containersEyebrow")}</p>
          <h2 id="containers-heading">{t("home.containersHeading")}</h2>
          <p>{t("home.containersIntro")}</p>
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {CONTAINER_GROUPS.map(({ group, route, label, picto }) => (
            <li key={group}>
              <Link href={localizedPath(locale, route)} className="placard placard-link h-full">
                <div className="flex items-start justify-between gap-4 border-b-[1.5px] border-ink px-5 py-4">
                  <h3 className="placard-title text-[1.375rem]">{t(`common.nav.${label}`)}</h3>
                  <Pictogram name={picto} />
                </div>
                <ul className="px-5 py-4 font-mono text-[0.9375rem] leading-relaxed">
                  {containersIn(group).map((family) => (
                    <li key={family.id}>{family.name[locale]}</li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-5">
          <span className="field-name mr-3">{t("common.fields.fillMethods")}</span>
          {fillMethods.map((m) => m.name[locale]).join(", ")}
        </p>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* Industries. */}
      <section className="wrap section" aria-labelledby="industries-heading">
        <div className="section-head">
          <p className="eyebrow">{t("home.industriesEyebrow")}</p>
          <h2 id="industries-heading">{t("home.industriesHeading")}</h2>
          <p>{t("home.industriesIntro")}</p>
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {INDUSTRIES.map(({ route, label, key, picto }) => (
            <li key={route}>
              <Link href={localizedPath(locale, route)} className="placard placard-link flex h-full flex-col p-5">
                <Pictogram name={picto} />
                <h3 className="placard-title mt-5 text-[1.375rem]">{t(`common.nav.${label}`)}</h3>
                <p className="mt-2 text-graphite">{t(`home.industries.${key}`)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      {/* How a first job starts. */}
      <section className="wrap section" aria-labelledby="steps-heading">
        <div className="section-head">
          <p className="eyebrow">{t("home.stepsEyebrow")}</p>
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

      {/* Straight talk. */}
      <section className="wrap section-tight" aria-labelledby="plain-heading">
        <div className="grid gap-6 border-y border-hairline py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div className="section-head">
            <p className="eyebrow">{t("home.plain.eyebrow")}</p>
            <h2 id="plain-heading">{t("home.plain.heading")}</h2>
          </div>
          <p className="lead self-center">{t("home.plain.body")}</p>
        </div>
      </section>

      <Faq locale={locale} eyebrow={t("home.faq.eyebrow")} heading={t("home.faq.heading")} items={faq} />

      <ClientList heading={t("common.clientsHeading")} />
      <CtaBand locale={locale} />
    </PageShell>
  );
}

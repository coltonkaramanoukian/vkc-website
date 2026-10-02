import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClientList } from "@/components/client-list";
import { ClientStories } from "@/components/client-stories";
import { ContainerLabel } from "@/components/container-label";
import { CtaActions } from "@/components/cta-band";
import { DemoVideo } from "@/components/demo-video";
import { Faq } from "@/components/faq";
import { HomeMotion } from "@/components/home-motion";
import { PageShell } from "@/components/page-shell";
import { PhotoRow } from "@/components/photo";
import { RelatedPages } from "@/components/related-pages";
import { Scene, SceneGalleries } from "@/components/scene";
import { ServiceChooserSection } from "@/components/service-chooser-section";
import { Testimonials } from "@/components/testimonials";
import { containerFamilies, serviceNames, services, site, tagline, taglineOption } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { sceneForRoute, sceneVisible, type SceneItem } from "@/lib/scenes";
import { pageMetadata } from "@/lib/seo";
import type { FaqItem } from "@/lib/structured-data";
import { isLocale, localizedPath, type AppPathname, type Locale } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/", "home", { absoluteTitle: true });
}

/** What we fill: five pages, each shown by its own cover (content/scenes.json). */
const REEL: { route: AppPathname; title: string; body: string; field: string | null }[] = [
  { route: "/industries/cleaners", title: "common.nav.cleaners", body: "home.industries.cleaners", field: "form.viscosityWater" },
  { route: "/industries/lubricants", title: "common.nav.lubricants", body: "home.industries.lubricants", field: "form.viscosityPourable" },
  { route: "/industries/sealers-and-coatings", title: "common.nav.sealersCoatings", body: "home.industries.sealersCoatings", field: "form.viscosityThick" },
  { route: "/services/toll-blending", title: "common.nav.tollBlending", body: "home.reel.tollBlending", field: null },
  { route: "/containers/kits", title: "common.nav.kits", body: "home.reel.kits", field: null },
];

/** The picture beside each "why" point. */
const WHY_SCENES: AppPathname[] = ["/services/contract-packaging", "/about", "/services/toll-blending", "/visit"];

/** Split a sentence into words so the statement can fill word by word (the text is whole without JS). */
function Words({ text }: { text: string }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="w">
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

/** Split the tagline into one row per sentence, so each can rise on its own. */
function titleRows(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g)?.map((row) => row.trim()) ?? [text];
}

/**
 * The still of a scene: the image itself, or a video's poster. For the places
 * a loop cannot carry its Play / Pause control: inside a link (a button in an
 * anchor is not valid HTML, and the click would navigate) or beside the
 * points, where the picture is decoration.
 */
function stillOf(item: SceneItem): SceneItem {
  return item.kind === "video" ? { ...item, kind: "image", src: item.poster, poster: null } : item;
}

async function Cover({
  route,
  locale,
  preload = false,
  still = false,
  sizes = "100vw",
}: {
  route: AppPathname;
  locale: Locale;
  preload?: boolean;
  still?: boolean;
  sizes?: string;
}) {
  const item = sceneForRoute(route);
  if (!sceneVisible(item)) return null;
  return <Scene item={still ? stillOf(item) : item} locale={locale} preload={preload} sizes={sizes} />;
}

/**
 * The home page, run 5: a film more than a label, in the site's order
 * (lib/nav.ts). A video hero under the tagline, the container names running
 * past, one statement that fills as it is read, the two services as
 * full-bleed films, what we fill as a reel (the industries first), the
 * container label, the chooser, why plants hand us the work beside a picture
 * that follows, the steps on a rail that fills, straight talk, the floor,
 * the FAQ, the three pages that close the site (where it works, who it is,
 * how to reach it), and a closing frame.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const names = serviceNames(locale);
  const steps = raw<{ title: string; body: string }[]>("home.steps");
  const faq = raw<FaqItem[]>("home.faq.items");
  const why = raw<{ title: string; body: string }[]>("home.why");
  const shiftEnds = taglineOption("shiftEnds", locale);
  const marquee = containerFamilies.map((family) => family.name[locale]);

  return (
    <PageShell locale={locale} route="/">
      <HomeMotion />

      {/* Hero: the tagline over the fill, filmed. */}
      <section className="cine-hero" aria-labelledby="hero-heading">
        <div className="cine-hero-media">
          <Cover route="/" locale={locale} preload />
        </div>
        <div className="wrap cine-hero-inner">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 id="hero-heading" className="cine-title mt-5">
            {titleRows(tagline(locale)).map((row) => (
              <span key={row} className="row">
                <span>{row}</span>
              </span>
            ))}
          </h1>
          <div className="cine-hero-foot">
            <p className="lead">{t("home.sub")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <CtaActions locale={locale} />
              <a href="#fit" className="btn btn-secondary">
                {t("home.chooser.heading")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...marquee, ...marquee].map((name, i) => (
            <span key={i} className="marquee-item">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <DemoVideo locale={locale} label={site.brandName} />
      </div>

      {/* One statement, read word by word. */}
      <section className="wrap section" aria-label={site.brandName}>
        <p className="statement">
          <Words text={t("home.statement")} />
        </p>
      </section>

      {/* The two services, as films. */}
      <section id="services" className="wrap scroll-mt-4" aria-labelledby="services-heading">
        <div className="section-head mb-10" data-rise>
          <h2 id="services-heading">{t("home.servicesHeading")}</h2>
          <p className="text-graphite">{t("home.servicesIntro")}</p>
        </div>

        <article className="film" aria-labelledby="film-ss" data-guard="second-shift">
          <div className="film-media">
            <Cover route="/services/second-shift" locale={locale} />
          </div>
          <div className="film-inner">
            <span className="pill field-name">{services.secondShift.where[locale]}</span>
            <h3 id="film-ss" className="film-title">
              {names.ss}
            </h3>
            <p className="lead">{services.secondShift.summary[locale]}</p>
            <div>
              <Link href={localizedPath(locale, "/services/second-shift")} className="btn btn-primary">
                {t("home.chooser.results.secondShift.link", names)}
              </Link>
            </div>
          </div>
        </article>

        <article className="film" aria-labelledby="film-bn">
          <div className="film-media">
            <Cover route="/services/contract-packaging" locale={locale} />
          </div>
          <div className="film-inner">
            <span className="pill field-name">{services.bottleneck.where[locale]}</span>
            <h3 id="film-bn" className="film-title">
              {names.bn}
            </h3>
            <p className="lead">{services.bottleneck.summary[locale]}</p>
            <p className="text-graphite">{services.bottleneck.nameNote?.[locale]}</p>
            <div>
              <Link href={localizedPath(locale, "/services/contract-packaging")} className="btn btn-primary">
                {t("home.chooser.results.bottleneck.link", names)}
              </Link>
            </div>
          </div>
        </article>

        <PhotoRow ids={["home-second-shift", "home-bottleneck"]} locale={locale} className="mt-5" />
      </section>

      {/* What we fill: a reel of five pages. */}
      <section id="fill" className="overflow-hidden" aria-labelledby="fill-heading">
        <div className="wrap section-tight">
          <div className="section-head" data-rise>
            <h2 id="fill-heading">{t("home.fillHeading")}</h2>
            <p className="text-graphite">{t("home.fillIntro")}</p>
          </div>
        </div>
        <ul className="reel pb-16">
          {REEL.map((item) => (
            <li key={item.route}>
              <Link href={localizedPath(locale, item.route)} className="reel-card">
                <Cover route={item.route} locale={locale} still sizes="(min-width: 900px) 34rem, 82vw" />
                <div className="flex items-baseline justify-between gap-4">
                  <h3>{t(item.title, names)}</h3>
                  {item.field && <span className="field-name">{t(item.field, names)}</span>}
                </div>
                <p className="text-graphite">{t(item.body, names)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Containers: one label, three fields. */}
      <section className="wrap section-tight" aria-labelledby="containers-heading">
        <div className="section-head" data-rise>
          <h2 id="containers-heading">{t("home.containersHeading")}</h2>
          <p className="text-graphite">{t("home.containersIntro")}</p>
        </div>
        <div className="mt-8">
          <ContainerLabel locale={locale} />
        </div>
      </section>

      <div id="fit" className="scroll-mt-4">
        <ServiceChooserSection locale={locale} />
      </div>

      {/* Why plants hand us the work. */}
      <section className="wrap section" aria-labelledby="why-heading">
        <div className="section-head mb-6" data-rise>
          <h2 id="why-heading">{t("home.whyHeading")}</h2>
        </div>
        <div className="why">
          <div className="why-stick" aria-hidden="true">
            {WHY_SCENES.map((route, i) => {
              const item = sceneForRoute(route);
              if (!sceneVisible(item)) return null;
              return (
                <div key={route} className="why-pic" data-index={i} data-on={i === 0 ? "" : undefined}>
                  <Scene item={stillOf(item)} locale={locale} sizes="50vw" />
                </div>
              );
            })}
          </div>
          <div>
            {why.map((point, i) => (
              <article key={point.title} className="why-point" data-index={i}>
                <h3>{point.title}</h3>
                <p className="lead text-graphite">{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How a first job starts, on a rail that fills. */}
      <section className="wrap section" aria-labelledby="steps-heading">
        <div className="section-head mb-6" data-rise>
          <h2 id="steps-heading">{t("home.stepsHeading")}</h2>
        </div>
        <div className="rail-steps">
          <span className="rail" aria-hidden="true">
            <i />
          </span>
          <ol>
          {steps.map((step) => (
            <li key={step.title} className="rail-step">
              <h3>{step.title}</h3>
              <p className="lead text-graphite">{step.body}</p>
            </li>
          ))}
          </ol>
        </div>
      </section>

      {/* Straight talk. */}
      <section className="section" aria-labelledby="plain-heading" style={{ background: "var(--vkc-label)" }}>
        <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="section-head" data-rise>
            <p className="eyebrow">{t("home.plain.eyebrow")}</p>
            <h2 id="plain-heading">{t("home.plain.heading")}</h2>
          </div>
          <p className="statement self-center" style={{ fontSize: "clamp(1.5rem, 1rem + 2vw, 2.5rem)", maxWidth: "none" }}>
            {t("home.plain.body")}
          </p>
        </div>
      </section>

      <div className="mosaic">
        <SceneGalleries route="/" locale={locale} className="!mt-20" />
      </div>

      <Faq locale={locale} heading={t("home.faq.heading")} items={faq} />

      <ClientStories locale={locale} heading={t("common.storiesHeading")} />
      <Testimonials locale={locale} heading={t("common.testimonialsHeading")} />
      <ClientList heading={t("common.clientsHeading")} />

      {/* Where this leads next: Montreal, About, Contact, the end of the site's order. */}
      <div className="wrap mt-20">
        <RelatedPages locale={locale} route="/" />
      </div>

      {/* The closing frame. */}
      <section className="finale mt-20" aria-labelledby="finale-heading" data-shared="cta">
        <div className="finale-media" aria-hidden="true">
          <Cover route="/locations/montreal" locale={locale} />
        </div>
        <div className="wrap">
          <h2 id="finale-heading" className="finale-title mb-8">
            {shiftEnds ?? t("common.ctaBand.heading")}
          </h2>
          <CtaActions locale={locale} />
        </div>
      </section>
    </PageShell>
  );
}

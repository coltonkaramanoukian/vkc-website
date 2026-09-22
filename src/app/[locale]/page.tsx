import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClientList } from "@/components/client-list";
import { CtaActions, CtaBand } from "@/components/cta-band";
import { DemoVideo } from "@/components/demo-video";
import { PageShell } from "@/components/page-shell";
import { PhotoRow } from "@/components/photo";
import { ServicePlacards } from "@/components/service-placards";
import { containersIn, fillMethods, site, tagline, type ContainerGroup } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isLocale, localizedPath, type AppPathname } from "@/i18n/pathnames";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/", "home", { absoluteTitle: true });
}

const CONTAINER_GROUPS: { group: ContainerGroup; route: AppPathname; label: string }[] = [
  { group: "bottles-and-jugs", route: "/containers/bottles-and-jugs", label: "bottlesAndJugs" },
  { group: "pails", route: "/containers/pails", label: "pails" },
  { group: "kits", route: "/containers/kits", label: "kits" },
];

const INDUSTRIES: { route: AppPathname; label: string }[] = [
  { route: "/industries/cleaners", label: "cleaners" },
  { route: "/industries/lubricants", label: "lubricants" },
  { route: "/industries/sealers-and-coatings", label: "sealersCoatings" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { t, raw } = await getCopy(locale);
  const steps = raw<{ title: string; body: string }[]>("home.steps");

  return (
    <PageShell locale={locale} route="/">
      <section className="wrap pb-12 pt-10 sm:pt-16">
        <p className="field-name">{t("home.eyebrow")}</p>
        <h1 className="mt-3 max-w-[16ch]">{tagline(locale)}</h1>
        <p className="mt-5 max-w-[60ch] text-[1.125rem]">{t("home.sub")}</p>
        <div className="mt-7">
          <CtaActions locale={locale} />
        </div>
      </section>

      <div className="wrap">
        <DemoVideo locale={locale} label={site.brandName} />
      </div>

      <div className="wrap">
        <hr className="fill-rule" />
      </div>

      <section className="wrap mt-12" aria-labelledby="services-heading">
        <h2 id="services-heading">{t("home.servicesHeading")}</h2>
        <p className="mt-2 text-graphite">{t("home.servicesIntro")}</p>
        <div className="mt-6">
          <ServicePlacards locale={locale} showNameNote />
        </div>
        <PhotoRow ids={["home-second-shift", "home-bottleneck"]} locale={locale} className="mt-5" />
      </section>

      <section className="wrap mt-20" aria-labelledby="containers-heading">
        <h2 id="containers-heading">{t("home.containersHeading")}</h2>
        <p className="prose-measure mt-3">{t("home.containersIntro")}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {CONTAINER_GROUPS.map(({ group, route, label }) => (
            <div key={group} className="placard">
              <h3 className="border-b-[1.5px] border-ink px-4 py-3 text-[1.25rem]">
                <Link href={localizedPath(locale, route)} className="text-ink">
                  {t(`common.nav.${label}`)}
                </Link>
              </h3>
              <ul className="px-4 py-3 font-mono text-[0.9375rem]">
                {containersIn(group).map((family) => (
                  <li key={family.id} className="py-0.5">
                    {family.name[locale]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4">
          <span className="field-name mr-3">{t("common.fields.fillMethods")}</span>
          {fillMethods.map((m) => m.name[locale]).join(", ")}
        </p>
      </section>

      <section className="wrap mt-20" aria-labelledby="industries-heading">
        <h2 id="industries-heading">{t("home.industriesHeading")}</h2>
        <p className="prose-measure mt-3">{t("home.industriesIntro")}</p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {INDUSTRIES.map(({ route, label }) => (
            <li key={route}>
              <Link href={localizedPath(locale, route)} className="btn btn-secondary">
                {t(`common.nav.${label}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap mt-20" aria-labelledby="steps-heading">
        <h2 id="steps-heading">{t("home.stepsHeading")}</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.title} className="border-t-[3px] border-ink pt-4">
              <h3>{step.title}</h3>
              <p className="mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <ClientList heading={t("common.clientsHeading")} />
      <CtaBand locale={locale} />
    </PageShell>
  );
}

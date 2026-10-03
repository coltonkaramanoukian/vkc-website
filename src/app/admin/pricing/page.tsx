import Link from "next/link";
import { PricingForm } from "@/components/admin/pricing-form";
import { currentPricing } from "@/lib/admin/current";
import { persistenceMode } from "@/lib/admin/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NOTE: Record<string, string> = {
  fs: "Local mode — saving writes the pricing file on this machine.",
  github: "Live mode — saving commits to the repository and publishes a new version of the site.",
  none: "No store configured — saving is disabled until the server is set up (see NEEDS-COLTON.md §13).",
};

export default async function AdminPricingPage() {
  const mode = persistenceMode();
  const pricing = await currentPricing();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-graphite transition hover:text-ink">
          ← All sections
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Estimator pricing</h1>
        <p className="mt-2 text-sm text-graphite">
          The rates behind the public estimator at <code>/estimate</code>. Every figure here feeds the ballpark the visitor
          sees — it is never shown as a fixed price. Set real numbers, then turn off “placeholder rates”.
        </p>
      </header>

      <p className="mt-6 rounded-xl border border-hairline bg-label px-4 py-3 text-sm text-graphite">{STORE_NOTE[mode]}</p>

      <div className="mt-8">
        <PricingForm initial={pricing} />
      </div>
    </main>
  );
}

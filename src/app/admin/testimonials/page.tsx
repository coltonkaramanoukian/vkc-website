import Link from "next/link";
import { TestimonialsForm } from "@/components/admin/testimonials-form";
import { currentTestimonials } from "@/lib/admin/current";
import { persistenceMode } from "@/lib/admin/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NOTE: Record<string, string> = {
  fs: "Local mode — saving writes the testimonials file on this machine.",
  github: "Live mode — saving commits to the repository and publishes a new version of the site.",
  none: "No store configured — saving is disabled until the server is set up (see NEEDS-COLTON.md §14).",
};

export default async function AdminTestimonialsPage() {
  const mode = persistenceMode();
  const testimonials = await currentTestimonials();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header>
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-graphite transition hover:text-ink">
          ← All sections
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Testimonials</h1>
        <p className="mt-2 text-sm text-graphite">
          Customer quotes for the social-proof section. A testimonial names a real person and company, so add one only with
          their permission — the same standard as a client name. Nothing shows on the site until you mark it Published, and a
          published one needs a quote in both English and French. Leave the rating blank unless it is a real rating.
        </p>
      </header>

      <p className="mt-6 rounded-xl border border-hairline bg-label px-4 py-3 text-sm text-graphite">{STORE_NOTE[mode]}</p>

      <div className="mt-8">
        <TestimonialsForm initial={testimonials} />
      </div>
    </main>
  );
}

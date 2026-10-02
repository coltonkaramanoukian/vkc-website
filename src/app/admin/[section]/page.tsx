import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientsForm } from "@/components/admin/clients-form";
import { ObjectForm } from "@/components/admin/object-form";
import { currentContent } from "@/lib/admin/current";
import { listFormValues, objectFormValues } from "@/lib/admin/prefill";
import { getSection } from "@/lib/admin/sections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SectionEditorPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionId } = await params;
  const section = getSection(sectionId);
  if (!section) notFound();

  const current = await currentContent(section);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav className="mb-6">
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-graphite transition hover:text-ink">
          ← All sections
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">{section.title}</h1>
        <p className="mt-2 text-sm text-graphite">{section.description}</p>
      </header>

      {section.kind === "object" ? (
        <ObjectForm section={section} initialValues={objectFormValues(section, current)} />
      ) : (
        <ClientsForm section={section} initialEntries={listFormValues(section, current)} />
      )}
    </main>
  );
}

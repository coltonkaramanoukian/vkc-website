"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { errorCopy } from "@/lib/error-copy";

/**
 * The locale segment's error boundary: a rendering error on any page shows
 * this instead of a blank screen. Client-side by requirement; copy comes
 * from lib/error-copy.ts because messages may be what failed.
 */
export default function LocaleError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "fr";
  const copy = errorCopy(locale);

  useEffect(() => {
    console.error(JSON.stringify({ event: "page_error", digest: error.digest ?? null, message: error.message }));
  }, [error]);

  return (
    <main id="main" className="wrap py-16" lang={locale === "en" ? "en-CA" : "fr-CA"}>
      <p className="eyebrow">VKC Packaging</p>
      <h1 className="mt-4 max-w-[20ch]">{copy.heading}</h1>
      <p className="lead mt-5">{copy.body}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          {copy.retry}
        </button>
        <Link href={`/${locale}`} className="btn btn-secondary">
          {copy.home}
        </Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ERROR_COPY } from "@/lib/error-copy";
import "./globals.css";

/**
 * Last resort: the root layout itself failed, so this renders its own
 * html/body. No locale is known here; both languages appear, French first.
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr-CA">
      <body>
        <main className="wrap py-20">
          <h1>{ERROR_COPY.fr.heading}</h1>
          <p className="mt-3">{ERROR_COPY.fr.body}</p>
          <p className="mt-6" lang="en-CA">
            <strong>{ERROR_COPY.en.heading}</strong> {ERROR_COPY.en.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              {ERROR_COPY.fr.retry} / {ERROR_COPY.en.retry}
            </button>
            <Link href="/fr" className="btn btn-secondary">
              {ERROR_COPY.fr.home}
            </Link>
            <Link href="/en" className="btn btn-secondary" lang="en-CA">
              {ERROR_COPY.en.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

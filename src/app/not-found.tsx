import Link from "next/link";
import "./globals.css";

// Paths outside /fr and /en that reach the app (the proxy handles the rest).
export default function GlobalNotFound() {
  return (
    <html lang="fr-CA">
      <body>
        <main className="wrap py-20">
          <h1>Page introuvable / Page not found</h1>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/fr">Accueil (français)</Link>
            </li>
            <li>
              <Link href="/en">Home (English)</Link>
            </li>
          </ul>
        </main>
      </body>
    </html>
  );
}

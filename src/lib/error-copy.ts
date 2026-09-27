// Copy for the error boundaries. They render OUTSIDE the message pipeline
// (an error boundary is a client component and may be the thing that failed
// to load messages), so these four strings live here, in both languages,
// as the one documented exception to "prose lives in i18n/messages". Facts:
// none. Numbers: none.
export interface ErrorCopy {
  heading: string;
  body: string;
  retry: string;
  home: string;
}

export const ERROR_COPY: Record<"fr" | "en", ErrorCopy> = {
  fr: {
    heading: "Cette page a rencontré un problème.",
    body: "Réessayez, ou revenez à l’accueil. Rien de ce que vous avez tapé n’a été envoyé.",
    retry: "Réessayer",
    home: "Accueil",
  },
  en: {
    heading: "Something went wrong on this page.",
    body: "Try again, or go back to the home page. Nothing you typed has been sent.",
    retry: "Try again",
    home: "Home page",
  },
};

export function errorCopy(locale: unknown): ErrorCopy {
  return locale === "en" ? ERROR_COPY.en : ERROR_COPY.fr;
}

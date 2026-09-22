import type { ReactNode } from "react";

// The real root layout (html/body, fonts, lang) is app/[locale]/layout.tsx.
// This pass-through exists so app/not-found.tsx can catch non-locale paths.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

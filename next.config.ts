import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Response headers every route carries. No CSP with a script-src: the pages are
// prerendered, so a nonce is not available and 'unsafe-inline' would be the
// only option, which is worse than saying nothing.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  // ~ has its own package-lock.json; pin the workspace root to this repo.
  turbopack: { root: process.cwd() },
  // next/image serves content/scenes.json media only (photos.json renders a
  // plain <img>). Next 16 requires the qualities list to be explicit.
  images: {
    qualities: [75],
    localPatterns: [
      { pathname: "/media/**", search: "" },
      { pathname: "/photos/**", search: "" },
    ],
  },
  // OG cards read brand fonts from disk at build time.
  outputFileTracingIncludes: {
    "/og/[locale]/[key]": ["./brand/fonts/ttf/static/*.ttf"],
  },
};

export default withNextIntl(nextConfig);

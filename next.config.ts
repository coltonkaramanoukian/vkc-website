import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // ~ has its own package-lock.json; pin the workspace root to this repo.
  turbopack: { root: process.cwd() },
  // OG images read brand fonts from disk at build time.
  outputFileTracingIncludes: {
    "/[locale]/opengraph-image": ["./brand/fonts/ttf/static/*.ttf"],
  },
};

export default withNextIntl(nextConfig);

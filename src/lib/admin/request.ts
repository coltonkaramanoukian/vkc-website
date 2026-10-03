// Request-side helpers shared by the admin API routes: read the session cookie,
// confirm the caller holds a valid session, and reject cross-site POSTs. The
// session cookie is sameSite=lax; this Origin check is the second lock on every
// state-changing call (defence in depth, not instead of it).

import { ADMIN_COOKIE, verifySessionToken } from "./session.ts";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

/** True only when the request carries a session token this server signed and that hasn't expired. */
export async function requireAdmin(request: Request): Promise<boolean> {
  return verifySessionToken(readCookie(request, ADMIN_COOKIE));
}

/** CSRF guard: the Origin (or Referer) host must match the request host. */
export function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) return false; // a state-changing POST with no Origin is refused.
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

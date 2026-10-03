// Owner-only session for the content editor (/admin). One owner, one password;
// no user store. A signed, httpOnly cookie carries only an expiry — the HMAC is
// what proves it was issued here. Built on Web Crypto so the SAME code runs in
// the Edge middleware gate and the Node save routes.

export const ADMIN_COOKIE = "vkc_admin";
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

/** Both the password and the signing secret must be set, or /admin is closed. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && sessionSecret() !== null;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(signature);
}

/** Length-safe, constant-time string compare (both sides are fixed-length HMACs). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A signed token `<payload>.<sig>`, or null when no secret is configured. */
export async function createSessionToken(ttlMs: number = DEFAULT_TTL_MS, now: number = Date.now()): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: now + ttlMs })));
  const signature = toBase64Url(await hmac(payload, secret));
  return `${payload}.${signature}`;
}

/** True only for a token this server signed whose expiry is still in the future. */
export async function verifySessionToken(token: string | undefined | null, now: number = Date.now()): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = toBase64Url(await hmac(payload, secret));
  if (!timingSafeEqual(signature, expected)) return false;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { exp?: unknown };
    return typeof decoded.exp === "number" && now < decoded.exp;
  } catch {
    return false;
  }
}

/** Constant-time password check against ADMIN_PASSWORD (compared as HMACs, no length leak). */
export async function verifyPassword(input: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const secret = sessionSecret();
  if (!password || !secret) return false;
  const a = toBase64Url(await hmac(input, secret));
  const b = toBase64Url(await hmac(password, secret));
  return timingSafeEqual(a, b);
}

export function sessionCookie(token: string, ttlMs: number = DEFAULT_TTL_MS) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  };
}

export function clearedCookie() {
  return { name: ADMIN_COOKIE, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
}

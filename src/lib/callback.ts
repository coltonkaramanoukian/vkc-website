export function callbackLine(
  phone: string | null | undefined,
  slogan: string | null | undefined,
): { text: string; href: string; slogan: string | null } | null {
  if (phone == null) return null;

  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) return null;

  const href = `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;

  const trimmedSlogan =
    slogan == null || slogan.trim().length === 0 ? null : slogan.trim();

  return { text: trimmed, href, slogan: trimmedSlogan };
}

// Immutable dot-path get/set for building content objects from flat field maps.
// Never mutates its input — every write returns a fresh object (coding-style:
// immutability). Paths are the dotted keys declared in sections.ts.

export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

/** Returns a new object with `path` set to `value`; intermediate objects are cloned, not shared. */
export function setPath<T extends Record<string, unknown>>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const base: Record<string, unknown> = { ...source };
  if (rest.length === 0) {
    base[head] = value;
    return base as T;
  }
  const child = base[head];
  const childObject = child && typeof child === "object" && !Array.isArray(child) ? (child as Record<string, unknown>) : {};
  base[head] = setPath(childObject, rest.join("."), value);
  return base as T;
}

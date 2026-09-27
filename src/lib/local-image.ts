// Measures an image that ships under public/ at render time, so components
// can reserve its box without anyone typing width and height into content.
// Server-only: reads the file header from disk.
import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { readImageSize, type ImageSize } from "./image-size";

const HEADER_BYTES = 4096;

/** Size of a file referenced by its public path ("/photos/x.jpg"), or null when it is missing or not a format we read. */
export function localImageSize(publicPath: string): ImageSize | null {
  if (!publicPath.startsWith("/") || publicPath.includes("..")) return null;
  const file = join(process.cwd(), "public", normalize(publicPath));
  try {
    const bytes = readFileSync(file);
    return readImageSize(bytes.subarray(0, HEADER_BYTES));
  } catch (error) {
    console.warn(`[local-image] could not measure ${publicPath}: ${String(error)}`);
    return null;
  }
}

// Intrinsic pixel size from an image file's header, so a photo or logo can
// reserve its box before it loads. Pure: takes bytes, returns a size or null.
// PNG, JPEG, GIF and WebP (VP8, VP8L, VP8X). Anything else is null, and the
// caller falls back to a plain <img>.

export interface ImageSize {
  width: number;
  height: number;
  type: "png" | "jpeg" | "gif" | "webp";
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function positive(width: number, height: number, type: ImageSize["type"]): ImageSize | null {
  return width > 0 && height > 0 ? { width, height, type } : null;
}

function png(bytes: Buffer): ImageSize | null {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return positive(bytes.readUInt32BE(16), bytes.readUInt32BE(20), "png");
}

function gif(bytes: Buffer): ImageSize | null {
  if (bytes.length < 10) return null;
  const head = bytes.toString("ascii", 0, 6);
  if (head !== "GIF87a" && head !== "GIF89a") return null;
  return positive(bytes.readUInt16LE(6), bytes.readUInt16LE(8), "gif");
}

// Start-of-frame markers carry the dimensions; every other segment is skipped
// by its declared length until the scan data (SOS) or the end of the buffer.
const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpeg(bytes: Buffer): ImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = bytes.readUInt16BE(offset + 2);
    if (SOF_MARKERS.has(marker)) {
      if (offset + 9 > bytes.length) return null;
      return positive(bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5), "jpeg");
    }
    offset += 2 + length;
  }
  return null;
}

function webp(bytes: Buffer): ImageSize | null {
  if (bytes.length < 30) return null;
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return positive(1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3), "webp");
  }
  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return positive(bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff, "webp");
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) return null;
    const bits = bytes.readUInt32LE(21);
    return positive((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1, "webp");
  }
  return null;
}

/** Width and height in pixels from the first bytes of a file, or null when the format is not one of the four. */
export function readImageSize(bytes: Buffer): ImageSize | null {
  return png(bytes) ?? jpeg(bytes) ?? gif(bytes) ?? webp(bytes) ?? null;
}

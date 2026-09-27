import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readImageSize } from "./image-size.ts";

const pngBytes = (width: number, height: number) => {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
};

const jpegBytes = (width: number, height: number) => {
  // SOI, an APP0 segment to skip, then SOF0 with the frame size.
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
  const sof0 = Buffer.alloc(11);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0.writeUInt16BE(9, 2);
  sof0[4] = 8;
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof0]);
};

const gifBytes = (width: number, height: number) => {
  const b = Buffer.alloc(13);
  b.write("GIF89a", 0, "ascii");
  b.writeUInt16LE(width, 6);
  b.writeUInt16LE(height, 8);
  return b;
};

const webpX = (width: number, height: number) => {
  const b = Buffer.alloc(30);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8X", 12, "ascii");
  b.writeUIntLE(width - 1, 24, 3);
  b.writeUIntLE(height - 1, 27, 3);
  return b;
};

const webpLossy = (width: number, height: number) => {
  const b = Buffer.alloc(30);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8 ", 12, "ascii");
  b[23] = 0x9d;
  b[24] = 0x01;
  b[25] = 0x2a;
  b.writeUInt16LE(width, 26);
  b.writeUInt16LE(height, 28);
  return b;
};

const webpLossless = (width: number, height: number) => {
  const b = Buffer.alloc(30);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8L", 12, "ascii");
  b[20] = 0x2f;
  b.writeUInt32LE((width - 1) | ((height - 1) << 14), 21);
  return b;
};

describe("readImageSize", () => {
  it("reads PNG, JPEG and GIF headers", () => {
    assert.deepEqual(readImageSize(pngBytes(1200, 800)), { width: 1200, height: 800, type: "png" });
    assert.deepEqual(readImageSize(jpegBytes(640, 427)), { width: 640, height: 427, type: "jpeg" });
    assert.deepEqual(readImageSize(gifBytes(320, 200)), { width: 320, height: 200, type: "gif" });
  });

  it("reads the three WebP container layouts", () => {
    assert.deepEqual(readImageSize(webpX(1600, 900)), { width: 1600, height: 900, type: "webp" });
    assert.deepEqual(readImageSize(webpLossy(800, 600)), { width: 800, height: 600, type: "webp" });
    assert.deepEqual(readImageSize(webpLossless(512, 384)), { width: 512, height: 384, type: "webp" });
  });

  it("returns null for anything it does not recognise or a zero dimension", () => {
    assert.equal(readImageSize(Buffer.from("not an image at all, really not")), null);
    assert.equal(readImageSize(Buffer.alloc(0)), null);
    assert.equal(readImageSize(pngBytes(0, 10)), null);
    assert.equal(readImageSize(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), null);
  });
});

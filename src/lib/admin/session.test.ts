import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { adminConfigured, createSessionToken, verifyPassword, verifySessionToken } from "./session.ts";

const SECRET = "a-test-signing-secret-at-least-16";
const PASSWORD = "correct horse battery staple";

let saved: { pw?: string; secret?: string };

beforeEach(() => {
  saved = { pw: process.env.ADMIN_PASSWORD, secret: process.env.ADMIN_SESSION_SECRET };
  process.env.ADMIN_PASSWORD = PASSWORD;
  process.env.ADMIN_SESSION_SECRET = SECRET;
});

afterEach(() => {
  if (saved.pw === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = saved.pw;
  if (saved.secret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = saved.secret;
});

describe("adminConfigured", () => {
  it("is true only when password and a long-enough secret are both set", () => {
    assert.equal(adminConfigured(), true);
    delete process.env.ADMIN_PASSWORD;
    assert.equal(adminConfigured(), false);
  });

  it("is false when the secret is too short to sign with", () => {
    process.env.ADMIN_SESSION_SECRET = "tooshort";
    assert.equal(adminConfigured(), false);
  });
});

describe("session tokens", () => {
  it("verifies a token it just signed", async () => {
    const token = await createSessionToken();
    assert.ok(token);
    assert.equal(await verifySessionToken(token), true);
  });

  it("rejects a tampered signature", async () => {
    const token = (await createSessionToken())!;
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
    assert.equal(await verifySessionToken(tampered), false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = (await createSessionToken())!;
    process.env.ADMIN_SESSION_SECRET = "a-completely-different-secret-xx";
    assert.equal(await verifySessionToken(token), false);
  });

  it("rejects an expired token", async () => {
    const now = Date.now();
    const token = (await createSessionToken(1000, now))!;
    assert.equal(await verifySessionToken(token, now + 2000), false);
    assert.equal(await verifySessionToken(token, now + 500), true);
  });

  it("rejects empty and malformed tokens", async () => {
    assert.equal(await verifySessionToken(undefined), false);
    assert.equal(await verifySessionToken(""), false);
    assert.equal(await verifySessionToken("no-dot-here"), false);
  });
});

describe("verifyPassword", () => {
  it("accepts the configured password and rejects others", async () => {
    assert.equal(await verifyPassword(PASSWORD), true);
    assert.equal(await verifyPassword("wrong"), false);
    assert.equal(await verifyPassword(""), false);
  });

  it("is false when nothing is configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(await verifyPassword(PASSWORD), false);
  });
});

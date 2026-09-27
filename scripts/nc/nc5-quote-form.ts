// NC-5: the quote form, end to end, against a local mock of the Resend API
// (the real SDK, pointed at it via RESEND_BASE_URL). Requires a fresh `next build`.
//   (a) honeypot → 200, no Resend call, one log line
//   (b) valid submit → Resend 2xx logged            [mock; real delivery is Colton's check]
//   (c) RESEND_API_KEY unset → UI shows "email not configured", never success
//   (d) sixth request in a minute from one IP → 429
//   (e) visit-page submit → source=visit in the body sent to Resend
//   (f) a value the API refuses on a <select> → aria-invalid, aria-describedby → the message, focus on it
import { createServer, type IncomingMessage } from "node:http";
import { chromium } from "@playwright/test";
import { startServer, stopServer } from "../lib/server.ts";

const received: { path: string; body: Record<string, unknown> }[] = [];
const mock = createServer((req: IncomingMessage, res) => {
  let data = "";
  req.on("data", (c) => (data += c));
  req.on("end", () => {
    received.push({ path: req.url ?? "", body: data ? JSON.parse(data) : {} });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: `mock_${received.length}` }));
  });
});
await new Promise<void>((r) => mock.listen(4010, r));

const results: string[] = [];
const record = (name: string, pass: boolean, detail: string) => {
  results.push(`${pass ? "PASS" : "FAIL"} ${name}: ${detail}`);
  console.log(`${pass ? "✔" : "✖"} ${name}: ${detail}`);
};
const post = (base: string, body: Record<string, unknown>, ip: string) =>
  fetch(`${base}/api/quote`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
const valid = {
  source: "quote",
  locale: "en",
  company: "NC5 Test Co",
  name: "Test",
  email: "test@example.com",
  service: "bottleneck",
  product: "degreaser",
};
const logLines = (logs: string[], outcome: string) =>
  logs.join("").split("\n").filter((l) => l.includes(`"outcome":"${outcome}"`));

// ---- configured server (mock Resend) --------------------------------------
const configured = await startServer(3101, {
  RESEND_API_KEY: "re_mock_not_a_real_key",
  QUOTE_TO_EMAIL: "to@example.com",
  QUOTE_FROM_EMAIL: "from@example.com",
  RESEND_BASE_URL: "http://localhost:4010",
});
try {
  const a = await post(configured.base, { ...valid, website: "http://spam.example" }, "10.0.0.1");
  await new Promise((r) => setTimeout(r, 300));
  const hpLines = logLines(configured.logs, "honeypot");
  record("(a) honeypot", a.status === 200 && received.length === 0 && hpLines.length === 1,
    `HTTP ${a.status}, Resend calls ${received.length}, log lines ${hpLines.length}: ${hpLines[0]?.trim()}`);

  const b = await post(configured.base, valid, "10.0.0.2");
  await new Promise((r) => setTimeout(r, 300));
  const sent = logLines(configured.logs, "sent");
  record("(b) valid submit", b.status === 200 && received.length === 1 && sent.length === 1,
    `HTTP ${b.status}, mock Resend got POST ${received[0]?.path} → 200, log: ${sent[0]?.trim()}`);

  const statuses: number[] = [];
  for (let i = 0; i < 6; i += 1) statuses.push((await post(configured.base, valid, "10.0.0.9")).status);
  record("(d) rate limit", statuses.slice(0, 5).every((s) => s === 200) && statuses[5] === 429,
    `statuses from one IP: ${statuses.join(", ")}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${configured.base}/fr/visite`, { waitUntil: "networkidle" });
  const before = received.length;
  await page.fill("#visit-company", "Visite NC5");
  await page.fill("#visit-name", "Porte");
  await page.fill("#visit-contact", "514 000 0000");
  await page.check('#visit-form input[name="service"][value="second-shift"]');
  await page.fill("#visit-notes", "NC-5e");
  await page.click('#visit-form button[type="submit"]');
  await page.waitForSelector('#visit-form [data-quote-status="sent"]', { timeout: 10_000 });
  const statusText = await page.textContent('#visit-form [role="status"]');
  const payload = received[before]?.body as { text?: string; subject?: string } | undefined;
  console.log("   payload sent to Resend (e):", JSON.stringify(payload, null, 2).split("\n").join("\n   "));
  record("(e) visit source", Boolean(payload?.text?.startsWith("source=visit")),
    `UI: "${statusText?.trim()}"; body first line: "${payload?.text?.split("\n")[0]}"`);

  // (f) a rejected select is marked, described and focused: a value the API
  // refuses ("choice") must land on the <select>, not only on text inputs.
  const quotePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await quotePage.goto(`${configured.base}/en/quote`, { waitUntil: "networkidle" });
  await quotePage.fill("#quote-company", "Select Co");
  await quotePage.fill("#quote-name", "Tester");
  await quotePage.fill("#quote-email", "test@example.com");
  await quotePage.check('#quote-form input[name="service"][value="bottleneck"]');
  await quotePage.fill("#quote-product", "degreaser");
  await quotePage.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>("#quote-viscosity");
    if (!select) throw new Error("no #quote-viscosity on /en/quote");
    const bogus = document.createElement("option");
    bogus.value = "not-a-viscosity";
    bogus.textContent = "bogus";
    select.append(bogus);
    select.value = "not-a-viscosity";
  });
  await quotePage.click('#quote-form button[type="submit"]');
  await quotePage.waitForSelector('#quote-viscosity[aria-invalid="true"]', { timeout: 10_000 });
  const marked = await quotePage.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>("#quote-viscosity");
    const described = select?.getAttribute("aria-describedby") ?? "";
    const message = described ? (document.getElementById(described)?.textContent?.trim() ?? "") : "";
    const invalid = Array.from(document.querySelectorAll('#quote-form [aria-invalid="true"]')).map((el) => el.id);
    return { described, message, invalid, focused: document.activeElement?.id ?? "" };
  });
  // Only the select is rejected, so it is also the first invalid field and takes focus.
  record("(f) rejected select", marked.described === "quote-viscosity-error" && marked.message.length > 0 && marked.invalid.join() === "quote-viscosity" && marked.focused === "quote-viscosity",
    `invalid fields: [${marked.invalid.join(", ")}]; aria-describedby="${marked.described}" → "${marked.message}"; focus on #${marked.focused}`);
  await browser.close();
} finally {
  await stopServer(configured.child);
}

// ---- unconfigured server (no RESEND_API_KEY) ------------------------------
const bare = await startServer(3102, {
  RESEND_API_KEY: "",
  QUOTE_TO_EMAIL: "",
  QUOTE_FROM_EMAIL: "",
});
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${bare.base}/en/quote`, { waitUntil: "networkidle" });
  await page.fill("#quote-company", "NC5 Unconfigured");
  await page.fill("#quote-name", "Test");
  await page.fill("#quote-email", "test@example.com");
  await page.check('#quote-form input[name="service"][value="bottleneck"]');
  await page.click('#quote-form button[type="submit"]');
  await page.waitForSelector('#quote-form [data-quote-problem="unconfigured"]', { timeout: 10_000 });
  const alertText = await page.textContent('#quote-form [role="alert"]');
  const statusText = (await page.textContent('#quote-form [role="status"]'))?.trim();
  await page.screenshot({ path: "artifacts/nc5-unconfigured.png", fullPage: false, clip: { x: 0, y: 0, width: 390, height: 844 } });
  await browser.close();
  const lines = logLines(bare.logs, "email_not_configured");
  record("(c) key unset", Boolean(alertText?.includes("not set up")) && statusText === "" && lines.length === 1,
    `UI alert: "${alertText?.trim()}"; success region empty: ${statusText === ""}; log: ${lines[0]?.trim()}`);
} finally {
  await stopServer(bare.child);
  mock.close();
}

console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} NC-5 checks passed`);
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);

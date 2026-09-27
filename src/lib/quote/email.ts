import type { QuoteRequest } from "./validate.ts";

export interface QuoteEmail {
  subject: string;
  text: string;
  replyTo: string | null;
}

const SERVICE_LABEL: Record<QuoteRequest["service"], string> = {
  "second-shift": "Second Shift (at their plant)",
  bottleneck: "Bottleneck (at our facility)",
  unsure: "Not sure yet",
};

/**
 * Plain-text email to VKC. The first line carries machine-readable routing
 * (`source=visit` / `source=quote`, NC-5e), then one field per line.
 */
export function composeQuoteEmail(
  request: QuoteRequest,
  containerName: (id: string) => string,
): QuoteEmail {
  const container =
    request.container === null
      ? null
      : request.container === "other"
        ? "Something else"
        : request.container === "unsure"
          ? "Not sure"
          : containerName(request.container);

  const rows: [string, string | null][] = [
    ["Company", request.company],
    ["Name", request.name],
    ["Email", request.email],
    ["Phone", request.phone],
    ["Service", SERVICE_LABEL[request.service]],
    ["Shift to cover", request.shift],
    ["Product type", request.product],
    ["Rough viscosity", request.viscosity],
    ["Container and size", container],
    ["Units per run", request.units],
    ["Timeline", request.timeline],
  ];

  const lines = [
    `source=${request.source} locale=${request.locale}`,
    "",
    ...rows.filter(([, value]) => value !== null).map(([label, value]) => `${label}: ${value}`),
  ];
  if (request.notes) lines.push("", "Notes:", request.notes);

  const origin = `${request.source} page`;
  const kind = request.source === "contact" ? "Message" : "Quote request";
  return {
    subject: `${kind}: ${request.company} (${SERVICE_LABEL[request.service]}, ${origin})`,
    text: lines.join("\n"),
    replyTo: request.email,
  };
}

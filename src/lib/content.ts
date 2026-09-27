// Typed access to /content. Pages render facts ONLY through these exports.
// A null field renders nothing (§1): helpers return null, never a stand-in.

import capabilitiesJson from "../../content/capabilities.json";
import clientsJson from "../../content/clients.json";
import contactJson from "../../content/contact.json";
import containersJson from "../../content/containers.json";
import mediaJson from "../../content/media.json";
import photosJson from "../../content/photos.json";
import servicesJson from "../../content/services.json";
import siteJson from "../../content/site.json";
import taglinesJson from "../../content/taglines.json";
import type { Locale } from "@/i18n/pathnames";

export type Localized = { en: string | null; fr: string | null };
export type LocalizedText = { en: string; fr: string };

export interface Site {
  baseUrl: string;
  brandName: string;
  legalName: string;
}

export interface Contact {
  phone: string | null;
  email: string | null;
  address: {
    street: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    country: string | null;
  };
  hours: { en: string | null; fr: string | null; schema: string | null };
  serviceRadiusKm: number | null;
  privacyOfficer: { name: string | null; title: Localized; email: string | null };
}

export interface Capabilities {
  minimumRunSize: Localized;
  maximumRunSize: Localized;
  fillSizesOffered: Localized;
  viscosityRange: Localized;
  blendingBatchSizes: Localized;
  leadTime: Localized;
  equipment: {
    fillers: Localized;
    cappers: Localized;
    tijLidPrinters: Localized;
    scales: Localized;
  };
  secondShift: {
    crewSize: Localized;
    shiftsOffered: Localized;
    minimumCommitment: Localized;
    insurance: Localized;
  };
}

export interface Client {
  name: string;
  approved: boolean;
  logo?: string | null;
  url?: string | null;
  /** Colton only, with the client's written yes: the words and who said them. */
  quote?: { text: Localized; name: string; role?: Localized | null } | null;
  /** Colton only: what VKC ran for this client, in both languages. */
  caseStudy?: Localized | null;
}

export interface PhotoSlot {
  id: string;
  page: string;
  intent: string;
  src: string | null;
  alt: Localized;
  /** Optional intrinsic size; with both set the photo renders through next/image. */
  width?: number;
  height?: number;
}

export interface DemoMedia {
  landscape: string | null;
  portrait: string | null;
  landscapePoster: string | null;
  portraitPoster: string | null;
}

export interface Service {
  name: LocalizedText;
  where: LocalizedText;
  summary: LocalizedText;
  /** Why the name reads the way it does; edit together with `name`. */
  nameNote?: LocalizedText;
}

export type ContainerGroup = "bottles-and-jugs" | "pails" | "kits";

export interface ContainerFamily {
  id: string;
  group: ContainerGroup;
  name: LocalizedText;
}

export const site: Site = siteJson;
export const contact: Contact = contactJson as Contact;
export const capabilities: Capabilities = capabilitiesJson as Capabilities;
export const photos: PhotoSlot[] = photosJson as PhotoSlot[];
export const media: { demo: Record<Locale, DemoMedia> } = mediaJson as {
  demo: Record<Locale, DemoMedia>;
};
export const services: { secondShift: Service; bottleneck: Service } = servicesJson;
export const containerFamilies: ContainerFamily[] =
  containersJson.families as ContainerFamily[];
export const fillMethods: { id: string; name: LocalizedText }[] =
  containersJson.fillMethods;

/** Every entry, typed; callers filter on approved (see client-stories.ts). */
export function clientsForDisplay(): readonly Client[] {
  return clientsJson as Client[];
}

/** D3: only entries with approved === true (strictly) are ever rendered. */
export function approvedClients(): Client[] {
  return (clientsJson as Client[]).filter((client) => client.approved === true);
}

export function tagline(locale: Locale): string {
  const options = taglinesJson.options as Record<string, LocalizedText>;
  return options[taglinesJson.default][locale];
}

export function serviceNames(locale: Locale): { ss: string; bn: string } {
  return {
    ss: services.secondShift.name[locale],
    bn: services.bottleneck.name[locale],
  };
}

export function localized(value: Localized, locale: Locale): string | null {
  const text = value[locale];
  return typeof text === "string" && text.trim() !== "" ? text : null;
}

export function containersIn(group: ContainerGroup): ContainerFamily[] {
  return containerFamilies.filter((family) => family.group === group);
}

export function photoSlot(id: string): PhotoSlot | undefined {
  return photos.find((slot) => slot.id === id);
}

/** The postal address as one line, or null while contact.json has none of it. */
export function addressLine(): string | null {
  const { street, city, province, postalCode, country } = contact.address;
  const parts = [street, city, province, postalCode, country].filter(
    (part): part is string => typeof part === "string" && part.trim() !== "",
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/** tel: href from the display phone string, or null when no phone is on file. */
export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.baseUrl).toString();
}

// Turns the current content/*.json into the flat, form-shaped values the editor
// renders from. Nulls become empty strings for inputs; the save path collapses
// them back to null (validate.ts), so an untouched field round-trips to null.

import { getPath } from "./paths.ts";
import { sectionFields, type Field, type ListSection, type ObjectSection, type Section } from "./sections.ts";

export type LocalizedValue = { en: string; fr: string };
export type FormValue = string | number | boolean | LocalizedValue;
export type FormValues = Record<string, FormValue>;

function fieldValue(field: Field, source: unknown): FormValue {
  const raw = getPath(source, field.path);
  switch (field.type) {
    case "localized":
    case "localizedTextarea": {
      const object = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      return { en: typeof object.en === "string" ? object.en : "", fr: typeof object.fr === "string" ? object.fr : "" };
    }
    case "boolean":
      return raw === true;
    case "number":
      return typeof raw === "number" ? raw : "";
    default:
      return typeof raw === "string" ? raw : "";
  }
}

export function objectFormValues(section: ObjectSection, current: unknown): FormValues {
  const values: FormValues = {};
  for (const field of sectionFields(section)) values[field.path] = fieldValue(field, current);
  return values;
}

export interface ClientFormEntry {
  values: FormValues;
  /** Imaging passthrough (§1, Vito's lane): round-tripped untouched, no input. */
  logo: string | null;
}

export function listFormValues(section: ListSection, current: unknown): ClientFormEntry[] {
  const entries = Array.isArray(current) ? current : [];
  return entries.map((entry) => {
    const values: FormValues = {};
    for (const field of section.itemFields) values[field.path] = fieldValue(field, entry);
    const logo = getPath(entry, "logo");
    return { values, logo: typeof logo === "string" ? logo : null };
  });
}

/** An empty client row for the "add client" affordance. */
export function emptyClientEntry(section: ListSection): ClientFormEntry {
  const values: FormValues = {};
  for (const field of section.itemFields) {
    values[field.path] = field.type === "localized" || field.type === "localizedTextarea" ? { en: "", fr: "" } : field.type === "boolean" ? false : "";
  }
  return { values, logo: null };
}

export function isObjectSection(section: Section): section is ObjectSection {
  return section.kind === "object";
}

/** Whether a section currently holds any value — drives the dashboard's empty/filled hint. */
export function sectionHasContent(section: Section, current: unknown): boolean {
  if (section.kind === "list") return Array.isArray(current) && current.length > 0;
  return Object.values(objectFormValues(section, current)).some((value) => {
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return true;
    if (typeof value === "boolean") return false;
    return value.en.trim() !== "" || value.fr.trim() !== "";
  });
}

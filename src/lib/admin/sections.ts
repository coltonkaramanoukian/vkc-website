// The editable content, described once: the forms render from this and the save
// route validates against it. Only non-imaging content/*.json files appear here
// — media.json (video run) and client logos (imaging) are deliberately absent.

export type FieldType =
  | "text"
  | "tel"
  | "email"
  | "url"
  | "number"
  | "textarea"
  | "localized"
  | "localizedTextarea"
  | "boolean";

export interface Field {
  /** Dot-path within the section object (or within a list entry). */
  path: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
}

export interface FieldGroup {
  legend: string;
  fields: Field[];
}

export interface ObjectSection {
  id: "contact" | "capabilities";
  kind: "object";
  file: string;
  title: string;
  description: string;
  groups: FieldGroup[];
}

export interface ListSection {
  id: "clients";
  kind: "list";
  file: string;
  title: string;
  description: string;
  itemLabel: string;
  itemFields: Field[];
}

export type Section = ObjectSection | ListSection;

const CONTACT: ObjectSection = {
  id: "contact",
  kind: "object",
  file: "contact",
  title: "Contact details",
  description:
    "Phone, email and address render across the site (footer, contact page, the phone action bar) as soon as they have a value. Leave a field blank and it renders nothing.",
  groups: [
    {
      legend: "Phone and email",
      fields: [
        { path: "phone", label: "Phone", type: "tel", placeholder: "514-555-0199" },
        { path: "email", label: "Email", type: "email", placeholder: "hello@example.com" },
      ],
    },
    {
      legend: "Address",
      fields: [
        { path: "address.street", label: "Street", type: "text" },
        { path: "address.city", label: "City", type: "text" },
        { path: "address.province", label: "Province", type: "text", placeholder: "QC" },
        { path: "address.postalCode", label: "Postal code", type: "text" },
        { path: "address.country", label: "Country", type: "text", placeholder: "Canada" },
      ],
    },
    {
      legend: "Hours",
      fields: [
        { path: "hours.en", label: "Hours (English)", type: "text", placeholder: "Mon–Fri, 8–5" },
        { path: "hours.fr", label: "Hours (French)", type: "text", placeholder: "Lun–ven, 8 h–17 h" },
        {
          path: "hours.schema",
          label: "Hours (schema.org format)",
          type: "text",
          hint: "Machine-readable, e.g. Mo-Fr 08:00-17:00. Powers the LocalBusiness opening hours. Optional.",
        },
      ],
    },
    {
      legend: "Service area",
      fields: [
        {
          path: "serviceRadiusKm",
          label: "Service radius (km)",
          type: "number",
          hint: "Optional. A number only.",
        },
      ],
    },
    {
      legend: "Privacy contact",
      fields: [
        { path: "privacyOfficer.name", label: "Name", type: "text" },
        { path: "privacyOfficer.title", label: "Title", type: "localized" },
        { path: "privacyOfficer.email", label: "Email", type: "email" },
      ],
    },
  ],
};

/** One localized capability field; the label is the row, EN + FR are the values. */
const cap = (path: string, label: string, hint?: string): Field => ({ path, label, type: "localized", hint });

const CAPABILITIES: ObjectSection = {
  id: "capabilities",
  kind: "object",
  file: "capabilities",
  title: "Capabilities and specs",
  description:
    "The only place capability numbers may come from (run sizes, fill sizes, lead times, equipment). Written in both languages; a blank pair renders nothing. These are facts — they commit to content and the number guard checks them.",
  groups: [
    {
      legend: "Runs and fills",
      fields: [
        cap("minimumRunSize", "Minimum run"),
        cap("maximumRunSize", "Maximum run"),
        cap("fillSizesOffered", "Fill sizes"),
        cap("viscosityRange", "Viscosity range"),
      ],
    },
    {
      legend: "Blending and lead time",
      fields: [cap("blendingBatchSizes", "Batch sizes"), cap("leadTime", "Lead time")],
    },
    {
      legend: "Equipment",
      fields: [
        cap("equipment.fillers", "Fillers"),
        cap("equipment.cappers", "Cappers"),
        cap("equipment.tijLidPrinters", "TIJ lid printers"),
        cap("equipment.scales", "Scales"),
      ],
    },
    {
      legend: "Second Shift",
      fields: [
        cap("secondShift.crewSize", "Crew size"),
        cap("secondShift.shiftsOffered", "Shifts offered"),
        cap("secondShift.minimumCommitment", "Minimum commitment"),
        cap("secondShift.insurance", "Insurance"),
      ],
    },
  ],
};

const CLIENTS: ListSection = {
  id: "clients",
  kind: "list",
  file: "clients",
  title: "Clients and social proof",
  description:
    "A client name or quote renders ONLY on an entry marked approved — add one only with the client's written permission. Logos are set by the imaging run, not here. An empty list renders no section.",
  itemLabel: "Client",
  itemFields: [
    { path: "name", label: "Client name", type: "text" },
    { path: "approved", label: "Approved to show (written permission on file)", type: "boolean" },
    { path: "url", label: "Website", type: "url" },
    { path: "quote.text", label: "Quote", type: "localizedTextarea", hint: "Their words, in both languages. Leave blank for a name-only entry." },
    { path: "quote.name", label: "Quote — who said it", type: "text" },
    { path: "quote.role", label: "Quote — their role", type: "localized" },
    { path: "caseStudy", label: "Case study", type: "localizedTextarea", hint: "What VKC ran for them, in both languages. Optional." },
  ],
};

export const SECTIONS: Section[] = [CONTACT, CAPABILITIES, CLIENTS];

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((section) => section.id === id);
}

/** Every field a section exposes, flattened (list sections expose their item fields). */
export function sectionFields(section: Section): Field[] {
  return section.kind === "object" ? section.groups.flatMap((group) => group.fields) : section.itemFields;
}

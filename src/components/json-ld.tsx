import { contact, site } from "@/lib/content";
import { serializeJsonLd } from "@/lib/structured-data";

/**
 * D10. Organization + LocalBusiness. Contact facts come ONLY from
 * content/contact.json and absent fields are omitted; name/legalName/url come
 * from content/site.json. No services are described here.
 */
export function buildJsonLd(): Record<string, unknown> {
  const url = site.baseUrl;
  const { street, city, province, postalCode, country } = contact.address;
  const addressParts = {
    streetAddress: street,
    addressLocality: city,
    addressRegion: province,
    postalCode,
    addressCountry: country,
  };
  const presentAddress = Object.fromEntries(
    Object.entries(addressParts).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
  );

  const contactFields: Record<string, unknown> = {};
  if (contact.phone) contactFields.telephone = contact.phone;
  if (contact.email) contactFields.email = contact.email;
  if (Object.keys(presentAddress).length > 0) {
    contactFields.address = { "@type": "PostalAddress", ...presentAddress };
  }

  const business: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": `${url}/#business`,
    name: site.brandName,
    url,
    parentOrganization: { "@id": `${url}/#organization` },
    ...contactFields,
  };
  if (contact.hours.schema) business.openingHours = contact.hours.schema;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: site.brandName,
        legalName: site.legalName,
        url,
        // The brand mark the manifest already ships; gives search a logo to
        // show. Not a claim, just the icon that is already on the site.
        logo: `${url}/icon.svg`,
        ...contactFields,
      },
      business,
    ],
  };
}

/** Any structured-data block; `<` is escaped so a value can never close the tag. */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function JsonLd() {
  return <JsonLdScript data={buildJsonLd()} />;
}

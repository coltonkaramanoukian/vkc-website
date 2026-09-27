import Link from "next/link";
import { Pictogram, type PictogramName } from "@/components/pictograms";

export interface ManifestItem {
  href: string;
  title: string;
  body?: string;
  picto: PictogramName;
}

/**
 * Linked rows ruled like a shipping manifest: pictogram, name, one line of
 * copy, a hairline between. The site's rule: a placard holds a fact, a rule
 * points somewhere. Used wherever a set of pages is offered as a list.
 */
export function Manifest({ items, headingLevel = "h3" }: { items: ManifestItem[]; headingLevel?: "h3" | "span" }) {
  const Title = headingLevel;
  return (
    <ul className="manifest">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="manifest-row">
            <Pictogram name={item.picto} className="manifest-picto" />
            <span className="manifest-head">
              <Title className="manifest-title">{item.title}</Title>
            </span>
            {item.body && <span className="manifest-body">{item.body}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

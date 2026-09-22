import type { ReactNode } from "react";

export interface PlacardField {
  name: string;
  value: ReactNode;
}

interface PlacardProps {
  title: string;
  where?: string;
  fields: PlacardField[];
  footer?: ReactNode;
  children?: ReactNode;
  headingLevel?: "h2" | "h3";
  /** Marks a D16 surface: the Second Shift guard checks this element's text. */
  guard?: "second-shift";
  className?: string;
}

/** A pallet label: bordered, square, a field grid. The site's core unit. */
export function Placard({
  title,
  where,
  fields,
  footer,
  children,
  headingLevel = "h3",
  guard,
  className = "",
}: PlacardProps) {
  const Heading = headingLevel;
  return (
    <article className={`placard ${className}`} data-guard={guard}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[1.5px] border-ink px-4 py-3 sm:px-5">
        <Heading className="text-[1.5rem] font-extrabold sm:text-[1.75rem]">{title}</Heading>
        {where && <p className="field-name text-ink">{where}</p>}
      </header>
      {children}
      {fields.length > 0 && (
        <dl>
          {fields.map((field) => (
            <div
              key={field.name}
              className="placard-row grid gap-0.5 px-4 py-3 sm:grid-cols-[10.5rem_1fr] sm:gap-4 sm:px-5"
            >
              <dt className="field-name pt-[0.2em]">{field.name}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {footer && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </article>
  );
}

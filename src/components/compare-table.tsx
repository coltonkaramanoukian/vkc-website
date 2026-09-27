import { services } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/i18n/pathnames";

interface CompareRow {
  label: string;
  ss: string;
  bn: string;
}

interface CompareCopy {
  eyebrow: string;
  heading: string;
  rowsLabel: string;
  rows: CompareRow[];
}

/**
 * The two services as one label, row by row. A real <table> (row headers
 * are the field names); below `md` each row stacks and every cell repeats
 * its column's name, so the reading order survives on a phone. The Second
 * Shift column is a D16 surface: the table is marked and carries all four
 * facts on its own.
 */
export async function CompareTable({ locale }: { locale: Locale }) {
  const { raw } = await getCopy(locale);
  const copy = raw<CompareCopy>("pages.services.compare");
  const ss = services.secondShift;
  const bn = services.bottleneck;
  return (
    <div className="compare" data-guard="second-shift">
      <h3 id="compare-heading" className="text-[1.375rem] sm:text-[1.5rem]">
        {copy.heading}
      </h3>
      <table className="mt-5" aria-labelledby="compare-heading">
        <thead>
          <tr>
            <th scope="col">
              <span className="field-name">{copy.rowsLabel}</span>
            </th>
            <th scope="col">
              <span className="block text-[1.125rem] font-extrabold">{ss.name[locale]}</span>
              <span className="field-name">{ss.where[locale]}</span>
            </th>
            <th scope="col">
              <span className="block text-[1.125rem] font-extrabold">{bn.name[locale]}</span>
              <span className="field-name">{bn.where[locale]}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {copy.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="field-name">
                {row.label}
              </th>
              <td data-col={ss.name[locale]}>{row.ss}</td>
              <td data-col={bn.name[locale]}>{row.bn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

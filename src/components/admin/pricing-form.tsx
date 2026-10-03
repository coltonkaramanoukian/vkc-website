"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SaveBar, useSave } from "@/components/admin/save-bar";
import { OPTION_KINDS, QUOTE_SERVICES, type LocalizedLabel, type Pricing } from "@/lib/estimator/pricing";

const INPUT =
  "w-full rounded-lg border border-hairline bg-floor px-3 py-2 text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-qc placeholder:text-graphite/60";
const SMALL = "font-mono text-xs uppercase tracking-wider text-graphite";

let counter = 0;
const uid = () => `row-${counter++}`;

type Label = LocalizedLabel;
interface ServiceRow {
  _key: string;
  id: string;
  quoteService: string;
  name: Label;
  unitLabel: Label;
  quantityLabel: Label;
  ratePerUnit: string;
  setupFee: string;
  minimum: string;
}
interface OptionRow {
  _key: string;
  id: string;
  name: Label;
  kind: string;
  value: string;
  appliesTo: string[];
}

const emptyLabel = (): Label => ({ en: "", fr: "" });
const toServiceRow = (s: Pricing["services"][number]): ServiceRow => ({
  _key: uid(),
  id: s.id,
  quoteService: s.quoteService,
  name: { ...s.name },
  unitLabel: { ...s.unitLabel },
  quantityLabel: { ...s.quantityLabel },
  ratePerUnit: String(s.ratePerUnit),
  setupFee: String(s.setupFee),
  minimum: String(s.minimum),
});
const toOptionRow = (o: Pricing["options"][number]): OptionRow => ({
  _key: uid(),
  id: o.id,
  name: { ...o.name },
  kind: o.kind,
  value: String(o.value),
  appliesTo: [...o.appliesTo],
});

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-qc">
      {message}
    </p>
  ) : null;
}

export function PricingForm({ initial }: { initial: Pricing }) {
  const router = useRouter();
  const { status, bannerError, fieldErrors, save } = useSave();

  const [placeholder, setPlaceholder] = useState(initial.placeholder);
  const [currency, setCurrency] = useState(initial.currency);
  const [rangeSpreadPct, setRangeSpreadPct] = useState(String(initial.rangeSpreadPct));
  const [roundTo, setRoundTo] = useState(String(initial.roundTo));
  const [services, setServices] = useState<ServiceRow[]>(initial.services.map(toServiceRow));
  const [options, setOptions] = useState<OptionRow[]>(initial.options.map(toOptionRow));

  const err = (path: string) => fieldErrors.get(path);

  function patchService(key: string, patch: Partial<ServiceRow>) {
    setServices((rows) => rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function patchServiceLabel(key: string, field: "name" | "unitLabel" | "quantityLabel", loc: "en" | "fr", value: string) {
    setServices((rows) => rows.map((r) => (r._key === key ? { ...r, [field]: { ...r[field], [loc]: value } } : r)));
  }
  function patchOption(key: string, patch: Partial<OptionRow>) {
    setOptions((rows) => rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function patchOptionLabel(key: string, loc: "en" | "fr", value: string) {
    setOptions((rows) => rows.map((r) => (r._key === key ? { ...r, name: { ...r.name, [loc]: value } } : r)));
  }
  function toggleApplies(key: string, serviceId: string) {
    setOptions((rows) =>
      rows.map((r) =>
        r._key === key
          ? { ...r, appliesTo: r.appliesTo.includes(serviceId) ? r.appliesTo.filter((id) => id !== serviceId) : [...r.appliesTo, serviceId] }
          : r,
      ),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const pricing = {
      placeholder,
      currency,
      rangeSpreadPct,
      roundTo,
      services: services.map((s) => ({
        id: s.id,
        quoteService: s.quoteService,
        name: s.name,
        unitLabel: s.unitLabel,
        quantityLabel: s.quantityLabel,
        ratePerUnit: s.ratePerUnit,
        setupFee: s.setupFee,
        minimum: s.minimum,
      })),
      options: options.map((o) => ({ id: o.id, name: o.name, kind: o.kind, value: o.value, appliesTo: o.appliesTo })),
    };
    const ok = await save({ pricing }, "/api/admin/pricing/save");
    if (ok) router.refresh();
  }

  const labelPair = (
    value: Label,
    onChange: (loc: "en" | "fr", v: string) => void,
    label: string,
    path: string,
  ) => (
    <div>
      <span className={SMALL}>{label}</span>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <input aria-label={`${label} (EN)`} value={value.en} onChange={(e) => onChange("en", e.target.value)} placeholder="English" className={INPUT} />
        <input aria-label={`${label} (FR)`} value={value.fr} onChange={(e) => onChange("fr", e.target.value)} placeholder="Français" className={INPUT} />
      </div>
      <FieldError message={err(path)} />
    </div>
  );

  const numberField = (label: string, value: string, onChange: (v: string) => void, path: string) => (
    <div>
      <span className={SMALL}>{label}</span>
      <input type="number" min={0} step="any" value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} mt-1`} />
      <FieldError message={err(path)} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      <section className="space-y-5 rounded-2xl border border-hairline p-5">
        <h2 className="text-lg font-semibold text-ink">Settings</h2>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={placeholder} onChange={(e) => setPlaceholder(e.target.checked)} className="mt-1 size-5 accent-qc" />
          <span>
            <span className="font-medium text-ink">These are placeholder rates</span>
            <span className="mt-0.5 block text-sm text-graphite">
              While on, the public estimator shows a “placeholder rates” notice. Turn it off once your real numbers are in.
            </span>
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className={SMALL}>Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="CAD" className={`${INPUT} mt-1`} />
            <FieldError message={err("currency")} />
          </div>
          {numberField("Range spread (%)", rangeSpreadPct, setRangeSpreadPct, "rangeSpreadPct")}
          {numberField("Round to nearest", roundTo, setRoundTo, "roundTo")}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Services</h2>
          <button
            type="button"
            onClick={() => setServices((r) => [...r, { ...toServiceRow({ id: "", quoteService: "unsure", name: emptyLabel(), unitLabel: emptyLabel(), quantityLabel: emptyLabel(), ratePerUnit: 0, setupFee: 0, minimum: 0 }) }])}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink transition hover:border-qc"
          >
            Add service
          </button>
        </div>
        <FieldError message={err("services")} />
        {services.map((s, i) => (
          <div key={s._key} className="space-y-4 rounded-2xl border border-hairline bg-label p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={SMALL}>Id (slug)</span>
                <input value={s.id} onChange={(e) => patchService(s._key, { id: e.target.value })} placeholder="bottleneck" className={`${INPUT} mt-1`} />
                <FieldError message={err(`services.${i}.id`)} />
              </div>
              <div>
                <span className={SMALL}>Sends lead as</span>
                <select value={s.quoteService} onChange={(e) => patchService(s._key, { quoteService: e.target.value })} className={`${INPUT} mt-1`}>
                  {QUOTE_SERVICES.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {labelPair(s.name, (loc, v) => patchServiceLabel(s._key, "name", loc, v), "Name", `services.${i}.name`)}
            {labelPair(s.unitLabel, (loc, v) => patchServiceLabel(s._key, "unitLabel", loc, v), "Unit (e.g. units, shifts, litres)", `services.${i}.unitLabel`)}
            {labelPair(s.quantityLabel, (loc, v) => patchServiceLabel(s._key, "quantityLabel", loc, v), "Quantity question", `services.${i}.quantityLabel`)}
            <div className="grid gap-4 sm:grid-cols-3">
              {numberField("Rate per unit", s.ratePerUnit, (v) => patchService(s._key, { ratePerUnit: v }), `services.${i}.ratePerUnit`)}
              {numberField("Setup fee", s.setupFee, (v) => patchService(s._key, { setupFee: v }), `services.${i}.setupFee`)}
              {numberField("Minimum", s.minimum, (v) => patchService(s._key, { minimum: v }), `services.${i}.minimum`)}
            </div>
            <button type="button" onClick={() => setServices((r) => r.filter((x) => x._key !== s._key))} className="text-sm text-graphite underline transition hover:text-qc">
              Remove this service
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Add-on options</h2>
          <button
            type="button"
            onClick={() => setOptions((r) => [...r, { ...toOptionRow({ id: "", name: emptyLabel(), kind: "flat", value: 0, appliesTo: [] }) }])}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink transition hover:border-qc"
          >
            Add option
          </button>
        </div>
        {options.map((o, i) => (
          <div key={o._key} className="space-y-4 rounded-2xl border border-hairline bg-label p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className={SMALL}>Id (slug)</span>
                <input value={o.id} onChange={(e) => patchOption(o._key, { id: e.target.value })} placeholder="labeling" className={`${INPUT} mt-1`} />
                <FieldError message={err(`options.${i}.id`)} />
              </div>
              <div>
                <span className={SMALL}>Kind</span>
                <select value={o.kind} onChange={(e) => patchOption(o._key, { kind: e.target.value })} className={`${INPUT} mt-1`}>
                  {OPTION_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <FieldError message={err(`options.${i}.kind`)} />
              </div>
              {numberField("Value", o.value, (v) => patchOption(o._key, { value: v }), `options.${i}.value`)}
            </div>
            {labelPair(o.name, (loc, v) => patchOptionLabel(o._key, loc, v), "Name", `options.${i}.name`)}
            <div>
              <span className={SMALL}>Applies to</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {services.filter((s) => s.id).map((s) => (
                  <label key={s._key} className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-sm">
                    <input type="checkbox" checked={o.appliesTo.includes(s.id)} onChange={() => toggleApplies(o._key, s.id)} className="size-4 accent-qc" />
                    <span>{s.id}</span>
                  </label>
                ))}
              </div>
              <FieldError message={err(`options.${i}.appliesTo`)} />
            </div>
            <button type="button" onClick={() => setOptions((r) => r.filter((x) => x._key !== o._key))} className="text-sm text-graphite underline transition hover:text-qc">
              Remove this option
            </button>
          </div>
        ))}
      </section>

      <SaveBar status={status} bannerError={bannerError} />
    </form>
  );
}

"use client";

import { useRef, useState } from "react";
import { AdminField } from "@/components/admin/fields";
import { SaveBar, useSave } from "@/components/admin/save-bar";
import { emptyClientEntry, type ClientFormEntry, type FormValue, type FormValues } from "@/lib/admin/prefill";
import type { ListSection } from "@/lib/admin/sections";

interface Row extends ClientFormEntry {
  id: string;
}

export function ClientsForm({ section, initialEntries }: { section: ListSection; initialEntries: ClientFormEntry[] }) {
  // Initial ids are index-based (deterministic, no ref read during render);
  // rows added later draw from this counter, which only advances in handlers.
  const nextId = useRef(0);
  const [rows, setRows] = useState<Row[]>(() => initialEntries.map((entry, index) => ({ ...entry, id: `init-${index}` })));
  const { status, bannerError, fieldErrors, save } = useSave();

  function setFieldValue(rowId: string, path: string, value: FormValue) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [path]: value } } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { ...emptyClientEntry(section), id: `row-${nextId.current++}` }]);
  }

  function removeRow(rowId: string) {
    setRows((current) => current.filter((row) => row.id !== rowId));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const items = rows.map((row) => ({ ...row.values, logo: row.logo }));
    await save({ section: section.id, data: { items } });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center text-sm text-graphite">
          No clients yet. Add one only once you have the client’s written permission to show their name.
        </p>
      )}

      {rows.map((row, index) => (
        <fieldset key={row.id} data-client-row className="space-y-5 rounded-xl border border-hairline bg-label p-5">
          <div className="flex items-center justify-between">
            <legend className="font-mono text-xs uppercase tracking-wider text-graphite">
              {section.itemLabel} {index + 1}
            </legend>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="rounded-md border border-hairline px-3 py-1 text-xs text-graphite transition hover:text-ink"
            >
              Remove
            </button>
          </div>

          {section.itemFields.map((field) => (
            <AdminField
              key={field.path}
              field={field}
              value={(row.values as FormValues)[field.path]}
              onChange={(value) => setFieldValue(row.id, field.path, value)}
              error={fieldErrors.get(`${index}:${field.path}`)}
              idPrefix={`${section.id}-${row.id}`}
            />
          ))}
        </fieldset>
      ))}

      <button
        type="button"
        onClick={addRow}
        data-add-client
        className="w-full rounded-xl border border-dashed border-hairline px-4 py-3 text-sm font-medium text-ink transition hover:border-qc"
      >
        + Add a client
      </button>

      <SaveBar status={status} bannerError={bannerError} />
    </form>
  );
}

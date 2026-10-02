"use client";

import { useState } from "react";
import { AdminField } from "@/components/admin/fields";
import type { FormValue, FormValues } from "@/lib/admin/prefill";
import type { ObjectSection } from "@/lib/admin/sections";
import { SaveBar, useSave } from "@/components/admin/save-bar";

export function ObjectForm({ section, initialValues }: { section: ObjectSection; initialValues: FormValues }) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const { status, bannerError, fieldErrors, save } = useSave();

  function setValue(path: string, value: FormValue) {
    setValues((current) => ({ ...current, [path]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await save({ section: section.id, data: { fields: values } });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      {section.groups.map((group) => (
        <fieldset key={group.legend} className="space-y-4">
          <legend className="mb-2 text-sm font-semibold text-ink">{group.legend}</legend>
          <div className="space-y-5">
            {group.fields.map((field) => (
              <AdminField
                key={field.path}
                field={field}
                value={values[field.path]}
                onChange={(value) => setValue(field.path, value)}
                error={fieldErrors.get(field.path)}
                idPrefix={section.id}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <SaveBar status={status} bannerError={bannerError} />
    </form>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { PRESSURES, WANTS, recommend, type Pressure, type Recommendation, type Want } from "@/lib/chooser";

export interface ChooserCopy {
  pressure: { label: string } & Record<Pressure, string>;
  want: { label: string } & Record<Want, string>;
  resultLabel: string;
  reset: string;
  results: Record<Recommendation, { title: string; body: string; link: string }>;
}

/**
 * Two questions, one answer. Radios so a keyboard walks it like any form;
 * the result is a live region so it is announced when it appears. Nothing
 * here is submitted anywhere.
 */
export function ServiceChooser({ copy, hrefs }: { copy: ChooserCopy; hrefs: Record<Recommendation, string> }) {
  const [pressure, setPressure] = useState<Pressure | null>(null);
  const [want, setWant] = useState<Want | null>(null);
  const result = recommend(pressure, want);

  const question = <T extends string>(
    name: string,
    label: string,
    options: readonly T[],
    text: Record<T, string>,
    value: T | null,
    onChange: (next: T) => void,
  ) => (
    <fieldset className="min-w-0">
      <legend className="field-name mb-3">{label}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label key={option} className="choice items-start">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="mt-1.5 size-5 shrink-0 accent-qc"
            />
            <span className="font-semibold leading-snug">{text[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1.1fr] lg:gap-8" data-chooser>
      {question("pressure", copy.pressure.label, PRESSURES, copy.pressure, pressure, setPressure)}
      {question("want", copy.want.label, WANTS, copy.want, want, setWant)}
      <div aria-live="polite" className="min-w-0">
        <p className="field-name mb-3">{copy.resultLabel}</p>
        {result ? (
          <div className="placard p-5 sm:p-6" data-chooser-result={result}>
            <h3 className="text-[1.375rem]">{copy.results[result].title}</h3>
            <p className="mt-3">{copy.results[result].body}</p>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href={hrefs[result]} className="btn btn-primary">
                {copy.results[result].link}
              </Link>
              <button
                type="button"
                className="chrome-link font-mono text-sm"
                onClick={() => {
                  setPressure(null);
                  setWant(null);
                }}
              >
                {copy.reset}
              </button>
            </p>
          </div>
        ) : (
          <div className="flex min-h-[10rem] items-end border-l-[3px] border-hairline pl-4">
            <div className="h-[3px] w-12 bg-hairline" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

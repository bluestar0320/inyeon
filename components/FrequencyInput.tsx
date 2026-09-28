"use client";

import { useId } from "react";

import type { Frequency, FrequencyUnit } from "@/lib/types";
import { unitLabel } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";

const UNITS: FrequencyUnit[] = ["day", "week", "month", "quarter", "year"];

const COPY = defineCopy({
  ko: {
    label: "빈도",
    option: (unit: FrequencyUnit) => `${unitLabel(unit)}에`,
    unitAria: "빈도 단위",
    countAria: "빈도 횟수",
    times: "번",
  },
  en: {
    label: "How often",
    option: (unit) =>
      ({ day: "Each day", week: "Each week", month: "Each month", quarter: "Each quarter", year: "Each year" })[unit],
    unitAria: "Frequency unit",
    countAria: "Number of times",
    times: "times",
  },
  ja: {
    label: "頻度",
    option: (unit) => `${unitLabel(unit)}に`,
    unitAria: "頻度の単位",
    countAria: "回数",
    times: "回",
  },
  es: {
    label: "Frecuencia",
    option: (unit) =>
      ({ day: "Al día", week: "A la semana", month: "Al mes", quarter: "Al trimestre", year: "Al año" })[unit],
    unitAria: "Unidad de frecuencia",
    countAria: "Número de veces",
    times: "veces",
  },
  zh: {
    label: "频率",
    option: (unit) => unitLabel(unit),
    unitAria: "频率单位",
    countAria: "次数",
    times: "次",
  },
});

export default function FrequencyInput({
  value,
  onChange,
  label,
}: {
  value: Frequency;
  onChange: (next: Frequency) => void;
  label?: string;
}) {
  const ids = useId();
  const t = tr(COPY);

  return (
    <div>
      <label className="label" htmlFor={`${ids}-count`}>
        {label ?? t.label}
      </label>
      <div className="flex items-center gap-2">
        <select
          className="input w-32"
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value as FrequencyUnit })}
          aria-label={t.unitAria}
        >
          {UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {t.option(unit)}
            </option>
          ))}
        </select>
        <input
          id={`${ids}-count`}
          className="input w-24"
          type="number"
          min={0}
          step="0.5"
          value={Number.isFinite(value.count) ? value.count : 0}
          onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
          aria-label={t.countAria}
        />
        <span className="text-sm text-ink-400">{t.times}</span>
      </div>
    </div>
  );
}

"use client";

import { useId } from "react";

import type { Frequency, FrequencyUnit } from "@/lib/types";
import { unitLabel } from "@/lib/format";

const UNITS: FrequencyUnit[] = ["day", "week", "month", "quarter", "year"];

export default function FrequencyInput({
  value,
  onChange,
  label = "빈도",
}: {
  value: Frequency;
  onChange: (next: Frequency) => void;
  label?: string;
}) {
  const ids = useId();

  return (
    <div>
      <label className="label" htmlFor={`${ids}-count`}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <select
          className="input w-32"
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value as FrequencyUnit })}
          aria-label="빈도 단위"
        >
          {UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unitLabel(unit)}에
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
          aria-label="빈도 횟수"
        />
        <span className="text-sm text-ink-400">번</span>
      </div>
    </div>
  );
}

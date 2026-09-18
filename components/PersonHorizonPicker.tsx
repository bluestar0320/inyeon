"use client";

import { useId } from "react";

import { formatYears } from "@/lib/format";
import type { PersonHorizon } from "@/lib/types";

const KINDS: { kind: PersonHorizon["kind"]; label: string }[] = [
  { kind: "life", label: "남은 평생" },
  { kind: "untilMyAge", label: "내가 n세 될 때까지" },
  { kind: "years", label: "앞으로 n년" },
];

export default function PersonHorizonPicker({
  value,
  myAge,
  countedYears,
  limitedByHorizon,
  onChange,
}: {
  value: PersonHorizon;
  myAge: number | null;
  countedYears: number;
  limitedByHorizon: boolean;
  onChange: (next: PersonHorizon) => void;
}) {
  const ids = useId();

  function pick(kind: PersonHorizon["kind"]): void {
    if (kind === "life") onChange({ kind: "life" });
    else if (kind === "untilMyAge")
      onChange({ kind: "untilMyAge", age: Math.ceil(((myAge ?? 30) + 5) / 5) * 5 });
    else onChange({ kind: "years", years: 5 });
  }

  return (
    <div>
      <span className="label">언제까지 셀까요</span>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="언제까지 셀까요">
        {KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            className={`chip ${value.kind === option.kind ? "chip-active" : ""}`}
            onClick={() => pick(option.kind)}
          >
            {option.label}
          </button>
        ))}

        {value.kind === "untilMyAge" && (
          <span className="flex items-center gap-2">
            <input
              id={`${ids}-age`}
              className="input w-20 py-1"
              type="number"
              min={0}
              max={130}
              value={value.age}
              onChange={(e) => onChange({ kind: "untilMyAge", age: Number(e.target.value) })}
              aria-label="목표 나이"
            />
            <span className="text-sm text-ink-400">세까지</span>
          </span>
        )}

        {value.kind === "years" && (
          <span className="flex items-center gap-2">
            <input
              id={`${ids}-years`}
              className="input w-20 py-1"
              type="number"
              min={0}
              value={value.years}
              onChange={(e) => onChange({ kind: "years", years: Number(e.target.value) })}
              aria-label="기간(년)"
            />
            <span className="text-sm text-ink-400">년 동안</span>
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        {value.kind === "life"
          ? "기본값입니다. 두 사람 중 먼저 끝나는 남은 수명까지 셉니다."
          : `결혼처럼 목표 시점이 있는 관계에 씁니다. 실제로 세는 기간 ${formatYears(countedYears)}` +
            (limitedByHorizon
              ? " — 목표 시점이 먼저 옵니다."
              : " — 목표 시점보다 수명이 먼저 끝나 그쪽이 기준입니다.")}
      </p>
    </div>
  );
}

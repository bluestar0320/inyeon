"use client";

import { useId } from "react";

import { resolveAge } from "@/lib/calc";
import { formatAge, formatYears } from "@/lib/format";
import { COUNTRIES, isEstimatedTable, lookupLifeExpectancy } from "@/lib/lifeExpectancy";
import type { LifeSpan, Sex } from "@/lib/types";

const SEXES: { value: Sex; label: string }[] = [
  { value: "all", label: "구분 없음" },
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
];

/**
 * 나이 + 예상 수명을 다루는 입력 묶음. 내 프로필과 인연 카드가 같은 규칙을 쓰므로
 * 한 컴포넌트로 공유한다. 국가/성별을 바꾸면 평균 수명이 따라오지만, 사용자가 직접
 * 손대는 순간(lifeExpectancyManual) 그 값을 존중하고 더는 덮어쓰지 않는다.
 */
export default function LifeSpanFields<T extends LifeSpan>({
  value,
  onChange,
  ageLabel = "나이",
}: {
  value: T;
  onChange: (next: T) => void;
  ageLabel?: string;
}) {
  const ids = useId();
  const age = resolveAge(value);
  const remaining = age === null ? null : Math.max(0, value.lifeExpectancy - age);
  // 예상 수명은 나이에 따라 달라진다. 이미 그 나이까지 살아온 사람은 일찍 떠난
  // 사람들이 끌어내린 출생 시 평균보다 더 오래 산다.
  const average = lookupLifeExpectancy(value.countryCode, value.sex, age);
  const estimated = isEstimatedTable(value.countryCode);

  function patch(changes: Partial<LifeSpan>): void {
    const next = { ...value, ...changes } as T;
    if (!next.lifeExpectancyManual) {
      next.lifeExpectancy = lookupLifeExpectancy(next.countryCode, next.sex, resolveAge(next));
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${ids}-birth`}>
            생년월일
          </label>
          <input
            id={`${ids}-birth`}
            className="input"
            type="date"
            value={value.birthDate ?? ""}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => patch({ birthDate: e.target.value || undefined })}
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {value.birthDate ? `현재 ${formatAge(age)}` : "모르면 비워 두고 나이만 입력하세요."}
          </p>
        </div>
        <div>
          <label className="label" htmlFor={`${ids}-age`}>
            {ageLabel}
          </label>
          <input
            id={`${ids}-age`}
            className="input"
            type="number"
            min={0}
            max={130}
            value={value.ageYears ?? ""}
            disabled={Boolean(value.birthDate)}
            placeholder="예: 60"
            onChange={(e) =>
              patch({ ageYears: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {value.birthDate ? "생년월일이 있으면 자동으로 계산됩니다." : "만 나이 기준"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${ids}-country`}>
            국가
          </label>
          <select
            id={`${ids}-country`}
            className="input"
            value={value.countryCode ?? ""}
            onChange={(e) => patch({ countryCode: e.target.value || undefined })}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="label">성별</span>
          <div className="flex gap-1.5" role="group" aria-label="성별">
            {SEXES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => patch({ sex: option.value })}
                className={`chip ${value.sex === option.value ? "chip-active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${ids}-expectancy`}>
          예상 수명
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`${ids}-expectancy`}
            className="input w-28"
            type="number"
            min={1}
            max={130}
            step="0.1"
            value={value.lifeExpectancy}
            onChange={(e) =>
              onChange({
                ...value,
                lifeExpectancy: Number(e.target.value),
                lifeExpectancyManual: true,
              } as T)
            }
          />
          <span className="text-sm text-ink-400">세</span>
          {value.lifeExpectancyManual && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() =>
                onChange({
                  ...value,
                  lifeExpectancy: average,
                  lifeExpectancyManual: false,
                } as T)
              }
            >
              통계값({average}세)으로 되돌리기
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
          {value.lifeExpectancyManual
            ? "직접 조정한 값입니다. 나이·국가·성별을 바꿔도 유지됩니다."
            : age === null
              ? "나이를 채우면 그 나이에 맞는 통계값이 적용됩니다. 언제든 직접 바꿀 수 있어요."
              : "생명표에서 이 나이·국가·성별에 맞는 값을 가져옵니다. 언제든 직접 바꿀 수 있어요."}
          {remaining !== null && ` · 남은 기간 약 ${formatYears(remaining)}`}
          {estimated && " · 이 나라는 이웃 나라 표를 조정한 근사치입니다."}
        </p>
      </div>
    </div>
  );
}

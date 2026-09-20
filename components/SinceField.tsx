"use client";

import { useId } from "react";

import { computePast } from "@/lib/calc";
import { formatCount, formatYears } from "@/lib/format";
import type { Frequency } from "@/lib/types";

/*
 * "언제부터" 입력.
 *
 * 태어난 날이 아니라 **지금 빈도가 시작된 때**를 받는다. 어머니를 38년 알았어도
 * 스무 해를 같이 살았다면 "월 1회 × 38년"은 틀린 숫자다. 독립한 해처럼 지금의
 * 리듬이 시작된 시점이라야 맞는다. 그 구분을 안내 문구에 적어 둔다.
 *
 * 비워 두면 "지금까지"를 아예 세지 않는다 — 모르는 것을 지어내지 않는다.
 */
export default function SinceField({
  value,
  frequency,
  onChange,
}: {
  value: string | undefined;
  frequency: Frequency;
  onChange: (next: string | undefined) => void;
}) {
  const id = useId();
  const past = computePast(frequency, value);

  return (
    <div>
      <label className="label" htmlFor={id}>
        언제부터 (선택)
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          className="input w-44"
          type="date"
          value={value ?? ""}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {value && (
          <button type="button" className="btn-quiet" onClick={() => onChange(undefined)}>
            지우기
          </button>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
        {past && past.count >= 1 ? (
          <>
            지금까지 약 <strong className="font-semibold text-ink-600">
              {formatCount(past.count)}번
            </strong>{" "}
            ({formatYears(past.years)} 동안). 어림값이라 설정에서 끌 수 있습니다.
          </>
        ) : (
          "지금 빈도로 만나기 시작한 때입니다. 태어난 날이 아니라, 지금의 리듬이 시작된 시점을 넣어야 맞습니다. 비워 두면 세지 않습니다."
        )}
      </p>
    </div>
  );
}

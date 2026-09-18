"use client";

import { useId } from "react";

import FrequencyInput from "@/components/FrequencyInput";
import type { GrowthResult } from "@/lib/calc";
import { formatCount, formatYears } from "@/lib/format";
import { DINNER_PRESETS } from "@/lib/presets";
import type { Frequency, GrowthSetup } from "@/lib/types";

const ADULT_AGES = [18, 19, 20];

function sameFrequency(a: Frequency, b: Frequency): boolean {
  return a.unit === b.unit && a.count === b.count;
}

export default function GrowthCalendar({
  name,
  setup,
  result,
  onChange,
  onDisable,
}: {
  name: string;
  setup: GrowthSetup;
  result: GrowthResult;
  onChange: (next: GrowthSetup) => void;
  onDisable: () => void;
}) {
  const ids = useId();

  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">성장 캘린더</p>
          <p className="mt-1 text-xs text-ink-400">
            {result.grownUp
              ? `${name}은(는) 이미 만 ${setup.adultAge}세를 넘었습니다.`
              : `${name}이(가) 만 ${setup.adultAge}세가 될 때까지 함께 보낼 수 있는 것들.`}
          </p>
        </div>
        <button type="button" className="btn-quiet shrink-0" onClick={onDisable}>
          끄기
        </button>
      </div>

      {result.yearsLeft === null ? (
        <p className="text-sm text-ink-400">나이나 생년월일을 채우면 계산됩니다.</p>
      ) : result.grownUp ? (
        <p className="rounded-xl bg-accent-50 px-3 py-2 text-xs text-accent-600">
          성인 나이를 더 뒤로 잡거나, 이 사람에게는 캘린더를 꺼 두세요.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-600">
            함께할 시간이 <span className="numeral">{formatYears(result.yearsLeft)}</span>{" "}
            남았습니다.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {result.items.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-ink-200/70 bg-white px-3 py-2.5"
              >
                <p className="text-[11px] text-ink-400">
                  {item.emoji} {item.label}
                </p>
                <p className="numeral mt-0.5 text-xl text-ink-800">
                  {formatCount(item.count)}
                  <span className="ml-0.5 text-xs font-normal text-ink-400">번</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="space-y-4 border-t border-ink-200/70 pt-4">
        <div>
          <label className="label" htmlFor={`${ids}-adult`}>
            성인으로 보는 나이
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${ids}-adult`}
              className="input w-20"
              type="number"
              min={1}
              max={40}
              value={setup.adultAge}
              onChange={(e) => onChange({ ...setup, adultAge: Number(e.target.value) })}
            />
            <span className="text-sm text-ink-400">세</span>
            {ADULT_AGES.map((age) => (
              <button
                key={age}
                type="button"
                className={`chip ${setup.adultAge === age ? "chip-active" : ""}`}
                onClick={() => onChange({ ...setup, adultAge: age })}
              >
                {age}세
              </button>
            ))}
          </div>
        </div>

        <div>
          <FrequencyInput
            label="함께하는 저녁 식사"
            value={setup.dinners}
            onChange={(dinners) => onChange({ ...setup, dinners })}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DINNER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`chip ${sameFrequency(setup.dinners, preset.frequency) ? "chip-active" : ""}`}
                onClick={() => onChange({ ...setup, dinners: preset.frequency })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-400">
          이 숫자들은 아이 나이만으로 정해집니다. 위의 조건 필터는 만남 횟수에만
          적용되고 캘린더에는 쓰지 않습니다 — 계절이나 생일에 배수를 곱하면 0.95번
          같은 값이 나오기 때문입니다.
        </p>
      </div>
    </div>
  );
}

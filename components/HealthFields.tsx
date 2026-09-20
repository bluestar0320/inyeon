"use client";

import { HEALTH_FACTORS, healthAgeOffset, healthBreakdown } from "@/lib/health";
import type { HealthProfile } from "@/lib/types";

/*
 * 생활 습관 입력.
 *
 * 기본은 접어 둔다. 이 앱은 첫 숫자를 30초 안에 봐야 하는데, 안 그래도 나이·국가·
 * 성별·수명을 받는 화면 아래에 칩 아홉 개를 더 펼쳐 두면 그 흐름이 깨진다.
 * <details>를 쓰는 이유는 접었다 펴는 데 자바스크립트도 상태도 필요 없고,
 * 키보드와 스크린 리더가 기본으로 이해하기 때문이다.
 *
 * 어떤 항목이 몇 년을 보탰는지 전부 드러낸다. 합계만 보여주면 사용자가 판단할 수
 * 없고, 근거가 약한 항목이 확실한 항목 뒤에 숨는다.
 */
export default function HealthFields({
  value,
  age,
  onChange,
}: {
  value: HealthProfile | undefined;
  /** 보정된 조회 나이를 같이 보여주기 위해 받는다. 모르면 생략한다. */
  age: number | null;
  onChange: (next: HealthProfile | undefined) => void;
}) {
  const offset = healthAgeOffset(value);
  const rows = healthBreakdown(value);

  function pick(key: (typeof HEALTH_FACTORS)[number]["key"], level: string): void {
    const next: HealthProfile = { ...value };
    // 고른 것을 다시 누르면 해제된다. 중립으로 돌아갈 길이 있어야 한다.
    if (next[key] === level) delete next[key];
    else next[key] = level as HealthProfile[typeof key];
    onChange(Object.keys(next).length === 0 ? undefined : next);
  }

  return (
    <details className="rounded-xl border border-ink-200 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-ink-800 marker:text-ink-400">
        생활 습관 반영하기
        <span className="ml-2 text-xs font-normal text-ink-400">
          {offset === 0 ? "선택 안 함" : `${offset > 0 ? "+" : ""}${offset}세로 조회`}
        </span>
      </summary>

      <div className="mt-4 space-y-4">
        {HEALTH_FACTORS.map((factor) => (
          <div key={factor.key}>
            <span className="label">{factor.label}</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={factor.label}>
              {factor.options.map((option) => (
                <button
                  key={option.level}
                  type="button"
                  aria-pressed={value?.[factor.key] === option.level}
                  className={`chip ${value?.[factor.key] === option.level ? "chip-active" : ""}`}
                  onClick={() => pick(factor.key, option.level)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{factor.basis}</p>
          </div>
        ))}

        {rows.length > 0 && (
          <div className="rounded-xl bg-ink-50 px-3 py-2.5">
            <ul className="space-y-1">
              {rows.map((row) => (
                <li key={row.key} className="flex justify-between gap-3 text-xs text-ink-600">
                  <span>
                    {row.label} · {row.optionLabel}
                  </span>
                  <span className="numeral">
                    {row.offsetYears > 0 ? "+" : ""}
                    {row.offsetYears}세
                  </span>
                </li>
              ))}
            </ul>
            {age !== null && (
              <p className="mt-2 border-t border-ink-200 pt-2 text-[11px] leading-relaxed text-ink-600">
                실제 만 {Math.floor(age)}세지만, 생명표는{" "}
                <strong className="font-semibold">만 {Math.floor(age) + offset}세</strong>로
                조회합니다. 나이를 바꾸는 게 아니라 &ldquo;위험이 그 나이대와 비슷하다&rdquo;고
                보는 것입니다.
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-ink-400">
          이 값은 출발점입니다. 맞지 않는다고 느끼면 위의 예상 수명을 직접 고치세요 —
          그쪽이 항상 우선합니다. 입력한 내용은 기기 안에만 있고 어디로도 보내지 않습니다.
        </p>
      </div>
    </details>
  );
}

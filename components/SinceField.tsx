"use client";

import { useId } from "react";

import { computePast } from "@/lib/calc";
import { formatCount, formatYears, todayISO } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import type { Frequency } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    label: "언제부터 (선택)",
    clear: "지우기",
    before: "지금까지 약 ",
    times: (n: string) => `${n}번`,
    after: (years: string) => ` (${years} 동안). 어림값이라 설정에서 끌 수 있습니다.`,
    hint: "지금 빈도로 만나기 시작한 때입니다. 태어난 날이 아니라, 지금의 리듬이 시작된 시점을 넣어야 맞습니다. 비워 두면 세지 않습니다.",
  },
  en: {
    label: "Since when (optional)",
    clear: "Clear",
    before: "About ",
    times: (n) => `${n} times`,
    after: (years) => ` so far (over ${years}). It's an estimate, so you can turn it off in Settings.`,
    hint: "When you started meeting this often. Not a birthday — the point when your current rhythm began. Leave it blank to skip this count.",
  },
  ja: {
    label: "いつから（任意）",
    clear: "消す",
    before: "これまでに約",
    times: (n) => `${n}回`,
    after: (years) => `（${years}の間）。概算なので設定でオフにできます。`,
    hint: "今の頻度で会い始めた時期です。生まれた日ではなく、今のリズムが始まった時点を入れてください。空けておくと数えません。",
  },
  es: {
    label: "Desde cuándo (opcional)",
    clear: "Borrar",
    before: "Hasta ahora, unas ",
    times: (n) => `${n} veces`,
    after: (years) => ` (en ${years}). Es una estimación; puedes desactivarla en Ajustes.`,
    hint: "Cuándo empezasteis a veros con esta frecuencia. No la fecha de nacimiento, sino el momento en que empezó vuestro ritmo actual. Si lo dejas en blanco, no se cuenta.",
  },
  zh: {
    label: "从何时开始（选填）",
    clear: "清除",
    before: "到目前为止大约",
    times: (n) => `${n}次`,
    after: (years) => `（${years}之间）。这是估算值，可以在设置中关闭。`,
    hint: "按现在的频率开始见面的时间。不是出生日期，而是现在这种节奏开始的时间点。留空则不计算。",
  },
});

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
  const t = tr(COPY);
  const id = useId();
  const past = computePast(frequency, value);

  return (
    <div>
      <label className="label" htmlFor={id}>
        {t.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          className="input w-44"
          type="date"
          value={value ?? ""}
          max={todayISO()}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {value && (
          <button type="button" className="btn-quiet" onClick={() => onChange(undefined)}>
            {t.clear}
          </button>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
        {past && past.count >= 1 ? (
          <>
            {t.before}
            <strong className="font-semibold text-ink-600">{t.times(formatCount(past.count))}</strong>
            {t.after(formatYears(past.years))}
          </>
        ) : (
          t.hint
        )}
      </p>
    </div>
  );
}

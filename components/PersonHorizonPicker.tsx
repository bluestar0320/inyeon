"use client";

import { useId } from "react";

import NumberInput from "@/components/NumberInput";
import { formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import type { PersonHorizon } from "@/lib/types";

const KINDS: PersonHorizon["kind"][] = ["life", "untilMyAge", "years"];

const COPY = defineCopy({
  ko: {
    kinds: { life: "남은 평생", untilMyAge: "내가 n세 될 때까지", years: "앞으로 n년" } as Record<
      PersonHorizon["kind"],
      string
    >,
    title: "언제까지 셀까요",
    targetAge: "목표 나이",
    ageUntil: "세까지",
    yearsLabel: "기간(년)",
    yearsFor: "년 동안",
    lifeHint: "기본값입니다. 두 사람 중 먼저 끝나는 남은 수명까지 셉니다.",
    targetHint: (years: string) => `결혼처럼 목표 시점이 있는 관계에 씁니다. 실제로 세는 기간 ${years}`,
    horizonFirst: " — 목표 시점이 먼저 옵니다.",
    lifeFirst: " — 목표 시점보다 수명이 먼저 끝나 그쪽이 기준입니다.",
  },
  en: {
    kinds: { life: "The rest of our lives", untilMyAge: "Until I turn n", years: "The next n years" },
    title: "How far ahead to count",
    targetAge: "Target age",
    ageUntil: "years old",
    yearsLabel: "Period (years)",
    yearsFor: "years",
    lifeHint: "The default. Counts until whichever of your two lifetimes ends first.",
    targetHint: (years) => `For relationships with a target date, like marriage. Counting ${years}`,
    horizonFirst: " — your target comes first.",
    lifeFirst: " — a lifetime ends before your target, so that sets the limit.",
  },
  ja: {
    kinds: { life: "これからずっと", untilMyAge: "自分がn歳になるまで", years: "これからn年" },
    title: "いつまで数えますか",
    targetAge: "目標の年齢",
    ageUntil: "歳まで",
    yearsLabel: "期間（年）",
    yearsFor: "年間",
    lifeHint: "初期設定です。二人のうち先に終わる残りの寿命まで数えます。",
    targetHint: (years) => `結婚のように目標の時点がある関係に使います。実際に数える期間は${years}`,
    horizonFirst: " — 目標の時点が先に来ます。",
    lifeFirst: " — 目標より先に寿命が終わるため、そちらが基準です。",
  },
  es: {
    kinds: { life: "El resto de la vida", untilMyAge: "Hasta que cumpla n", years: "Los próximos n años" },
    title: "Hasta cuándo contar",
    targetAge: "Edad objetivo",
    ageUntil: "años",
    yearsLabel: "Periodo (años)",
    yearsFor: "años",
    lifeHint: "Opción por defecto. Cuenta hasta que termine la vida que antes se acabe de las dos.",
    targetHint: (years) => `Para relaciones con una fecha objetivo, como el matrimonio. Periodo contado: ${years}`,
    horizonFirst: " — la fecha objetivo llega antes.",
    lifeFirst: " — una vida termina antes que la fecha objetivo, así que esa marca el límite.",
  },
  zh: {
    kinds: { life: "余生", untilMyAge: "到我n岁为止", years: "今后n年" },
    title: "计算到什么时候",
    targetAge: "目标年龄",
    ageUntil: "岁为止",
    yearsLabel: "期间（年）",
    yearsFor: "年内",
    lifeHint: "默认设置。计算到两人中先结束的剩余寿命为止。",
    targetHint: (years) => `用于像结婚这样有目标时间点的关系。实际计算期间为${years}`,
    horizonFirst: "——目标时间点先到来。",
    lifeFirst: "——寿命比目标时间点先结束，以此为准。",
  },
});

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
  const t = tr(COPY);
  const ids = useId();

  function pick(kind: PersonHorizon["kind"]): void {
    if (kind === "life") onChange({ kind: "life" });
    else if (kind === "untilMyAge")
      onChange({ kind: "untilMyAge", age: Math.ceil(((myAge ?? 30) + 5) / 5) * 5 });
    else onChange({ kind: "years", years: 5 });
  }

  return (
    <div>
      <span className="label">{t.title}</span>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.title}>
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`chip ${value.kind === kind ? "chip-active" : ""}`}
            onClick={() => pick(kind)}
          >
            {t.kinds[kind]}
          </button>
        ))}

        {value.kind === "untilMyAge" && (
          <span className="flex items-center gap-2">
            <NumberInput
              id={`${ids}-age`}
              className="input w-20 py-1"
              min={1}
              max={120}
              value={value.age}
              onChange={(age) => onChange({ kind: "untilMyAge", age })}
              aria-label={t.targetAge}
            />
            <span className="text-sm text-ink-400">{t.ageUntil}</span>
          </span>
        )}

        {value.kind === "years" && (
          <span className="flex items-center gap-2">
            <NumberInput
              id={`${ids}-years`}
              className="input w-20 py-1"
              min={1}
              max={150}
              value={value.years}
              onChange={(years) => onChange({ kind: "years", years })}
              aria-label={t.yearsLabel}
            />
            <span className="text-sm text-ink-400">{t.yearsFor}</span>
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        {value.kind === "life"
          ? t.lifeHint
          : t.targetHint(formatYears(countedYears)) + (limitedByHorizon ? t.horizonFirst : t.lifeFirst)}
      </p>
    </div>
  );
}

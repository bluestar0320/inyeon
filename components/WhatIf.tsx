"use client";

import { useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import { formatCount, formatFrequency } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { newId } from "@/lib/presets";
import { offerUndo } from "@/lib/undo";
import type { CalcFilter, Frequency, Scenario } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    defaultName: (frequency: string) => `${frequency}이라면`,
    title: "만약에",
    intro: "빈도와 조건을 바꿔 숫자가 어떻게 달라지는지 봅니다. 저장된 값은 그대로입니다.",
    frequency: "만약 이 빈도라면",
    compare: (now: string, saved: string) => `지금 ${now}번 · 저장된 값은 ${saved}번`,
    revert: "원래 값으로",
    removed: (label: string) => `시나리오 "${label}"을 지웠습니다.`,
    apply: "이대로 저장",
    namePlaceholder: "이름 (예: 매달 2번 만나면)",
    nameAria: "시나리오 이름",
    keep: "시나리오로 남기기",
    kept: "남겨 둔 시나리오",
    count: (n: string) => `${n}번`,
    removeAria: (label: string) => `${label} 지우기`,
    remove: "지우기",
  },
  en: {
    defaultName: (frequency) => `If ${frequency}`,
    title: "What if",
    intro: "Change the frequency and conditions to see how the number moves. Your saved values stay the same.",
    frequency: "What if it were",
    compare: (now, saved) => `Now ${now} · saved ${saved}`,
    revert: "Back to saved",
    removed: (label) => `Deleted scenario "${label}".`,
    apply: "Save this",
    namePlaceholder: "Name (e.g. twice a month)",
    nameAria: "Scenario name",
    keep: "Keep as scenario",
    kept: "Saved scenarios",
    count: (n) => `${n} ${n === "1" ? "time" : "times"}`,
    removeAria: (label) => `Remove ${label}`,
    remove: "Remove",
  },
  ja: {
    defaultName: (frequency) => `${frequency}なら`,
    title: "もしも",
    intro: "頻度や条件を変えると、数字がどう変わるかを見られます。保存した値はそのままです。",
    frequency: "もしこの頻度なら",
    compare: (now, saved) => `いま${now}回 · 保存した値は${saved}回`,
    revert: "保存した値に戻す",
    removed: (label) => `シナリオ「${label}」を削除しました。`,
    apply: "このまま保存",
    namePlaceholder: "名前(例：月に2回会えたら)",
    nameAria: "シナリオ名",
    keep: "シナリオとして残す",
    kept: "残したシナリオ",
    count: (n) => `${n}回`,
    removeAria: (label) => `${label}を削除`,
    remove: "削除",
  },
  es: {
    defaultName: (frequency) => `Si fuera ${frequency}`,
    title: "Y si…",
    intro: "Cambia la frecuencia y las condiciones para ver cómo varía el número. Lo guardado no cambia.",
    frequency: "Y si fuera con esta frecuencia",
    compare: (now, saved) => `Ahora ${now} · guardado ${saved}`,
    revert: "Volver a lo guardado",
    removed: (label) => `Escenario "${label}" eliminado.`,
    apply: "Guardar así",
    namePlaceholder: "Nombre (p. ej., dos veces al mes)",
    nameAria: "Nombre del escenario",
    keep: "Guardar como escenario",
    kept: "Escenarios guardados",
    count: (n) => `${n} ${n === "1" ? "vez" : "veces"}`,
    removeAria: (label) => `Quitar ${label}`,
    remove: "Quitar",
  },
  zh: {
    defaultName: (frequency) => `如果${frequency}`,
    title: "如果",
    intro: "改变频率和条件，看看数字会怎么变。已保存的数值不会改变。",
    frequency: "如果是这个频率",
    compare: (now, saved) => `现在${now}次 · 已保存的是${saved}次`,
    revert: "恢复保存值",
    removed: (label) => `已删除方案"${label}"。`,
    apply: "就这样保存",
    namePlaceholder: "名称（例：每月见2次）",
    nameAria: "方案名称",
    keep: "保存为方案",
    kept: "已保存的方案",
    count: (n) => `${n}次`,
    removeAria: (label) => `删除${label}`,
    remove: "删除",
  },
});

type Setup = { frequency: Frequency; filters: CalcFilter[] };

function same(a: Setup, b: Setup): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * "만약에"를 굴려 보는 자리. 인연과 순간 상세에서 같이 쓴다.
 *
 * 빈도와 조건을 바꾸면 위쪽 큰 숫자가 바로 따라 움직인다(상태는 부모가 쥔다).
 * 저장된 값은 건드리지 않는다. 마음에 드는 가정은 이름을 붙여 시나리오로 남겨 두고,
 * 나중에 기준과 나란히 비교하거나 다시 불러온다.
 */
export default function WhatIf({
  draft,
  onDraft,
  saved,
  totalFor,
  scenarios,
  onScenarios,
  onApply,
}: {
  draft: Setup;
  onDraft: (next: Setup) => void;
  saved: Setup;
  totalFor: (setup: Setup) => number;
  scenarios: Scenario[];
  onScenarios: (next: Scenario[]) => void;
  /** 지금 가정을 기준(저장된 값)으로 삼는다. */
  onApply: () => void;
}) {
  const t = tr(COPY);
  const [label, setLabel] = useState("");
  const simulating = !same(draft, saved);
  const base = totalFor(saved);

  function keep(): void {
    const name = label.trim() || t.defaultName(formatFrequency(draft.frequency));
    onScenarios([...scenarios, { id: newId(), label: name, ...draft }]);
    setLabel("");
  }

  return (
    <div className="card space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink-800">{t.title}</p>
        <p className="mt-1 text-xs text-ink-400">
          {t.intro}
        </p>
      </div>

      <FrequencyInput
        label={t.frequency}
        value={draft.frequency}
        onChange={(frequency) => onDraft({ ...draft, frequency })}
      />

      {simulating && (
        <div className="space-y-2 rounded-xl bg-accent-50 px-3 py-2.5">
          <p className="text-xs text-accent-600">
            {t.compare(formatCount(totalFor(draft)), formatCount(base))}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-quiet" onClick={() => onDraft(saved)}>
              {t.revert}
            </button>
            <button type="button" className="btn-quiet" onClick={onApply}>
              {t.apply}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={label}
              placeholder={t.namePlaceholder}
              aria-label={t.nameAria}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  keep();
                }
              }}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={keep}>
              {t.keep}
            </button>
          </div>
        </div>
      )}

      <FilterEditor filters={draft.filters} onChange={(filters) => onDraft({ ...draft, filters })} />

      {scenarios.length > 0 && (
        <div className="space-y-2 border-t border-ink-200/60 pt-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.kept}</p>
          <ul className="space-y-1.5">
            {scenarios.map((scenario) => {
              const total = totalFor(scenario);
              const diff = total - base;
              return (
                <li key={scenario.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-ink-50"
                    onClick={() => onDraft({ frequency: scenario.frequency, filters: scenario.filters })}
                  >
                    <span className="truncate text-sm text-ink-800">{scenario.label}</span>
                    <span className="shrink-0 text-sm">
                      <span className="numeral text-ink-900">{t.count(formatCount(total))}</span>
                      <span className="ml-1 text-xs text-ink-400">
                        ({diff >= 0 ? "+" : "−"}
                        {formatCount(Math.abs(diff))})
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-quiet shrink-0"
                    aria-label={t.removeAria(scenario.label)}
                    onClick={() => {
                      // 확인 없이 바로 지우는 대신, 다른 삭제처럼 잠깐 되돌릴 길을 남긴다.
                      const before = scenarios;
                      onScenarios(scenarios.filter((s) => s.id !== scenario.id));
                      offerUndo(t.removed(scenario.label), () => onScenarios(before));
                    }}
                  >
                    {t.remove}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

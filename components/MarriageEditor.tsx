"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import NumberInput from "@/components/NumberInput";
import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import ResultPanel from "@/components/ResultPanel";
import YearBreakdown from "@/components/YearBreakdown";
import { computeMarriage, resolveAge, toPerYear } from "@/lib/calc";
import { formatAge, formatCount, formatFrequency, formatInterval, formatYears } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { meetingFrequencyPresets } from "@/lib/presets";
import { emptyMarriage, useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { confirmLeave, useUnsavedGuard, leaveTo } from "@/lib/unsaved";
import type { Frequency, MarriagePlan } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    needProfile: "내 정보를 먼저 채우면 남은 기회가 계산됩니다.",
    passed: (age: string) => `이미 ${age}입니다. 목표 나이를 지금보다 뒤로 잡아 보세요.`,
    untilAge: (age: number) => `만 ${age}세까지`,
    timesUnit: "번",
    times: (n: string) => `${n}번`,
    fileName: "결혼계획",
    interval: "기회 간격",
    currentAge: "현재 나이",
    targetAge: "목표 나이",
    targetLabel: "목표 결혼 나이",
    ageUntil: "세까지",
    ageChip: (age: number) => `${age}세`,
    yearsToGo: (years: string) => `목표까지 ${years} 남았습니다.`,
    frequency: "새로운 사람을 만나는 빈도",
    frequencyHint: (n: string) =>
      `소개팅, 모임, 새 사람을 알게 되는 자리를 모두 포함해 잡으세요. 연간 ${n}번으로 계산됩니다.`,
    byYear: "연도별 추이",
    note: "메모 (선택)",
    save: "저장하기",
    create: "계획 만들기",
    cancel: "취소",
    remove: "삭제",
    removed: "결혼 계획을 지웠습니다.",
  },
  en: {
    loading: "Loading…",
    needProfile: "Fill in your details first to count the chances ahead.",
    passed: (age) => `You're already ${age}. Try setting a later target age.`,
    untilAge: (age) => `Until age ${age}`,
    timesUnit: "times",
    times: (n) => `${n} times`,
    fileName: "marriage-plan",
    interval: "Every",
    currentAge: "Current age",
    targetAge: "Target age",
    targetLabel: "Target age to marry",
    ageUntil: "years old",
    ageChip: (age) => `${age}`,
    yearsToGo: (years) => `${years} to go until your target.`,
    frequency: "How often you meet someone new",
    frequencyHint: (n) =>
      `Count blind dates, gatherings and anywhere you get to know someone new. That's ${n} times a year.`,
    byYear: "Year by year",
    note: "Note (optional)",
    save: "Save",
    create: "Create plan",
    cancel: "Cancel",
    remove: "Delete",
    removed: "Deleted your marriage plan.",
  },
  ja: {
    loading: "読み込み中…",
    needProfile: "先に自分の情報を入れると、残りの機会を計算します。",
    passed: (age) => `すでに${age}です。目標の年齢をもう少し先にしてみましょう。`,
    untilAge: (age) => `${age}歳まで`,
    timesUnit: "回",
    times: (n) => `${n}回`,
    fileName: "結婚計画",
    interval: "機会の間隔",
    currentAge: "現在の年齢",
    targetAge: "目標の年齢",
    targetLabel: "結婚したい年齢",
    ageUntil: "歳まで",
    ageChip: (age) => `${age}歳`,
    yearsToGo: (years) => `目標まであと${years}です。`,
    frequency: "新しい人に出会う頻度",
    frequencyHint: (n) =>
      `紹介、集まりなど、新しい人と知り合う場をすべて含めてください。年に${n}回として計算します。`,
    byYear: "年ごとの推移",
    note: "メモ（任意）",
    save: "保存する",
    create: "計画をつくる",
    cancel: "キャンセル",
    remove: "削除",
    removed: "結婚計画を削除しました。",
  },
  es: {
    loading: "Cargando…",
    needProfile: "Completa primero tus datos para contar las oportunidades.",
    passed: (age) => `Ya tienes ${age}. Prueba con una edad objetivo más adelante.`,
    untilAge: (age) => `Hasta los ${age}`,
    timesUnit: "veces",
    times: (n) => `${n} veces`,
    fileName: "plan-de-boda",
    interval: "Cada",
    currentAge: "Edad actual",
    targetAge: "Edad objetivo",
    targetLabel: "Edad a la que te gustaría casarte",
    ageUntil: "años",
    ageChip: (age) => `${age} años`,
    yearsToGo: (years) => `Faltan ${years} para tu objetivo.`,
    frequency: "Cada cuánto conoces a alguien nuevo",
    frequencyHint: (n) =>
      `Incluye citas, quedadas y cualquier ocasión de conocer a alguien. Se calcula como ${n} veces al año.`,
    byYear: "Año a año",
    note: "Nota (opcional)",
    save: "Guardar",
    create: "Crear plan",
    cancel: "Cancelar",
    remove: "Eliminar",
    removed: "Se eliminó el plan de boda.",
  },
  zh: {
    loading: "加载中…",
    needProfile: "先填写我的信息，就能算出剩余的机会。",
    passed: (age) => `你已经${age}了。试着把目标年龄往后调一调。`,
    untilAge: (age) => `到${age}岁为止`,
    timesUnit: "次",
    times: (n) => `${n}次`,
    fileName: "结婚计划",
    interval: "机会间隔",
    currentAge: "现在的年龄",
    targetAge: "目标年龄",
    targetLabel: "目标结婚年龄",
    ageUntil: "岁之前",
    ageChip: (age) => `${age}岁`,
    yearsToGo: (years) => `距离目标还有${years}。`,
    frequency: "认识新朋友的频率",
    frequencyHint: (n) => `相亲、聚会等所有能认识新朋友的场合都算上。按每年${n}次计算。`,
    byYear: "逐年变化",
    note: "备注（选填）",
    save: "保存",
    create: "创建计划",
    cancel: "取消",
    remove: "删除",
    removed: "已删除结婚计划。",
  },
});

function sameFrequency(a: Frequency, b: Frequency): boolean {
  return a.unit === b.unit && a.count === b.count;
}

export default function MarriageEditor() {
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const { saveMarriage, removeMarriage } = useActions();
  const t = tr(COPY);
  const ids = useId();

  const myAge = state.profile ? resolveAge(state.profile) : null;
  const [draft, setDraft] = useState<MarriagePlan>(() => emptyMarriage(null));
  const [loaded, setLoaded] = useState(false);

  // 저장된 계획(과 프로필 나이)은 하이드레이션 뒤에 들어오므로 한 번만 폼에 옮긴다.
  useEffect(() => {
    if (!hydrated || loaded) return;
    setDraft(state.marriage ?? emptyMarriage(myAge));
    setLoaded(true);
  }, [hydrated, loaded, state.marriage, myAge]);

  const copy = copyFor(state.settings.tone);
  const result = useMemo(
    () => computeMarriage(draft, state.profile),
    [draft, state.profile],
  );
  const saved = state.marriage !== null;
  const perYear = toPerYear(draft.frequency);

  // 폼을 채우기 전(loaded=false)에는 비교할 기준이 없으므로 묻지 않는다.
  const baseline = state.marriage ?? emptyMarriage(myAge);
  const dirty =
    loaded &&
    JSON.stringify({ ...baseline, updatedAt: "" }) !== JSON.stringify({ ...draft, updatedAt: "" });
  useUnsavedGuard(dirty);

  function leave(): void {
    if (!confirmLeave()) return;
    leaveTo(router, "/");
  }

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  // 목표 나이가 이미 지난 것과, 나이를 몰라 계산을 못 하는 것은 다른 상황이다.
  const unknownMessage =
    result.yearsLeft === null
      ? t.needProfile
      : result.targetPassed
        ? t.passed(formatAge(myAge))
        : undefined;

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.marriageLabel}
        result={result}
        sentence={copy.marriageSentence(
          draft.targetAge,
          formatCount(result.total),
        )}
        unknownMessage={unknownMessage}
        share={{
          emoji: "💍",
          title: t.untilAge(draft.targetAge),
          subtitle: copy.marriageLabel,
          value: formatCount(result.total),
          unit: t.timesUnit,
          caption: `${formatFrequency(draft.frequency)} · ${formatYears(result.yearsLeft)}`,
        }}
        shareFileName={[t.fileName, t.times(formatCount(result.total))]}
        stats={[
          { label: t.interval, value: formatInterval(result.intervalDays) },
          { label: t.currentAge, value: formatAge(myAge) },
          { label: t.targetAge, value: formatAge(draft.targetAge) },
        ]}
      />

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor={`${ids}-target`}>
            {t.targetLabel}
          </label>
          <div className="flex items-center gap-2">
            <NumberInput
              id={`${ids}-target`}
              className="input w-24"
              min={18}
              max={100}
              value={draft.targetAge}
              onChange={(targetAge) => setDraft({ ...draft, targetAge })}
            />
            <span className="text-sm text-ink-400">{t.ageUntil}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[30, 35, 40, 45].map((age) => (
              <button
                key={age}
                type="button"
                className={`chip ${draft.targetAge === age ? "chip-active" : ""}`}
                onClick={() => setDraft({ ...draft, targetAge: age })}
              >
                {t.ageChip(age)}
              </button>
            ))}
          </div>
          {/* 이미 지났으면 위에서 그렇게 말했다. "목표까지 0년"을 또 붙이지 않는다. */}
          {!result.targetPassed && (
            <p className="mt-2 text-[11px] text-ink-400">
              {t.yearsToGo(formatYears(result.yearsLeft))}
            </p>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label={t.frequency}
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />
        <div className="flex flex-wrap gap-1.5">
          {meetingFrequencyPresets().map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`chip ${sameFrequency(draft.frequency, preset.frequency) ? "chip-active" : ""}`}
              onClick={() => setDraft({ ...draft, frequency: preset.frequency })}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-ink-400">
          {t.frequencyHint(perYear.toFixed(perYear < 10 ? 1 : 0))}
        </p>
      </div>

      <div className="card">
        <FilterEditor
          filters={draft.filters}
          onChange={(filters) => setDraft({ ...draft, filters })}
        />
      </div>

      {/* 추이는 조건 바로 아래에 둔다. 위에 두면 입력 칸이 화면 밖으로 밀린다. */}
      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">{t.byYear}</p>
        <YearBreakdown slices={result.slices} />
      </div>

      <div className="card space-y-2">
        <label className="label" htmlFor={`${ids}-note`}>
          {t.note}
        </label>
        <textarea
          id={`${ids}-note`}
          className="input min-h-20"
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            saveMarriage({ ...draft, updatedAt: new Date().toISOString() });
            leaveTo(router, "/");
          }}
        >
          {saved ? t.save : t.create}
        </button>
        <button type="button" className="btn-secondary" onClick={leave}>
          {t.cancel}
        </button>
        {saved && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              const previous = state.marriage;
              removeMarriage();
              if (previous) {
                offerUndo(t.removed, () => saveMarriage(previous));
              }
              leaveTo(router, "/");
            }}
          >
            {t.remove}
          </button>
        )}
      </div>
    </div>
  );
}

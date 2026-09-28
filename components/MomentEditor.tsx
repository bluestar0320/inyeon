"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import ResultPanel from "@/components/ResultPanel";
import SinceField from "@/components/SinceField";
import YearBreakdown from "@/components/YearBreakdown";
import { computeMoment, resolveAge } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval, formatYears, josa } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { momentPresets } from "@/lib/presets";
import { momentFrom, useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { clearDirty, confirmLeave, useUnsavedGuard } from "@/lib/unsaved";
import { DAYS_PER_YEAR, toPerYear } from "@/lib/calc";
import type { Moment, MomentHorizon } from "@/lib/types";

const HORIZON_KINDS: MomentHorizon["kind"][] = ["life", "untilAge", "years"];

const COPY = defineCopy({
  ko: {
    horizon: { life: "남은 평생", untilAge: "특정 나이까지", years: "앞으로 n년" } as Record<MomentHorizon["kind"], string>,
    thisThing: "이 일",
    unknown: "내 정보를 먼저 채우면 남은 기간이 계산됩니다.",
    unit: "번",
    times: (n: string) => `${n}번`,
    interval: "간격",
    icon: "아이콘",
    whatToCount: "무엇을 세나요",
    titlePlaceholder: "벚꽃 보기",
    fromMine: "내가 넣은 것에서 시작하기",
    fromMineHint: "빈도·기간·조건을 그대로 가져옵니다. 이름만 고쳐서 쓰세요.",
    howOften: "얼마나 자주",
    until: "언제까지",
    targetAge: "목표 나이",
    untilAgeSuffix: "세까지",
    yearsLabel: "기간(년)",
    yearsSuffix: "년 동안",
    span: "계산 기간",
    byYear: "연도별 추이",
    note: "메모 (선택)",
    add: "추가하기",
    save: "저장하기",
    cancel: "취소",
    remove: "삭제",
    removed: (title: string) => `${josa(title, "을/를")} 지웠습니다.`,
  },
  en: {
    horizon: { life: "For life", untilAge: "Until an age", years: "For n years" },
    thisThing: "this",
    unknown: "Fill in your details first to see how much time is left.",
    unit: "times",
    times: (n) => `${n} ${n === "1" ? "time" : "times"}`,
    interval: "Every",
    icon: "Icon",
    whatToCount: "What are you counting?",
    titlePlaceholder: "Seeing cherry blossoms",
    fromMine: "Start from one of yours",
    fromMineHint: "Copies the frequency, time span and conditions. Just change the name.",
    howOften: "How often",
    until: "Until when",
    targetAge: "Target age",
    untilAgeSuffix: "years old",
    yearsLabel: "Years",
    yearsSuffix: "years",
    span: "Time span",
    byYear: "Year by year",
    note: "Note (optional)",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    remove: "Delete",
    removed: (title) => `Deleted ${title}.`,
  },
  ja: {
    horizon: { life: "これからずっと", untilAge: "ある年齢まで", years: "これからn年" },
    thisThing: "このこと",
    unknown: "自分の情報を入れると、残りの期間を計算できます。",
    unit: "回",
    times: (n) => `${n}回`,
    interval: "間隔",
    icon: "アイコン",
    whatToCount: "何を数えますか",
    titlePlaceholder: "お花見",
    fromMine: "登録したものから始める",
    fromMineHint: "頻度・期間・条件をそのまま使います。名前だけ変えてください。",
    howOften: "どのくらいの頻度で",
    until: "いつまで",
    targetAge: "目標の年齢",
    untilAgeSuffix: "歳まで",
    yearsLabel: "期間(年)",
    yearsSuffix: "年間",
    span: "計算期間",
    byYear: "年ごとの推移",
    note: "メモ(任意)",
    add: "追加する",
    save: "保存する",
    cancel: "キャンセル",
    remove: "削除",
    removed: (title) => `「${title}」を削除しました。`,
  },
  es: {
    horizon: { life: "Toda la vida", untilAge: "Hasta cierta edad", years: "Durante n años" },
    thisThing: "esto",
    unknown: "Completa tus datos para calcular el tiempo que queda.",
    unit: "veces",
    times: (n) => `${n} ${n === "1" ? "vez" : "veces"}`,
    interval: "Cada",
    icon: "Icono",
    whatToCount: "¿Qué quieres contar?",
    titlePlaceholder: "Ver los cerezos en flor",
    fromMine: "Empezar desde uno tuyo",
    fromMineHint: "Copia la frecuencia, el periodo y las condiciones. Solo cambia el nombre.",
    howOften: "Con qué frecuencia",
    until: "Hasta cuándo",
    targetAge: "Edad objetivo",
    untilAgeSuffix: "años",
    yearsLabel: "Años",
    yearsSuffix: "años",
    span: "Periodo",
    byYear: "Año por año",
    note: "Nota (opcional)",
    add: "Añadir",
    save: "Guardar",
    cancel: "Cancelar",
    remove: "Eliminar",
    removed: (title) => `Se eliminó ${title}.`,
  },
  zh: {
    horizon: { life: "余生", untilAge: "到某个年龄", years: "未来n年" },
    thisThing: "这件事",
    unknown: "先填好我的信息，就能算出剩下的时间。",
    unit: "次",
    times: (n) => `${n}次`,
    interval: "间隔",
    icon: "图标",
    whatToCount: "要数什么",
    titlePlaceholder: "赏樱花",
    fromMine: "从我添加过的开始",
    fromMineHint: "沿用频率、期间和条件，只需改个名字。",
    howOften: "多久一次",
    until: "到什么时候",
    targetAge: "目标年龄",
    untilAgeSuffix: "岁为止",
    yearsLabel: "期间（年）",
    yearsSuffix: "年内",
    span: "计算期间",
    byYear: "逐年变化",
    note: "备注（可选）",
    add: "添加",
    save: "保存",
    cancel: "取消",
    remove: "删除",
    removed: (title) => `已删除“${title}”。`,
  },
});

export default function MomentEditor({ initial }: { initial: Moment }) {
  const router = useRouter();
  const { state } = useAppState();
  const { saveMoment, removeMoment } = useActions();
  const ids = useId();
  const [draft, setDraft] = useState<Moment>(initial);
  // 프리셋 안내 문구. 화면에만 뜨고 사용자의 메모에는 저장하지 않는다.
  const [hint, setHint] = useState<string | null>(null);

  const t = tr(COPY);
  const copy = copyFor(state.settings.tone);
  const result = useMemo(() => computeMoment(draft, state.profile), [draft, state.profile]);
  const isNew = !state.moments.some((m) => m.id === draft.id);
  // 최근에 넣은 것부터. 너무 많으면 칩이 벽이 되므로 여덟 개까지만 보여준다.
  const mine = useMemo(
    () =>
      isNew
        ? [...state.moments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8)
        : [],
    [state.moments, isNew],
  );
  const title = draft.title.trim() || t.thisThing;
  const myAge = state.profile ? resolveAge(state.profile) : null;
  const perYear = toPerYear(draft.frequency);

  function setHorizon(kind: MomentHorizon["kind"]): void {
    if (kind === "life") setDraft({ ...draft, horizon: { kind: "life" } });
    else if (kind === "untilAge")
      setDraft({ ...draft, horizon: { kind: "untilAge", age: Math.ceil((myAge ?? 30) / 10) * 10 + 10 } });
    else setDraft({ ...draft, horizon: { kind: "years", years: 10 } });
  }

  const saved = state.moments.find((m) => m.id === draft.id);
  const dirty = saved
    ? JSON.stringify({ ...saved, updatedAt: "" }) !== JSON.stringify({ ...draft, updatedAt: "" })
    : draft.title.trim() !== "" || draft.filters.length > 0;
  useUnsavedGuard(dirty);

  // 고치던 중이었다면 보던 화면으로 돌려보낸다. 목록으로 튕기면 방금 고친 것을
  // 다시 찾아 들어가야 한다.
  const backTo = isNew ? "/moments" : `/moments/detail?id=${draft.id}`;

  function leave(): void {
    if (!confirmLeave()) return;
    clearDirty();
    router.push(backTo);
  }

  function save(): void {
    saveMoment({ ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() });
    clearDirty();
    router.push(backTo);
  }

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.momentLabel}
        result={result}
        sentence={copy.momentSentence(title, Math.round(result.total).toLocaleString(locale()))}
        unknownMessage={result.horizonYears === null ? t.unknown : undefined}
        share={{
          // 목록에서는 "◦"로 자리를 채우지만 카드에서는 비워 둔다. 빈 동그라미가
          // 크게 찍히면 뜻 없는 자국이 된다.
          emoji: draft.emoji,
          title,
          subtitle: copy.momentLabel,
          value: formatCount(result.total),
          unit: t.unit,
          caption: `${formatFrequency(draft.frequency)} · ${formatYears(result.horizonYears)}`,
        }}
        shareFileName={[title, t.times(formatCount(result.total))]}
        stats={[{ label: t.interval, value: formatInterval(perYear > 0 ? DAYS_PER_YEAR / perYear : null) }]}
      />

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
          <div>
            <label className="label" htmlFor={`${ids}-emoji`}>
              {t.icon}
            </label>
            <input
              id={`${ids}-emoji`}
              className="input text-center"
              maxLength={4}
              value={draft.emoji ?? ""}
              placeholder="🌸"
              onChange={(e) => setDraft({ ...draft, emoji: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${ids}-title`}>
              {t.whatToCount}
            </label>
            <input
              id={`${ids}-title`}
              className="input"
              value={draft.title}
              placeholder={t.titlePlaceholder}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {momentPresets().map((preset) => (
            <button
              key={preset.title}
              type="button"
              className="chip"
              onClick={() => {
                setHint(preset.hint ?? null);
                setDraft({
                  ...draft,
                  title: preset.title,
                  emoji: preset.emoji,
                  frequency: preset.frequency,
                  horizon: preset.horizon,
                });
              }}
            >
              {preset.emoji} {preset.title}
            </button>
          ))}
        </div>

        {/*
          내가 이미 넣은 것들이 곧 내 프리셋이다.
          강아지별로, 장소별로, 공방별로 — 같은 것의 변주를 반복해서 넣게 되는데
          매번 빈도와 기간을 다시 고르는 건 같은 일을 두 번 하는 것이다.
          따로 저장해 두고 관리하는 목록을 만들지 않는 이유는, 그러면 지우고
          이름 고치는 화면이 또 필요해지기 때문이다. 쓰던 것이 저절로 프리셋이 된다.
        */}
        {isNew && mine.length > 0 && (
          <div className="border-t border-ink-200/60 pt-3">
            <p className="label">{t.fromMine}</p>
            <div className="flex flex-wrap gap-1.5">
              {mine.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setHint(null);
                    setDraft({
                      ...momentFrom(moment),
                      id: draft.id,
                      note: draft.note,
                    });
                  }}
                >
                  {moment.emoji ?? "◦"} {moment.title}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-400">{t.fromMineHint}</p>
          </div>
        )}

        {hint && <p className="text-xs text-accent-600">{hint}</p>}
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label={t.howOften}
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />

        <SinceField
          value={draft.since}
          frequency={draft.frequency}
          onChange={(since) => setDraft({ ...draft, since })}
        />

        <div>
          <span className="label">{t.until}</span>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.until}>
            {HORIZON_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`chip ${draft.horizon.kind === kind ? "chip-active" : ""}`}
                onClick={() => setHorizon(kind)}
              >
                {t.horizon[kind]}
              </button>
            ))}

            {draft.horizon.kind === "untilAge" && (
              <span className="flex items-center gap-2">
                <input
                  className="input w-20 py-1"
                  type="number"
                  min={0}
                  max={130}
                  value={draft.horizon.age}
                  onChange={(e) =>
                    setDraft({ ...draft, horizon: { kind: "untilAge", age: Number(e.target.value) } })
                  }
                  aria-label={t.targetAge}
                />
                <span className="text-sm text-ink-400">{t.untilAgeSuffix}</span>
              </span>
            )}

            {draft.horizon.kind === "years" && (
              <span className="flex items-center gap-2">
                <input
                  className="input w-20 py-1"
                  type="number"
                  min={0}
                  value={draft.horizon.years}
                  onChange={(e) =>
                    setDraft({ ...draft, horizon: { kind: "years", years: Number(e.target.value) } })
                  }
                  aria-label={t.yearsLabel}
                />
                <span className="text-sm text-ink-400">{t.yearsSuffix}</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-ink-400">
            {t.span}: {formatYears(result.horizonYears)}
          </p>
        </div>
      </div>

      <div className="card">
        <FilterEditor filters={draft.filters} onChange={(filters) => setDraft({ ...draft, filters })} />
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
        <button type="button" className="btn-primary" onClick={save} disabled={!draft.title.trim()}>
          {isNew ? t.add : t.save}
        </button>
        <button type="button" className="btn-secondary" onClick={leave}>
          {t.cancel}
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              removeMoment(draft.id);
              if (saved) {
                offerUndo(t.removed(saved.title), () => saveMoment(saved));
              }
              clearDirty();
              router.push("/moments");
            }}
          >
            {t.remove}
          </button>
        )}
      </div>
    </div>
  );
}

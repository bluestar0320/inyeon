"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import ResultPanel from "@/components/ResultPanel";
import SinceField from "@/components/SinceField";
import YearBreakdown from "@/components/YearBreakdown";
import { computeMoment, resolveAge } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval, formatYears } from "@/lib/format";
import { MOMENT_PRESETS } from "@/lib/presets";
import { momentFrom, useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { clearDirty, confirmLeave, useUnsavedGuard } from "@/lib/unsaved";
import { DAYS_PER_YEAR, toPerYear } from "@/lib/calc";
import type { Moment, MomentHorizon } from "@/lib/types";

const HORIZON_KINDS: { kind: MomentHorizon["kind"]; label: string }[] = [
  { kind: "life", label: "남은 평생" },
  { kind: "untilAge", label: "특정 나이까지" },
  { kind: "years", label: "앞으로 n년" },
];

export default function MomentEditor({ initial }: { initial: Moment }) {
  const router = useRouter();
  const { state } = useAppState();
  const { saveMoment, removeMoment } = useActions();
  const ids = useId();
  const [draft, setDraft] = useState<Moment>(initial);
  // 프리셋 안내 문구. 화면에만 뜨고 사용자의 메모에는 저장하지 않는다.
  const [hint, setHint] = useState<string | null>(null);

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
  const title = draft.title.trim() || "이 일";
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
        sentence={copy.momentSentence(title, Math.round(result.total).toLocaleString("ko-KR"))}
        unknownMessage={
          result.horizonYears === null
            ? "내 정보를 먼저 채우면 남은 기간이 계산됩니다."
            : undefined
        }
        share={{
          // 목록에서는 "◦"로 자리를 채우지만 카드에서는 비워 둔다. 빈 동그라미가
          // 크게 찍히면 뜻 없는 자국이 된다.
          emoji: draft.emoji,
          title,
          subtitle: copy.momentLabel,
          value: formatCount(result.total),
          unit: "번",
          caption: `${formatFrequency(draft.frequency)} · ${formatYears(result.horizonYears)}`,
        }}
        shareFileName={[title, `${formatCount(result.total)}번`]}
        stats={[{ label: "간격", value: formatInterval(perYear > 0 ? DAYS_PER_YEAR / perYear : null) }]}
      />

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
          <div>
            <label className="label" htmlFor={`${ids}-emoji`}>
              아이콘
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
              무엇을 세나요
            </label>
            <input
              id={`${ids}-title`}
              className="input"
              value={draft.title}
              placeholder="벚꽃 보기"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MOMENT_PRESETS.map((preset) => (
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
            <p className="label">내가 넣은 것에서 시작하기</p>
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
            <p className="mt-1 text-[11px] text-ink-400">
              빈도·기간·조건을 그대로 가져옵니다. 이름만 고쳐서 쓰세요.
            </p>
          </div>
        )}

        {hint && <p className="text-xs text-accent-600">{hint}</p>}
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label="얼마나 자주"
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />

        <SinceField
          value={draft.since}
          frequency={draft.frequency}
          onChange={(since) => setDraft({ ...draft, since })}
        />

        <div>
          <span className="label">언제까지</span>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="언제까지">
            {HORIZON_KINDS.map((option) => (
              <button
                key={option.kind}
                type="button"
                className={`chip ${draft.horizon.kind === option.kind ? "chip-active" : ""}`}
                onClick={() => setHorizon(option.kind)}
              >
                {option.label}
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
                  aria-label="목표 나이"
                />
                <span className="text-sm text-ink-400">세까지</span>
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
                  aria-label="기간(년)"
                />
                <span className="text-sm text-ink-400">년 동안</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-ink-400">
            계산 기간: {formatYears(result.horizonYears)}
          </p>
        </div>
      </div>

      <div className="card">
        <FilterEditor filters={draft.filters} onChange={(filters) => setDraft({ ...draft, filters })} />
      </div>

      {/* 추이는 조건 바로 아래에 둔다. 위에 두면 입력 칸이 화면 밖으로 밀린다. */}
      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">연도별 추이</p>
        <YearBreakdown slices={result.slices} />
      </div>

      <div className="card space-y-2">
        <label className="label" htmlFor={`${ids}-note`}>
          메모 (선택)
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
          {isNew ? "추가하기" : "저장하기"}
        </button>
        <button type="button" className="btn-secondary" onClick={leave}>
          취소
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              removeMoment(draft.id);
              if (saved) {
                offerUndo(`${saved.title}을(를) 지웠습니다.`, () => saveMoment(saved));
              }
              clearDirty();
              router.push("/moments");
            }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

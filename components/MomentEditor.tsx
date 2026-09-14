"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import ResultPanel from "@/components/ResultPanel";
import { computeMoment, resolveAge } from "@/lib/calc";
import { formatInterval, formatYears } from "@/lib/format";
import { MOMENT_PRESETS } from "@/lib/presets";
import { useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
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

  const copy = copyFor(state.settings.tone);
  const result = useMemo(() => computeMoment(draft, state.profile), [draft, state.profile]);
  const isNew = !state.moments.some((m) => m.id === draft.id);
  const title = draft.title.trim() || "이 일";
  const myAge = state.profile ? resolveAge(state.profile) : null;
  const perYear = toPerYear(draft.frequency);

  function setHorizon(kind: MomentHorizon["kind"]): void {
    if (kind === "life") setDraft({ ...draft, horizon: { kind: "life" } });
    else if (kind === "untilAge")
      setDraft({ ...draft, horizon: { kind: "untilAge", age: Math.ceil((myAge ?? 30) / 10) * 10 + 10 } });
    else setDraft({ ...draft, horizon: { kind: "years", years: 10 } });
  }

  function save(): void {
    saveMoment({ ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() });
    router.push("/moments");
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
              onClick={() =>
                setDraft({
                  ...draft,
                  title: preset.title,
                  emoji: preset.emoji,
                  frequency: preset.frequency,
                  horizon: preset.horizon,
                  note: preset.note ?? draft.note,
                })
              }
            >
              {preset.emoji} {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label="얼마나 자주"
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
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
        <button type="button" className="btn-secondary" onClick={() => router.push("/moments")}>
          취소
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              removeMoment(draft.id);
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

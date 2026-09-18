"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import ResultPanel from "@/components/ResultPanel";
import { computeMarriage, resolveAge, toPerYear } from "@/lib/calc";
import { formatAge, formatInterval, formatYears } from "@/lib/format";
import { MEETING_FREQUENCY_PRESETS } from "@/lib/presets";
import { emptyMarriage, useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import type { Frequency, MarriagePlan } from "@/lib/types";

function sameFrequency(a: Frequency, b: Frequency): boolean {
  return a.unit === b.unit && a.count === b.count;
}

export default function MarriageEditor() {
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const { saveMarriage, removeMarriage } = useActions();
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

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  // 목표 나이가 이미 지난 것과, 나이를 몰라 계산을 못 하는 것은 다른 상황이다.
  const unknownMessage =
    result.yearsLeft === null
      ? "내 정보를 먼저 채우면 남은 기회가 계산됩니다."
      : result.targetPassed
        ? `이미 ${formatAge(myAge)}입니다. 목표 나이를 지금보다 뒤로 잡아 보세요.`
        : undefined;

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.marriageLabel}
        result={result}
        sentence={copy.marriageSentence(
          draft.targetAge,
          Math.round(result.total).toLocaleString("ko-KR"),
        )}
        unknownMessage={unknownMessage}
        stats={[
          { label: "기회 간격", value: formatInterval(result.intervalDays) },
          { label: "현재 나이", value: formatAge(myAge) },
          { label: "목표 나이", value: `만 ${draft.targetAge}세` },
        ]}
      />

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor={`${ids}-target`}>
            목표 결혼 나이
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${ids}-target`}
              className="input w-24"
              type="number"
              min={18}
              max={100}
              value={draft.targetAge}
              onChange={(e) => setDraft({ ...draft, targetAge: Number(e.target.value) })}
            />
            <span className="text-sm text-ink-400">세까지</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[30, 35, 40, 45].map((age) => (
              <button
                key={age}
                type="button"
                className={`chip ${draft.targetAge === age ? "chip-active" : ""}`}
                onClick={() => setDraft({ ...draft, targetAge: age })}
              >
                {age}세
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-400">
            목표까지 {formatYears(result.yearsLeft)} 남았습니다.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label="새로운 사람을 만나는 빈도"
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />
        <div className="flex flex-wrap gap-1.5">
          {MEETING_FREQUENCY_PRESETS.map((preset) => (
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
          소개팅, 모임, 새 사람을 알게 되는 자리를 모두 포함해 잡으세요. 연간{" "}
          {perYear.toFixed(perYear < 10 ? 1 : 0)}번으로 계산됩니다.
        </p>
      </div>

      <div className="card">
        <FilterEditor
          filters={draft.filters}
          onChange={(filters) => setDraft({ ...draft, filters })}
        />
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
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            saveMarriage({ ...draft, updatedAt: new Date().toISOString() });
            router.push("/");
          }}
        >
          {saved ? "저장하기" : "계획 만들기"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push("/")}>
          취소
        </button>
        {saved && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              const saved = state.marriage;
              removeMarriage();
              if (saved) {
                offerUndo("결혼 계획을 지웠습니다.", () => saveMarriage(saved));
              }
              router.push("/");
            }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

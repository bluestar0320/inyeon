"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import LifeSpanFields from "@/components/LifeSpanFields";
import ResultPanel from "@/components/ResultPanel";
import { computeRelationship } from "@/lib/calc";
import { formatDays, formatInterval, formatYears } from "@/lib/format";
import { RELATION_PRESETS } from "@/lib/presets";
import { useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import type { Person } from "@/lib/types";

export default function PersonEditor({ initial }: { initial: Person }) {
  const router = useRouter();
  const { state } = useAppState();
  const { savePerson, removePerson } = useActions();
  const ids = useId();
  const [draft, setDraft] = useState<Person>(initial);

  const copy = copyFor(state.settings.tone);
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile],
  );
  const isNew = !state.people.some((p) => p.id === draft.id);
  const nameForCopy = draft.name.trim() || draft.relation || "이 사람";
  const ageMissing = result.theirYears === null;

  function save(): void {
    savePerson({ ...draft, name: draft.name.trim() || nameForCopy, updatedAt: new Date().toISOString() });
    router.push("/people");
  }

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        sentence={copy.meetingSentence(nameForCopy, Math.round(result.total).toLocaleString("ko-KR"))}
        unknownMessage={
          ageMissing ? "나이나 생년월일을 채우면 남은 만남이 계산됩니다." : undefined
        }
        stats={[
          { label: "만남 간격", value: formatInterval(result.intervalDays) },
          {
            label: "함께 보낼 시간",
            value: result.togetherDays === null ? "-" : formatDays(result.togetherDays),
            sub: result.togetherDays === null ? "1회 시간 입력 시" : undefined,
          },
          { label: "내 남은 시간", value: formatYears(result.myYears) },
          { label: `${nameForCopy} 남은 시간`, value: formatYears(result.theirYears) },
        ]}
      />

      {!ageMissing && (
        <p className="px-1 text-xs text-ink-400">{copy.limitedBySentence(result.limitedBy, nameForCopy)}</p>
      )}

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`${ids}-name`}>
              이름
            </label>
            <input
              id={`${ids}-name`}
              className="input"
              value={draft.name}
              placeholder="어머니"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${ids}-relation`}>
              관계
            </label>
            <input
              id={`${ids}-relation`}
              className="input"
              value={draft.relation ?? ""}
              placeholder="가족, 친구 …"
              onChange={(e) => setDraft({ ...draft, relation: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {RELATION_PRESETS.map((preset) => (
            <button
              key={preset.relation}
              type="button"
              className="chip"
              onClick={() =>
                setDraft({
                  ...draft,
                  relation: preset.relation,
                  emoji: preset.emoji,
                  name: draft.name || preset.relation,
                  frequency: preset.frequency,
                  hoursPerMeeting: preset.hoursPerMeeting,
                })
              }
            >
              {preset.emoji} {preset.relation}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel="나이" />
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label="얼마나 자주 만나나요"
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />
        <div>
          <label className="label" htmlFor={`${ids}-hours`}>
            한 번 만나면 몇 시간 (선택)
          </label>
          <input
            id={`${ids}-hours`}
            className="input w-28"
            type="number"
            min={0}
            step="0.5"
            value={draft.hoursPerMeeting ?? ""}
            placeholder="예: 6"
            onChange={(e) =>
              setDraft({
                ...draft,
                hoursPerMeeting: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
          <p className="mt-1 text-[11px] text-ink-400">
            채우면 남은 만남을 합쳐 실제로 몇 시간이 남았는지 보여줍니다.
          </p>
        </div>
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
        <button type="button" className="btn-primary" onClick={save} disabled={!draft.name.trim()}>
          {isNew ? "추가하기" : "저장하기"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push("/people")}>
          취소
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              removePerson(draft.id);
              router.push("/people");
            }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

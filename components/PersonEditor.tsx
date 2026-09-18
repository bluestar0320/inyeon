"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import GrowthCalendar from "@/components/GrowthCalendar";
import LifeSpanFields from "@/components/LifeSpanFields";
import PersonHorizonPicker from "@/components/PersonHorizonPicker";
import ResultPanel from "@/components/ResultPanel";
import { computeGrowth, computeRelationship, resolveAge } from "@/lib/calc";
import { formatDays, formatInterval, formatYears } from "@/lib/format";
import { RELATION_PRESETS } from "@/lib/presets";
import { useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { clearDirty, confirmLeave, useUnsavedGuard } from "@/lib/unsaved";
import type { GrowthSetup, Person } from "@/lib/types";

function defaultGrowth(): GrowthSetup {
  return { adultAge: 20, dinners: { count: 5, unit: "week" } };
}

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

  const growth = useMemo(() => computeGrowth(draft), [draft]);
  // 아직 어린 사람이면 캘린더를 먼저 권한다. 켜는 건 어디까지나 사용자가 정한다.
  const theirAge = resolveAge(draft);
  const suggestGrowth = theirAge !== null && theirAge < 20;

  // 새로 만드는 중이면 이름을 한 글자라도 적은 순간부터, 고치는 중이면 저장된
  // 값과 달라진 순간부터 "안 저장됨"으로 본다. updatedAt은 저장할 때만 바뀌므로
  // 비교에서 뺀다.
  const saved = state.people.find((p) => p.id === draft.id);
  const dirty = saved
    ? JSON.stringify({ ...saved, updatedAt: "" }) !== JSON.stringify({ ...draft, updatedAt: "" })
    : draft.name.trim() !== "" || draft.filters.length > 0;
  useUnsavedGuard(dirty);

  function leave(to: string): void {
    if (!confirmLeave()) return;
    clearDirty();
    router.push(to);
  }

  function save(): void {
    savePerson({ ...draft, name: draft.name.trim() || nameForCopy, updatedAt: new Date().toISOString() });
    clearDirty();
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
                  // 자녀 프리셋은 성장 캘린더까지 한 번에 켠다. 이미 켜 둔 설정은 건드리지 않는다.
                  growth: preset.withGrowth ? (draft.growth ?? defaultGrowth()) : draft.growth,
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
        <PersonHorizonPicker
          value={draft.horizon ?? { kind: "life" }}
          myAge={resolveAge(state.profile ?? {})}
          countedYears={result.sharedYears}
          limitedByHorizon={result.limitedBy === "horizon"}
          onChange={(horizon) =>
            setDraft({ ...draft, horizon: horizon.kind === "life" ? undefined : horizon })
          }
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

      {growth !== null && draft.growth ? (
        <GrowthCalendar
          name={nameForCopy}
          setup={draft.growth}
          result={growth}
          onChange={(setup) => setDraft({ ...draft, growth: setup })}
          onDisable={() => setDraft({ ...draft, growth: undefined })}
        />
      ) : (
        <button
          type="button"
          className="card flex w-full items-center justify-between border-dashed text-left transition hover:border-ink-400"
          onClick={() => setDraft({ ...draft, growth: defaultGrowth() })}
        >
          <span>
            <span className="block text-sm font-semibold text-ink-800">성장 캘린더 켜기</span>
            <span className="mt-1 block text-xs text-ink-400">
              {suggestGrowth
                ? `${nameForCopy}이(가) 성인이 될 때까지 함께 보낼 계절·방학·저녁 식사를 세어 봅니다.`
                : "자녀처럼 성인이 되기까지 시간이 남은 경우에 씁니다."}
            </span>
          </span>
          <span className="shrink-0 pl-3 text-xl">🧸</span>
        </button>
      )}

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
        <button type="button" className="btn-secondary" onClick={() => leave("/people")}>
          취소
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              // 지우는 건 저장된 쪽이지 편집 중인 draft가 아니다. 되돌릴 때도
              // 사용자가 마지막으로 저장한 모습 그대로 살아나야 한다.
              removePerson(draft.id);
              if (saved) {
                offerUndo(`${saved.name}을(를) 지웠습니다.`, () => savePerson(saved));
              }
              // 지우기로 한 이상 편집 중이던 내용은 물어볼 것이 없다.
              clearDirty();
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

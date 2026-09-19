"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import GrowthCalendar from "@/components/GrowthCalendar";
import ResultPanel from "@/components/ResultPanel";
import YearBreakdown from "@/components/YearBreakdown";
import { computeGrowth, computeRelationship, resolveAge } from "@/lib/calc";
import {
  formatAge,
  formatCount,
  formatDays,
  formatFrequency,
  formatInterval,
  formatYears,
} from "@/lib/format";
import { useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import type { CalcFilter, Person } from "@/lib/types";

/** 저장된 값과 지금 화면의 조건이 다른지. 다르면 "시뮬레이션 중"으로 본다. */
function sameFilters(a: CalcFilter[], b: CalcFilter[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-ink-400">{label}</span>
      <span className="text-right text-sm text-ink-800">{value}</span>
    </div>
  );
}

/**
 * 저장된 인연을 보는 화면.
 *
 * 입력 칸을 늘 펼쳐 두면 볼 때마다 고칠 수 있어서 화면이 조잡해지고, 정작 이 앱의
 * 주인공인 "숫자"가 폼에 파묻힌다. 그래서 여기서는 값을 읽기로 보여주고,
 * 조건을 바꿔 가며 숫자가 어떻게 움직이는지 보는 일만 열어 둔다.
 * 실제 수정은 수정하기 버튼으로 따로 들어간다.
 */
export default function PersonView({ person }: { person: Person }) {
  const router = useRouter();
  const { state } = useAppState();
  const { savePerson, removePerson } = useActions();
  const copy = copyFor(state.settings.tone);

  // 조건은 여기서 마음껏 바꿔 본다. 저장은 따로 눌러야 한다.
  const [filters, setFilters] = useState<CalcFilter[]>(person.filters);
  const simulating = !sameFilters(filters, person.filters);

  const draft = useMemo(() => ({ ...person, filters }), [person, filters]);
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile],
  );
  const saved = useMemo(
    () => computeRelationship(person, state.profile),
    [person, state.profile],
  );
  const growth = useMemo(() => computeGrowth(person), [person]);

  const age = resolveAge(person);
  const horizonText =
    !person.horizon || person.horizon.kind === "life"
      ? "남은 평생"
      : person.horizon.kind === "untilMyAge"
        ? `내가 ${person.horizon.age}세 될 때까지`
        : `앞으로 ${person.horizon.years}년`;

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        sentence={copy.meetingSentence(person.name, Math.round(result.total).toLocaleString("ko-KR"))}
        share={{
          emoji: person.emoji ?? "🫧",
          title: person.name,
          subtitle: copy.meetingLabel,
          value: formatCount(result.total),
          unit: "번",
          caption: `${formatFrequency(person.frequency)} · ${formatYears(result.sharedYears)}`,
        }}
        shareFileName={[person.name, `${formatCount(result.total)}번`]}
        stats={[
          { label: "만남 간격", value: formatInterval(result.intervalDays) },
          {
            label: "함께 보낼 시간",
            value: result.togetherDays === null ? "-" : formatDays(result.togetherDays),
          },
          { label: "내 남은 시간", value: formatYears(result.myYears) },
          { label: `${person.name} 남은 시간`, value: formatYears(result.theirYears) },
        ]}
      />

      <p className="px-1 text-xs text-ink-400">
        {copy.limitedBySentence(result.limitedBy, person.name)}
      </p>

      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-800">
              {person.emoji ?? "🫧"} {person.name}
            </p>
            {person.relation && <p className="mt-0.5 text-xs text-ink-400">{person.relation}</p>}
          </div>
          <Link href={`/people/edit?id=${person.id}`} className="btn-secondary shrink-0">
            수정하기
          </Link>
        </div>

        <div className="mt-3 divide-y divide-ink-200/60 border-t border-ink-200/60 pt-1">
          <Row label="나이" value={formatAge(age)} />
          <Row label="예상 수명" value={`만 ${person.lifeExpectancy}세`} />
          <Row label="만나는 빈도" value={formatFrequency(person.frequency)} />
          <Row label="세는 기간" value={horizonText} />
          {person.hoursPerMeeting !== undefined && (
            <Row label="한 번에" value={`${person.hoursPerMeeting}시간`} />
          )}
        </div>

        {person.note && (
          <p className="mt-3 whitespace-pre-wrap border-t border-ink-200/60 pt-3 text-sm text-ink-600">
            {person.note}
          </p>
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">조건을 바꿔 보기</p>
          <p className="mt-1 text-xs text-ink-400">
            여기서 바꾼 것은 저장되지 않습니다. 숫자가 어떻게 달라지는지만 봅니다.
          </p>
        </div>

        {simulating && (
          <div className="rounded-xl bg-accent-50 px-3 py-2.5">
            <p className="text-xs text-accent-600">
              지금 {formatCount(result.total)}번 · 저장된 값은 {formatCount(saved.total)}번
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn-quiet"
                onClick={() => setFilters(person.filters)}
              >
                되돌리기
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() =>
                  savePerson({ ...person, filters, updatedAt: new Date().toISOString() })
                }
              >
                이대로 저장
              </button>
            </div>
          </div>
        )}

        <FilterEditor filters={filters} onChange={setFilters} />
      </div>

      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">연도별 추이</p>
        <YearBreakdown slices={result.slices} />
      </div>

      {growth && person.growth && (
        <GrowthCalendar
          name={person.name}
          setup={person.growth}
          result={growth}
          onChange={(setup) =>
            savePerson({ ...person, growth: setup, updatedAt: new Date().toISOString() })
          }
          onDisable={() =>
            savePerson({ ...person, growth: undefined, updatedAt: new Date().toISOString() })
          }
        />
      )}

      <div className="flex items-center gap-2">
        <Link href="/people" className="btn-secondary">
          목록으로
        </Link>
        <button
          type="button"
          className="btn-danger ml-auto"
          onClick={() => {
            removePerson(person.id);
            offerUndo(`${person.name}을(를) 지웠습니다.`, () => savePerson(person));
            router.push("/people");
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

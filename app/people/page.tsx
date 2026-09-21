"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import ListControls, { type SortOption } from "@/components/ListControls";
import { computeRelationship } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval } from "@/lib/format";
import { matches, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import type { Person } from "@/lib/types";

type Sort = "fewest" | "soonest" | "name" | "added";

const SORTS: SortOption<Sort>[] = [
  { key: "fewest", label: "남은 만남 적은 순" },
  { key: "soonest", label: "자주 만나는 순" },
  { key: "name", label: "이름순" },
  { key: "added", label: "최근 추가순" },
];

/** 기본값("남은 평생")이면 굳이 적지 않는다. 다른 값일 때만 짧게 알린다. */
function horizonLabel(horizon: Person["horizon"]): string | null {
  if (!horizon || horizon.kind === "life") return null;
  if (horizon.kind === "untilMyAge") return `내 ${horizon.age}세까지`;
  return `${horizon.years}년간`;
}

const SORT_HINT: Record<Sort, string> = {
  fewest: "남은 만남이 적은 순서입니다.",
  soonest: "자주 만나는 순서입니다.",
  name: "이름순입니다.",
  added: "최근에 추가한 순서입니다.",
};

export default function PeoplePage() {
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("fewest");

  const rows = useMemo(() => {
    const all = state.people.map((person) => ({
      person,
      result: computeRelationship(person, state.profile),
    }));
    const found = all.filter(({ person }) =>
      matches(query, [person.name, person.relation, person.note]),
    );
    const sorted = [...found];
    sorted.sort((a, b) => {
      if (sort === "name") return a.person.name.localeCompare(b.person.name, "ko");
      if (sort === "added") return b.person.createdAt.localeCompare(a.person.createdAt);
      if (sort === "soonest") {
        // 간격이 짧을수록 앞. 빈도가 0이면 맨 뒤로 보낸다.
        const ai = a.result.intervalDays ?? Number.POSITIVE_INFINITY;
        const bi = b.result.intervalDays ?? Number.POSITIVE_INFINITY;
        return ai - bi;
      }
      return a.result.total - b.result.total;
    });
    return { all, sorted };
  }, [state.people, state.profile, query, sort]);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">인연</h1>
          <p className="mt-1 text-sm text-ink-400">{SORT_HINT[sort]}</p>
        </div>
        <Link href="/people/new" className="btn-primary">
          추가
        </Link>
      </div>

      <ListControls
        total={rows.all.length}
        shown={rows.sorted.length}
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        options={SORTS}
        placeholder="이름, 관계, 메모로 찾기"
      />

      {!state.profile && (
        <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs text-accent-600">
          내 정보가 없으면 상대의 남은 시간만으로 계산합니다.{" "}
          <Link href="/setup" className="underline">
            내 정보 채우기
          </Link>
        </p>
      )}

      {rows.all.length === 0 ? (
        <EmptyState
          title={copy.emptyPeople}
          body="이름, 나이, 만나는 빈도 세 가지면 충분합니다."
          actionHref="/people/new"
          actionLabel="첫 인연 추가"
        />
      ) : rows.sorted.length === 0 ? (
        <p className="card text-sm text-ink-400">
          &ldquo;{query}&rdquo;와(과) 맞는 인연이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.sorted.map(({ person, result }) => (
            <Link
              key={person.id}
              href={`/people/detail?id=${person.id}`}
              className="card flex items-center justify-between transition hover:border-ink-400" prefetch={false}>
              <span className="flex min-w-0 items-center gap-3">
                <span className="text-2xl">{person.emoji ?? "🫧"}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-800">
                    {person.name}
                    {/* 기본값이 아닌 설정은 목록에서도 보여야 한다. 상세로 들어가야만
                        알 수 있으면 켜 둔 사실 자체를 잊는다. */}
                    {person.growth && (
                      <span className="ml-1.5 align-middle text-[11px] font-normal text-accent-500">
                        성장 캘린더
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-400">
                    {formatFrequency(person.frequency)}
                    {result.intervalDays !== null && ` · ${formatInterval(result.intervalDays)}`}
                    {horizonLabel(person.horizon) && ` · ${horizonLabel(person.horizon)}`}
                  </span>
                  {person.note && (
                    <span className="mt-0.5 block truncate text-xs text-ink-400">{person.note}</span>
                  )}
                </span>
              </span>
              <span className="shrink-0 pl-3 text-right">
                <span className="numeral block text-2xl text-ink-900">
                  {formatCount(result.total)}
                </span>
                <span className="block text-[11px] text-ink-400">번 남음</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";

import EmptyState from "@/components/EmptyState";
import { computeRelationship } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

export default function PeoplePage() {
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);

  const rows = useMemo(
    () =>
      state.people
        .map((person) => ({ person, result: computeRelationship(person, state.profile) }))
        .sort((a, b) => a.result.total - b.result.total),
    [state.people, state.profile],
  );

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">인연</h1>
          <p className="mt-1 text-sm text-ink-400">남은 만남이 적은 순서입니다.</p>
        </div>
        <Link href="/people/new" className="btn-primary">
          추가
        </Link>
      </div>

      {!state.profile && (
        <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs text-accent-600">
          내 정보가 없으면 상대의 남은 시간만으로 계산합니다.{" "}
          <Link href="/setup" className="underline">
            내 정보 채우기
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={copy.emptyPeople}
          body="이름, 나이, 만나는 빈도 세 가지면 충분합니다."
          actionHref="/people/new"
          actionLabel="첫 인연 추가"
        />
      ) : (
        <div className="space-y-2">
          {rows.map(({ person, result }) => (
            <Link
              key={person.id}
              href={`/people/${person.id}`}
              className="card flex items-center justify-between transition hover:border-ink-400"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{person.emoji ?? "🫧"}</span>
                <span>
                  <span className="block text-sm font-medium text-ink-800">{person.name}</span>
                  <span className="block text-xs text-ink-400">
                    {formatFrequency(person.frequency)}
                    {result.intervalDays !== null && ` · ${formatInterval(result.intervalDays)}`}
                  </span>
                </span>
              </span>
              <span className="text-right">
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

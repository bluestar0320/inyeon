"use client";

import Link from "next/link";
import { useMemo } from "react";

import EmptyState from "@/components/EmptyState";
import { computeMoment } from "@/lib/calc";
import { formatCount, formatFrequency } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

export default function MomentsPage() {
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);

  const rows = useMemo(
    () =>
      state.moments
        .map((moment) => ({ moment, result: computeMoment(moment, state.profile) }))
        .sort((a, b) => a.result.total - b.result.total),
    [state.moments, state.profile],
  );

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">순간</h1>
          <p className="mt-1 text-sm text-ink-400">사람이 아닌 일을 셉니다.</p>
        </div>
        <Link href="/moments/new" className="btn-primary">
          추가
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={copy.emptyMoments}
          body="벚꽃, 해외여행, 서핑처럼 반복되는 일을 적어 보세요."
          actionHref="/moments/new"
          actionLabel="첫 순간 추가"
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map(({ moment, result }) => (
            <Link
              key={moment.id}
              href={`/moments/${moment.id}`}
              className="card transition hover:border-ink-400"
            >
              <span className="text-2xl">{moment.emoji ?? "◦"}</span>
              <p className="mt-2 text-sm font-medium text-ink-800">{moment.title}</p>
              <p className="text-xs text-ink-400">{formatFrequency(moment.frequency)}</p>
              <p className="numeral mt-2 text-3xl text-ink-900">
                {formatCount(result.total)}
                <span className="ml-1 text-sm font-normal text-ink-400">번</span>
              </p>
              {moment.filters.some((f) => f.enabled) && (
                <p className="mt-1 text-[11px] text-accent-500">
                  조건 {moment.filters.filter((f) => f.enabled).length}개 적용됨
                </p>
              )}
              {moment.note && (
                <p className="mt-1 line-clamp-2 text-xs text-ink-400">{moment.note}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

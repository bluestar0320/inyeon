"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import ListControls, { type SortOption } from "@/components/ListControls";
import { computeMoment } from "@/lib/calc";
import { formatCount, formatFrequency } from "@/lib/format";
import { matches, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

type Sort = "fewest" | "most" | "name" | "added";

const SORTS: SortOption<Sort>[] = [
  { key: "fewest", label: "적게 남은 순" },
  { key: "most", label: "많이 남은 순" },
  { key: "name", label: "이름순" },
  { key: "added", label: "최근 추가순" },
];

export default function MomentsPage() {
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("fewest");

  const rows = useMemo(() => {
    const all = state.moments.map((moment) => ({
      moment,
      result: computeMoment(moment, state.profile),
    }));
    const found = all.filter(({ moment }) => matches(query, [moment.title, moment.note]));
    const sorted = [...found];
    sorted.sort((a, b) => {
      if (sort === "name") return a.moment.title.localeCompare(b.moment.title, "ko");
      if (sort === "added") return b.moment.createdAt.localeCompare(a.moment.createdAt);
      if (sort === "most") return b.result.total - a.result.total;
      return a.result.total - b.result.total;
    });
    return { all, sorted };
  }, [state.moments, state.profile, query, sort]);

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

      <ListControls
        total={rows.all.length}
        shown={rows.sorted.length}
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        options={SORTS}
        placeholder="제목, 메모로 찾기"
      />

      {rows.all.length === 0 ? (
        <EmptyState
          title={copy.emptyMoments}
          body="벚꽃, 해외여행, 서핑처럼 반복되는 일을 적어 보세요."
          actionHref="/moments/new"
          actionLabel="첫 순간 추가"
        />
      ) : rows.sorted.length === 0 ? (
        <p className="card text-sm text-ink-400">
          &ldquo;{query}&rdquo;와(과) 맞는 순간이 없습니다.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.sorted.map(({ moment, result }) => (
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

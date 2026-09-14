"use client";

import Link from "next/link";
import { useMemo } from "react";

import BigNumber from "@/components/BigNumber";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import { computeMoment, computeRelationship, lifeProgress, remainingYears, resolveAge } from "@/lib/calc";
import { formatAge, formatCount, formatPercent, formatYears } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

export default function HomePage() {
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);
  const profile = state.profile;

  const people = useMemo(
    () =>
      state.people
        .map((person) => ({ person, result: computeRelationship(person, profile) }))
        .sort((a, b) => a.result.total - b.result.total),
    [state.people, profile],
  );

  const moments = useMemo(
    () =>
      state.moments
        .map((moment) => ({ moment, result: computeMoment(moment, profile) }))
        .sort((a, b) => a.result.total - b.result.total),
    [state.moments, profile],
  );

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-5 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            남은 것을 세어 봅니다
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            이 앱은 할 일을 알려주지 않습니다. 남은 시간과 남은 만남을 횟수로 계산할
            뿐입니다. 먼저 내 정보를 채워 주세요.
          </p>
        </div>
        <Link href="/setup" className="btn-primary">
          시작하기
        </Link>
      </div>
    );
  }

  const myRemaining = remainingYears(profile);
  const progress = lifeProgress(profile);
  const age = resolveAge(profile);

  return (
    <div className="space-y-6">
      <p className="pt-2 text-sm text-ink-400">{copy.greeting}</p>

      <section className="card space-y-4">
        <BigNumber
          label={copy.lifeLabel}
          value={myRemaining === null ? "-" : formatYears(myRemaining)}
          sub={
            age === null
              ? undefined
              : `${formatAge(age)} · 예상 수명 ${profile.lifeExpectancy}세`
          }
        />
        {progress !== null && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-50">
              <div className="h-full rounded-full bg-ink-800" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-400">
              지나온 {formatPercent(progress)} · 남은 {formatPercent(1 - progress)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="남은 여름"
            value={myRemaining === null ? "-" : `${Math.floor(myRemaining)}번`}
          />
          <StatCard
            label="남은 주말"
            value={myRemaining === null ? "-" : formatCount(myRemaining * 52)}
          />
          <StatCard
            label="남은 보름달"
            value={myRemaining === null ? "-" : formatCount(myRemaining * 12.37)}
          />
        </div>
        <Link href="/setup" className="btn-quiet">
          내 정보 수정
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">인연</h2>
          <Link href="/people" className="btn-quiet">
            전체 보기
          </Link>
        </div>
        {people.length === 0 ? (
          <EmptyState
            title={copy.emptyPeople}
            body="나이와 만나는 빈도만 있으면 앞으로 몇 번 더 볼 수 있는지 바로 나옵니다."
            actionHref="/people/new"
            actionLabel="인연 추가"
          />
        ) : (
          <div className="space-y-2">
            {people.slice(0, 4).map(({ person, result }) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="card flex items-center justify-between py-4 transition hover:border-ink-400"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{person.emoji ?? "🫧"}</span>
                  <span>
                    <span className="block text-sm font-medium text-ink-800">{person.name}</span>
                    <span className="block text-xs text-ink-400">{person.relation ?? "인연"}</span>
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
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">순간</h2>
          <Link href="/moments" className="btn-quiet">
            전체 보기
          </Link>
        </div>
        {moments.length === 0 ? (
          <EmptyState
            title={copy.emptyMoments}
            body="벚꽃, 해외여행, 서핑… 빈도만 정하면 남은 횟수가 나옵니다."
            actionHref="/moments/new"
            actionLabel="순간 추가"
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {moments.slice(0, 4).map(({ moment, result }) => (
              <Link
                key={moment.id}
                href={`/moments/${moment.id}`}
                className="card py-4 transition hover:border-ink-400"
              >
                <span className="text-xl">{moment.emoji ?? "◦"}</span>
                <p className="mt-2 text-sm font-medium text-ink-800">{moment.title}</p>
                <p className="numeral mt-1 text-2xl text-ink-900">
                  {formatCount(result.total)}
                  <span className="ml-1 text-sm font-normal text-ink-400">번</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

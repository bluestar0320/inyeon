"use client";

import Link from "next/link";
import { useMemo } from "react";

import BigNumber from "@/components/BigNumber";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import {
  computeGrowth,
  computeMarriage,
  computeMoment,
  computeRelationship,
  lifeProgress,
  remainingYears,
  resolveAge,
} from "@/lib/calc";
import {
  formatAge,
  formatCount,
  formatFrequency,
  formatPercent,
  formatYears,
} from "@/lib/format";
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

  const marriage = useMemo(
    () =>
      state.marriage === null
        ? null
        : { plan: state.marriage, result: computeMarriage(state.marriage, profile) },
    [state.marriage, profile],
  );

  // 성장 캘린더를 켠 사람들. 자녀 상세 화면에 묻어 두기엔 이 앱에서 가장 무거운
  // 숫자라 홈으로 올린다.
  const growing = useMemo(
    () =>
      state.people
        .map((person) => ({ person, growth: computeGrowth(person) }))
        .filter(
          (row): row is { person: (typeof state.people)[number]; growth: NonNullable<ReturnType<typeof computeGrowth>> } =>
            row.growth !== null && !row.growth.grownUp && row.growth.yearsLeft !== null,
        ),
    [state.people],
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
      {/* 홈의 h1. 큰 제목을 두지 않는 화면이라 이 문장이 페이지를 대표한다. */}
      <h1 className="pt-2 text-sm font-normal text-ink-400">{copy.greeting}</h1>

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
            body="부모님, 친구, 아이 — 나와 이어진 사람이면 누구든. 나이와 만나는 빈도만 있으면 앞으로 몇 번 더 볼 수 있는지 바로 나옵니다."
            actionHref="/people/new"
            actionLabel="인연 추가"
          />
        ) : (
          <div className="space-y-2">
            {people.slice(0, 4).map(({ person, result }) => (
              <Link
                key={person.id}
                href={`/people/detail?id=${person.id}`}
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

      {growing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-800">아이와 남은 것들</h2>
          {growing.map(({ person, growth }) => {
            const pick = (key: string) => growth.items.find((i) => i.key === key);
            return (
              <Link
                key={person.id}
                href={`/people/detail?id=${person.id}`}
                className="card block transition hover:border-ink-400"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-ink-800">
                    {person.emoji ?? "🧸"} {person.name}
                  </p>
                  <p className="text-xs text-ink-400">
                    만 {growth.adultAge}세까지 {formatYears(growth.yearsLeft)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {["summer", "winterBreak", "dinner"].map((key) => {
                    const item = pick(key);
                    if (!item) return null;
                    return (
                      <div key={key} className="rounded-xl border border-ink-200/70 px-3 py-2">
                        <p className="text-[11px] text-ink-400">
                          {item.emoji} {item.label}
                        </p>
                        <p className="numeral mt-0.5 text-lg text-ink-800">
                          {formatCount(item.count)}
                          <span className="ml-0.5 text-xs font-normal text-ink-400">번</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Link>
            );
          })}
        </section>
      )}

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
                href={`/moments/detail?id=${moment.id}`}
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

      {/*
        만든 것은 카드로, 안 만든 것은 한 줄로. 홈은 이 사람이 세기로 한 것들을
        비추는 자리여야 한다. 결혼 계획을 세울 생각이 없는 사람에게 빈 카드를 늘
        띄우면 그 자리는 영영 노이즈다.
      */}
      {marriage === null ? (
        <Link
          href="/marriage"
          className="block pt-2 text-center text-xs text-ink-400 transition hover:text-ink-600"
        >
          결혼까지 남은 기회도 세어 보기 →
        </Link>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-800">결혼 계획</h2>
          <Link
            href="/marriage"
            className="card flex items-center justify-between py-4 transition hover:border-ink-400"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="text-xl">💍</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-800">
                  만 {marriage.plan.targetAge}세까지
                </span>
                <span className="block text-xs text-ink-400">
                  {formatFrequency(marriage.plan.frequency)}
                  {marriage.result.yearsLeft !== null &&
                    ` · ${formatYears(marriage.result.yearsLeft)} 남음`}
                </span>
                {marriage.plan.note && (
                  <span className="mt-0.5 block truncate text-xs text-ink-400">
                    {marriage.plan.note}
                  </span>
                )}
              </span>
            </span>
            <span className="shrink-0 pl-3 text-right">
              <span className="numeral block text-2xl text-ink-900">
                {formatCount(marriage.result.total)}
              </span>
              <span className="block text-[11px] text-ink-400">번 남음</span>
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}

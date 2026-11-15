"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import CardRow, { type DeckCard } from "@/components/CardRow";
import { lastMetLine } from "@/components/MeetingLog";
import { birthdayLine, upcomingBirthdays } from "@/lib/birthdays";
import {
  computeGrowth,
  computeMoment,
  computeRelationship,
  remainingYears,
} from "@/lib/calc";
import { startIndex } from "@/lib/deck";
import {
  formatCount,
  formatYears,
  todayISO,
} from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { memoryLetter } from "@/lib/memoryLetter";
import { inOrder } from "@/lib/order";
import { imageFor } from "@/lib/photos";
import { relationTag } from "@/lib/story";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: {
    overview: (i: number, n: number) => `모아 보기, ${n}장 중 ${i}번째`,
    newPerson: "새 인연",
    newMoment: "새 순간",
    loading: "불러오는 중…",
    people: "인연",
    seeAll: "전체 보기",
    times: "번",
    growingTitle: "아이와 남은 것들",
    untilAdult: (age: number, years: string) => `만 ${age}세까지 ${years}`,
    moments: "순간",
    emptyMomentsBody: "벚꽃, 해외여행, 서핑… 빈도만 정하면 남은 횟수가 나옵니다.",
  },
  en: {
    overview: (i, n) => `See all, ${i} of ${n}`,
    newPerson: "New person",
    newMoment: "New moment",
    loading: "Loading…",
    people: "People",
    seeAll: "See all",
    times: "times",
    growingTitle: "Time with your kids",
    untilAdult: (age, years) => `${years} until age ${age}`,
    moments: "Moments",
    emptyMomentsBody: "Cherry blossoms, trips abroad, surfing… just set how often, and you'll see how many times remain.",
  },
  ja: {
    overview: (i, n) => `一覧、${n}枚中${i}枚目`,
    newPerson: "新しい大切な人",
    newMoment: "新しいひととき",
    loading: "読み込み中…",
    people: "大切な人",
    seeAll: "すべて見る",
    times: "回",
    growingTitle: "子どもと過ごせる時間",
    untilAdult: (age, years) => `${age}歳まで ${years}`,
    moments: "ひととき",
    emptyMomentsBody: "桜、海外旅行、サーフィン… 頻度を決めるだけで残りの回数がわかります。",
  },
  es: {
    overview: (i, n) => `Ver todo, ${i} de ${n}`,
    newPerson: "Nueva persona",
    newMoment: "Nuevo momento",
    loading: "Cargando…",
    people: "Personas",
    seeAll: "Ver todo",
    times: "veces",
    growingTitle: "Tiempo con tus hijos",
    untilAdult: (age, years) => `${years} hasta los ${age}`,
    moments: "Momentos",
    emptyMomentsBody: "Cerezos en flor, viajes, surf… solo elige cada cuánto y verás cuántas veces quedan.",
  },
  zh: {
    overview: (i, n) => `查看全部，第${i}张，共${n}张`,
    newPerson: "新亲友",
    newMoment: "新时光",
    loading: "加载中…",
    people: "亲友",
    seeAll: "查看全部",
    times: "次",
    growingTitle: "和孩子相处的时光",
    untilAdult: (age, years) => `到${age}岁还有${years}`,
    moments: "时光",
    emptyMomentsBody: "樱花、出国旅行、冲浪… 只要设定频率，就能看到还剩几次。",
  },
});

export default function HomePage() {
  const t = tr(COPY);
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);
  const profile = state.profile;

  // 인연 목록에서 「내 순서」를 정했으면 그 순서, 아니면 남은 만남이 적은 사람부터.
  const order = state.settings.peopleOrder;
  const people = useMemo(() => {
    const rows = state.people.map((person) => ({ person, result: computeRelationship(person, profile) }));
    return order?.length
      ? inOrder(rows, order, ({ person }) => person.id)
      : rows.sort((a, b) => a.result.total - b.result.total);
  }, [state.people, profile, order]);

  const moments = useMemo(
    () =>
      state.moments
        .map((moment) => ({ moment, result: computeMoment(moment, profile) }))
        .sort((a, b) => a.result.total - b.result.total),
    [state.moments, profile],
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

  const router = useRouter();
  useEffect(() => {
    if (hydrated && !profile) router.replace("/setup");
  }, [hydrated, profile, router]);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  // 처음 온 사람에게 소개 화면과 "시작하기" 단추를 한 번 더 거치게 하지 않는다. 바로 적게 한다.
  if (!profile) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  const myRemaining = remainingYears(profile);

  return (
    <div className="space-y-6">
      {/* 홈의 h1. 큰 제목을 두지 않는 화면이라 이 문장이 페이지를 대표한다. */}
      <h1 className="pt-2 text-sm font-normal text-ink-400">{copy.greeting}</h1>

      {/* 2주 안에 생일이 오는 사람. 생년월일을 넣은 사람만 — 나이만 적었으면 날짜를 모른다. */}
      {upcomingBirthdays(state.people).map(({ person, days }) => (
        <Link
          key={person.id}
          href={`/people/detail?id=${person.id}`}
          prefetch={false}
          className="block rounded-xl border border-ink-200/70 px-4 py-3 text-xs leading-relaxed text-ink-600 transition hover:border-ink-400"
        >
          {birthdayLine(person, days, memoryLetter(person, todayISO()) !== null)}
        </Link>
      ))}

      {/* 사진 속 사람이 첫 화면이다. 내 남은 시간은 그 다음에 — 감정은 숫자보다 얼굴에서 먼저 온다. */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.people}</h2>
          <Link href="/people" className="btn-quiet">
            {t.seeAll}
          </Link>
        </div>
        {/* 「나」 → 사람들 → 「＋ 새 인연」. 사람이 없어도 두 장은 있다. */}
        <CardRow
          label={t.people}
          index={startIndex(
            people.map(({ person }) => person.id),
            upcomingBirthdays(state.people).map(({ person, days }) => ({ id: person.id, days })),
          )}
          onIndex={() => {}}
          listHref="/people"
          overviewLabel={t.overview}
          cards={[
            {
              kind: "me",
              id: "me",
              href: "/settings",
              label: copy.lifeLabel,
              value: myRemaining === null ? "-" : formatYears(myRemaining),
            },
            ...people.map(({ person, result }): DeckCard => ({
              kind: "photo",
              id: person.id,
              href: `/people/detail?id=${person.id}`,
              photo: imageFor(person),
              title: [person.name, relationTag(person.name, person.relation)].filter(Boolean).join(" · "),
              sentence: copy.meetingSentence(person.name, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
              note: lastMetLine(person),
            })),
            { kind: "add", id: "add", href: "/people/new", label: t.newPerson },
          ]}
        />
      </section>

      {growing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.growingTitle}</h2>
          {growing.map(({ person, growth }) => {
            const pick = (key: string) => growth.items.find((i) => i.key === key);
            return (
              <Link
                key={person.id}
                href={`/people/detail?id=${person.id}`}
                className="card block transition hover:border-ink-400" prefetch={false}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-ink-800">
                    {person.emoji ?? "🧸"} {person.name}
                  </p>
                  <p className="text-xs text-ink-400">
                    {t.untilAdult(growth.adultAge, formatYears(growth.yearsLeft))}
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
                          <span className="ml-0.5 text-xs font-normal text-ink-400">{t.times}</span>
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
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.moments}</h2>
          <Link href="/moments" className="btn-quiet">
            {t.seeAll}
          </Link>
        </div>
        {/* 순간들 → 「＋ 새 순간」. 순간이 없으면 「＋」 한 장과 안내 문장. */}
        <CardRow
          label={t.moments}
          index={0}
          onIndex={() => {}}
          listHref="/moments"
          overviewLabel={t.overview}
          cards={[
            ...moments.map(({ moment, result }): DeckCard => ({
              kind: "photo",
              id: moment.id,
              href: `/moments/detail?id=${moment.id}`,
              photo: imageFor(moment),
              title: moment.title,
              sentence: copy.momentSentence(moment.title, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
            })),
            { kind: "add", id: "add", href: "/moments/new", label: t.newMoment },
          ]}
        />
        {moments.length === 0 && (
          <p className="break-keep text-center text-xs leading-relaxed text-ink-600">
            {copy.emptyMoments} {t.emptyMomentsBody}
          </p>
        )}
      </section>
    </div>
  );
}

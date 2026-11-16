"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import type { DeckCard } from "@/components/CardRow";
import Deck from "@/components/Deck";
import { lastMetLine } from "@/components/MeetingLog";
import { backupDue } from "@/lib/backup";
import { birthdayRibbon, upcomingBirthdays } from "@/lib/birthdays";
import {
  computeGrowth,
  computeMoment,
  computeRelationship,
  remainingYears,
} from "@/lib/calc";
import { growthNote, startIndex } from "@/lib/deck";
import { formatCount, formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { inOrder } from "@/lib/order";
import { imageFor } from "@/lib/photos";
import { relationTag } from "@/lib/story";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { replaceTo } from "@/lib/unsaved";

const COPY = defineCopy({
  ko: {
    newPerson: "새 인연",
    newMoment: "새 순간",
    loading: "불러오는 중…",
    times: "번",
    backup: "백업할 때가 됐어요",
    emptyMomentsBody: "벚꽃, 해외여행, 서핑… 빈도만 정하면 남은 횟수가 나옵니다.",
  },
  en: {
    newPerson: "New person",
    newMoment: "New moment",
    loading: "Loading…",
    times: "times",
    backup: "Time to save a backup",
    emptyMomentsBody: "Cherry blossoms, trips abroad, surfing… just set how often, and you'll see how many times remain.",
  },
  ja: {
    newPerson: "新しい大切な人",
    newMoment: "新しいひととき",
    loading: "読み込み中…",
    times: "回",
    backup: "そろそろバックアップを",
    emptyMomentsBody: "桜、海外旅行、サーフィン… 頻度を決めるだけで残りの回数がわかります。",
  },
  es: {
    newPerson: "Nueva persona",
    newMoment: "Nuevo momento",
    loading: "Cargando…",
    times: "veces",
    backup: "Ya toca hacer una copia de seguridad",
    emptyMomentsBody: "Cerezos en flor, viajes, surf… solo elige cada cuánto y verás cuántas veces quedan.",
  },
  zh: {
    newPerson: "新亲友",
    newMoment: "新时光",
    loading: "加载中…",
    times: "次",
    backup: "该备份一下了",
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

  const router = useRouter();
  useEffect(() => {
    if (hydrated && !profile) replaceTo(router, "/setup");
  }, [hydrated, profile, router]);

  // 처음 온 사람에게 소개 화면과 "시작하기" 단추를 한 번 더 거치게 하지 않는다. 바로 적게 한다.
  if (!hydrated || !profile) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  const myRemaining = remainingYears(profile);
  // 2주 안에 생일이 오는 사람(생년월일을 넣은 사람만). 카드 리본과 시작 장에 쓴다.
  const upcoming = upcomingBirthdays(state.people);

  return (
    // data-deck: 이 화면은 main의 위아래 여백 없이 머리글 바로 아래부터 화면 끝까지 쓴다(app/layout.tsx).
    <div data-deck="">
      {/* 홈의 h1. 큰 제목을 두지 않는 화면이라 이 문장이 페이지를 대표한다. */}
      <h1 className="sr-only">{copy.greeting}</h1>
      <Deck
        startPeople={startIndex(
          people.map(({ person }) => person.id),
          upcoming.map(({ person, days }) => ({ id: person.id, days })),
        )}
        peopleCards={[
          {
            kind: "me",
            id: "__me",
            href: "/settings",
            label: copy.lifeLabel,
            value: myRemaining === null ? "-" : formatYears(myRemaining),
            nudge: backupDue(state) ? t.backup : null,
          },
          ...people.map(({ person, result }): DeckCard => {
            const growth = computeGrowth(person);
            const birthday = upcoming.find((u) => u.person.id === person.id);
            return {
              kind: "photo",
              id: person.id,
              flipKey: `person:${person.id}`,
              href: `/people/detail?id=${person.id}`,
              photo: imageFor(person),
              title: [person.name, relationTag(person.name, person.relation)].filter(Boolean).join(" · "),
              sentence: copy.meetingSentence(person.name, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
              // 아이면 성인이 될 때까지 남은 것 하나, 아니면 마지막 만남.
              note: (growth && growthNote(growth)) ?? lastMetLine(person),
              ribbon: birthday ? birthdayRibbon(person, birthday.days) : null,
            };
          }),
          { kind: "add", id: "__add", href: "/people/new", label: t.newPerson },
        ]}
        momentCards={[
          ...moments.map(({ moment, result }): DeckCard => ({
            kind: "photo",
            id: moment.id,
            flipKey: `moment:${moment.id}`,
            href: `/moments/detail?id=${moment.id}`,
            photo: imageFor(moment),
            title: moment.title,
            sentence: copy.momentSentence(moment.title, formatCount(result.total)),
            count: formatCount(result.total),
            unit: t.times,
          })),
          { kind: "add", id: "__add", href: "/moments/new", label: t.newMoment },
        ]}
        emptyMoments={moments.length === 0 ? `${copy.emptyMoments} ${t.emptyMomentsBody}` : null}
      />
    </div>
  );
}

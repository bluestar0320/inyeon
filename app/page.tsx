"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import BigNumber from "@/components/BigNumber";
import EmptyState from "@/components/EmptyState";
import { lastMetLine } from "@/components/MeetingLog";
import PhotoStack from "@/components/PhotoStack";
import StatCard from "@/components/StatCard";
import { backupDue } from "@/lib/backup";
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
import { defineCopy, tr } from "@/lib/i18n";
import { imageFor } from "@/lib/photos";
import { relationTag } from "@/lib/story";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    lifeSub: (age: string, lifeExpectancy: number) => `${age} · 예상 수명 ${lifeExpectancy}세`,
    progress: (past: string, left: string) => `지나온 ${past} · 남은 ${left}`,
    summers: "남은 여름",
    weekends: "남은 주말",
    fullMoons: "남은 보름달",
    editProfile: "내 정보 수정",
    backupNudge: "기록은 이 기기 안에만 있습니다. 지난 백업 뒤로 바뀐 것이 있어요 — 내보내 두기 →",
    people: "인연",
    seeAll: "전체 보기",
    emptyPeopleBody:
      "부모님, 친구, 아이 — 나와 이어진 사람이면 누구든. 나이와 만나는 빈도만 있으면 앞으로 몇 번 더 볼 수 있는지 바로 나옵니다.",
    addPerson: "인연 추가",
    times: "번",
    timesValue: (n: number) => `${n}번`,
    growingTitle: "아이와 남은 것들",
    untilAdult: (age: number, years: string) => `만 ${age}세까지 ${years}`,
    moments: "순간",
    emptyMomentsBody: "벚꽃, 해외여행, 서핑… 빈도만 정하면 남은 횟수가 나옵니다.",
    addMoment: "순간 추가",
    marriageLink: "결혼까지 남은 기회도 세어 보기 →",
    marriageTitle: "결혼 계획",
    untilAge: (age: number) => `만 ${age}세까지`,
    yearsLeft: (years: string) => ` · ${years} 남음`,
    timesLeft: "번 남음",
  },
  en: {
    loading: "Loading…",
    lifeSub: (age, lifeExpectancy) => `${age} · life expectancy ${lifeExpectancy}`,
    progress: (past, left) => `${past} behind · ${left} ahead`,
    summers: "Summers ahead",
    weekends: "Weekends ahead",
    fullMoons: "Full moons ahead",
    editProfile: "Edit my details",
    backupNudge:
      "Your records live only on this device, and some have changed since your last backup — export a copy →",
    people: "People",
    seeAll: "See all",
    emptyPeopleBody:
      "Parents, friends, kids — anyone in your life. With just an age and how often you meet, you'll see how many more times you can be together.",
    addPerson: "Add person",
    times: "times",
    timesValue: (n) => `${n} ${n === 1 ? "time" : "times"}`,
    growingTitle: "Time with your kids",
    untilAdult: (age, years) => `${years} until age ${age}`,
    moments: "Moments",
    emptyMomentsBody: "Cherry blossoms, trips abroad, surfing… just set how often, and you'll see how many times remain.",
    addMoment: "Add moment",
    marriageLink: "Count your chances to meet someone, too →",
    marriageTitle: "Marriage plan",
    untilAge: (age) => `By age ${age}`,
    yearsLeft: (years) => ` · ${years} to go`,
    timesLeft: "times left",
  },
  ja: {
    loading: "読み込み中…",
    lifeSub: (age, lifeExpectancy) => `${age} · 予想寿命 ${lifeExpectancy}歳`,
    progress: (past, left) => `過ぎた ${past} · 残り ${left}`,
    summers: "残りの夏",
    weekends: "残りの週末",
    fullMoons: "残りの満月",
    editProfile: "自分の情報を編集",
    backupNudge: "記録はこの端末の中にだけあります。前回のバックアップから変更があります — 書き出しておく →",
    people: "大切な人",
    seeAll: "すべて見る",
    emptyPeopleBody:
      "両親、友だち、子ども — つながっている人なら誰でも。年齢と会う頻度だけで、あと何回会えるかがすぐにわかります。",
    addPerson: "大切な人を追加",
    times: "回",
    timesValue: (n) => `${n}回`,
    growingTitle: "子どもと過ごせる時間",
    untilAdult: (age, years) => `${age}歳まで ${years}`,
    moments: "ひととき",
    emptyMomentsBody: "桜、海外旅行、サーフィン… 頻度を決めるだけで残りの回数がわかります。",
    addMoment: "ひとときを追加",
    marriageLink: "結婚までの出会いの機会も数えてみる →",
    marriageTitle: "結婚の計画",
    untilAge: (age) => `${age}歳まで`,
    yearsLeft: (years) => ` · あと${years}`,
    timesLeft: "回",
  },
  es: {
    loading: "Cargando…",
    lifeSub: (age, lifeExpectancy) => `${age} · esperanza de vida ${lifeExpectancy}`,
    progress: (past, left) => `${past} recorrido · ${left} por delante`,
    summers: "Veranos por delante",
    weekends: "Fines de semana",
    fullMoons: "Lunas llenas",
    editProfile: "Editar mis datos",
    backupNudge:
      "Tus registros solo están en este dispositivo y hay cambios desde tu última copia — exporta una copia →",
    people: "Personas",
    seeAll: "Ver todo",
    emptyPeopleBody:
      "Padres, amigos, hijos — cualquiera que forme parte de tu vida. Con su edad y cada cuánto os veis, verás cuántas veces más podéis estar juntos.",
    addPerson: "Añadir persona",
    times: "veces",
    timesValue: (n) => `${n} ${n === 1 ? "vez" : "veces"}`,
    growingTitle: "Tiempo con tus hijos",
    untilAdult: (age, years) => `${years} hasta los ${age}`,
    moments: "Momentos",
    emptyMomentsBody: "Cerezos en flor, viajes, surf… solo elige cada cuánto y verás cuántas veces quedan.",
    addMoment: "Añadir momento",
    marriageLink: "Cuenta también tus oportunidades de conocer a alguien →",
    marriageTitle: "Plan de boda",
    untilAge: (age) => `Hasta los ${age}`,
    yearsLeft: (years) => ` · quedan ${years}`,
    timesLeft: "veces más",
  },
  zh: {
    loading: "加载中…",
    lifeSub: (age, lifeExpectancy) => `${age} · 预期寿命 ${lifeExpectancy}岁`,
    progress: (past, left) => `已走过 ${past} · 还有 ${left}`,
    summers: "还有的夏天",
    weekends: "还有的周末",
    fullMoons: "还有的满月",
    editProfile: "修改我的信息",
    backupNudge: "记录只保存在这台设备上。上次备份后有了新的变化 — 导出一份 →",
    people: "亲友",
    seeAll: "查看全部",
    emptyPeopleBody:
      "父母、朋友、孩子 — 只要是和你相连的人都可以。只需年龄和见面频率，就能看到还能见几次。",
    addPerson: "添加亲友",
    times: "次",
    timesValue: (n) => `${n}次`,
    growingTitle: "和孩子相处的时光",
    untilAdult: (age, years) => `到${age}岁还有${years}`,
    moments: "时光",
    emptyMomentsBody: "樱花、出国旅行、冲浪… 只要设定频率，就能看到还剩几次。",
    addMoment: "添加时光",
    marriageLink: "也数一数结婚前还有多少相遇的机会 →",
    marriageTitle: "结婚计划",
    untilAge: (age) => `${age}岁之前`,
    yearsLeft: (years) => ` · 还有${years}`,
    timesLeft: "次",
  },
});

export default function HomePage() {
  const t = tr(COPY);
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
  const progress = lifeProgress(profile);
  const age = resolveAge(profile);

  return (
    <div className="space-y-6">
      {/* 홈의 h1. 큰 제목을 두지 않는 화면이라 이 문장이 페이지를 대표한다. */}
      <h1 className="pt-2 text-sm font-normal text-ink-400">{copy.greeting}</h1>

      {/* 조르지 않는 한 줄. 언제 뜨는지는 lib/backup.ts. */}
      {backupDue(state) && (
        <Link
          href="/settings#backup"
          className="block rounded-xl border border-ink-200/70 px-4 py-3 text-xs leading-relaxed text-ink-600 transition hover:border-ink-400"
        >
          {t.backupNudge}
        </Link>
      )}

      {/* 사진 속 사람이 첫 화면이다. 내 남은 시간은 그 다음에 — 감정은 숫자보다 얼굴에서 먼저 온다. */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.people}</h2>
          <Link href="/people" className="btn-quiet">
            {t.seeAll}
          </Link>
        </div>
        {people.length === 0 ? (
          <EmptyState
            title={copy.emptyPeople}
            body={t.emptyPeopleBody}
            actionHref="/people/new"
            actionLabel={t.addPerson}
          />
        ) : (
          <PhotoStack
            label={t.people}
            cards={people.slice(0, 10).map(({ person, result }) => ({
              id: person.id,
              href: `/people/detail?id=${person.id}`,
              photo: imageFor(person),
              title: [person.name, relationTag(person.name, person.relation)].filter(Boolean).join(" · "),
              sentence: copy.meetingSentence(person.name, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
              note: lastMetLine(person),
            }))}
          />
        )}
      </section>

      <section className="hero space-y-5">
        <BigNumber
          label={copy.lifeLabel}
          value={myRemaining === null ? "-" : formatYears(myRemaining)}
          sub={
            age === null
              ? undefined
              : t.lifeSub(formatAge(age), profile.lifeExpectancy)
          }
        />
        {progress !== null && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-hero-line">
              <div className="h-full rounded-full bg-ink-800" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-600">
              {t.progress(formatPercent(progress), formatPercent(1 - progress))}
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 border-t border-hero-line pt-5">
          <StatCard
            label={t.summers}
            value={myRemaining === null ? "-" : t.timesValue(Math.floor(myRemaining))}
          />
          <StatCard
            label={t.weekends}
            value={myRemaining === null ? "-" : formatCount(myRemaining * 52)}
          />
          <StatCard
            label={t.fullMoons}
            value={myRemaining === null ? "-" : formatCount(myRemaining * 12.37)}
          />
        </div>
        <Link href="/setup" className="btn-quiet">
          {t.editProfile}
        </Link>
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
        {moments.length === 0 ? (
          <EmptyState
            title={copy.emptyMoments}
            body={t.emptyMomentsBody}
            actionHref="/moments/new"
            actionLabel={t.addMoment}
          />
        ) : (
          <PhotoStack
            label={t.moments}
            cards={moments.slice(0, 10).map(({ moment, result }) => ({
              id: moment.id,
              href: `/moments/detail?id=${moment.id}`,
              photo: imageFor(moment),
              title: moment.title,
              sentence: copy.momentSentence(moment.title, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
            }))}
          />
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
          className="block py-3 text-center text-xs text-ink-400 transition hover:text-ink-600"
        >
          {t.marriageLink}
        </Link>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.marriageTitle}</h2>
          <Link
            href="/marriage"
            className="card flex items-center justify-between py-4 transition hover:border-ink-400"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="text-xl">💍</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-800">
                  {t.untilAge(marriage.plan.targetAge)}
                </span>
                <span className="block text-xs text-ink-400">
                  {formatFrequency(marriage.plan.frequency)}
                  {marriage.result.yearsLeft !== null &&
                    t.yearsLeft(formatYears(marriage.result.yearsLeft))}
                </span>
                {marriage.plan.note && (
                  <span className="mt-0.5 block truncate text-xs text-ink-400">
                    {marriage.plan.note}
                  </span>
                )}
              </span>
            </span>
            <span className="shrink-0 pl-3 text-right">
              <span className="numeral block text-3xl leading-none text-ink-900">
                {formatCount(marriage.result.total)}
              </span>
              <span className="mt-1 block text-[11px] text-ink-400">{t.timesLeft}</span>
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}

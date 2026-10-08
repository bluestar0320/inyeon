"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import GrowthCalendar from "@/components/GrowthCalendar";
import { hintFor } from "@/components/DecayHint";
import MeetingLog from "@/components/MeetingLog";
import OwnPhotoPicker from "@/components/OwnPhotoPicker";
import Polaroid from "@/components/Polaroid";
import ResultPanel from "@/components/ResultPanel";
import StoryLines from "@/components/StoryLines";
import WhatIf from "@/components/WhatIf";
import YearBreakdown from "@/components/YearBreakdown";
import { DEFAULT_GROWTH, computeGrowth, computePast, computeRelationship, pastLimit, resolveAge } from "@/lib/calc";
import {
  formatAge,
  formatCount,
  formatDays,
  formatFrequency,
  formatInterval,
  formatYears,
  josa,
} from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { useActions, useAppState } from "@/lib/store";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, lookupLifeExpectancy } from "@/lib/lifeExpectancy";
import { imageFor } from "@/lib/photos";
import { pairTitle } from "@/lib/shareCard";
import { buildStory, relationTag } from "@/lib/story";
import { copyFor, horizonPassedSentence } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { useToday } from "@/lib/useToday";
import type { Person } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    life: "남은 평생",
    untilMyAge: (age: number) => `내가 ${age}세 될 때까지`,
    years: (n: number) => `앞으로 ${n}년`,
    timesUnit: "번",
    times: (n: string) => `${n}번`,
    interval: "만남 간격",
    together: "함께 보낼 시간",
    myTime: "내 남은 시간",
    theirTime: (name: string) => `${name} 남은 시간`,
    info: "정보",
    edit: "수정하기",
    age: "나이",
    lifeExpectancy: "예상 수명",
    frequency: "만나는 빈도",
    horizon: "세는 기간",
    since: "언제부터",
    perMeeting: "한 번에",
    hours: (n: number) => `${n}시간`,
    byYear: "연도별 추이",
    backToList: "목록으로",
    remove: "삭제",
    removed: (name: string) => `${josa(name, "을/를")} 지웠습니다.`,
  },
  en: {
    life: "The rest of our lives",
    untilMyAge: (age) => `Until I turn ${age}`,
    years: (n) => `The next ${n} ${n === 1 ? "year" : "years"}`,
    timesUnit: "times",
    times: (n) => `${n} times`,
    interval: "Every",
    together: "Time together",
    myTime: "Your time ahead",
    theirTime: (name) => `${name}'s time ahead`,
    info: "Details",
    edit: "Edit",
    age: "Age",
    lifeExpectancy: "Life expectancy",
    frequency: "How often",
    horizon: "Counting period",
    since: "Since",
    perMeeting: "Per visit",
    hours: (n) => `${n} ${n === 1 ? "hour" : "hours"}`,
    byYear: "Year by year",
    backToList: "Back to list",
    remove: "Delete",
    removed: (name) => `Deleted ${name}.`,
  },
  ja: {
    life: "これからずっと",
    untilMyAge: (age) => `自分が${age}歳になるまで`,
    years: (n) => `これから${n}年`,
    timesUnit: "回",
    times: (n) => `${n}回`,
    interval: "会う間隔",
    together: "一緒に過ごす時間",
    myTime: "自分の残り時間",
    theirTime: (name) => `${name}の残り時間`,
    info: "情報",
    edit: "編集する",
    age: "年齢",
    lifeExpectancy: "予想寿命",
    frequency: "会う頻度",
    horizon: "数える期間",
    since: "いつから",
    perMeeting: "1回に",
    hours: (n) => `${n}時間`,
    byYear: "年ごとの推移",
    backToList: "一覧へ",
    remove: "削除",
    removed: (name) => `${name}を削除しました。`,
  },
  es: {
    life: "El resto de la vida",
    untilMyAge: (age) => `Hasta que cumpla ${age}`,
    years: (n) => `Los próximos ${n} ${n === 1 ? "año" : "años"}`,
    timesUnit: "veces",
    times: (n) => `${n} veces`,
    interval: "Cada",
    together: "Tiempo juntos",
    myTime: "Tu tiempo por delante",
    theirTime: (name) => `Tiempo de ${name}`,
    info: "Datos",
    edit: "Editar",
    age: "Edad",
    lifeExpectancy: "Esperanza de vida",
    frequency: "Frecuencia",
    horizon: "Periodo contado",
    since: "Desde",
    perMeeting: "Por visita",
    hours: (n) => `${n} ${n === 1 ? "hora" : "horas"}`,
    byYear: "Año a año",
    backToList: "Volver a la lista",
    remove: "Eliminar",
    removed: (name) => `Se eliminó a ${name}.`,
  },
  zh: {
    life: "余生",
    untilMyAge: (age) => `到我${age}岁为止`,
    years: (n) => `今后${n}年`,
    timesUnit: "次",
    times: (n) => `${n}次`,
    interval: "见面间隔",
    together: "相处的时间",
    myTime: "我剩余的时间",
    theirTime: (name) => `${name}剩余的时间`,
    info: "信息",
    edit: "编辑",
    age: "年龄",
    lifeExpectancy: "预期寿命",
    frequency: "见面频率",
    horizon: "计算期间",
    since: "从何时开始",
    perMeeting: "每次",
    hours: (n) => `${n}小时`,
    byYear: "逐年变化",
    backToList: "返回列表",
    remove: "删除",
    removed: (name) => `已删除${name}。`,
  },
});

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
  const t = tr(COPY);
  const copy = copyFor(state.settings.tone);

  // "만약에"로 바꿔 보는 빈도와 조건. 저장은 따로 눌러야 한다.
  const [draftSetup, setDraftSetup] = useState({ frequency: person.frequency, filters: person.filters });

  const draft = useMemo(() => ({ ...person, ...draftSetup }), [person, draftSetup]);
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile],
  );
  const growth = useMemo(() => computeGrowth(person), [person]);
  const myAge = state.profile ? resolveAge(state.profile) : null;
  const theirAge = resolveAge(person);
  // 화면을 켜 둔 채 자정을 넘기면 「오늘」 문장과 말투 바꾸기도 새날 기준으로 바뀐다.
  const today = useToday();
  const story = useMemo(
    () =>
      buildStory({
        person: draft,
        remaining: result.total,
        myAge,
        theirAge,
        tone: state.settings.tone,
        today,
        showPast: state.settings.showPast,
        // 지나간 쪽은 "만약에"가 아니라 실제 빈도로 센다 — 바로 아래 지나온 막대와 같은 기준.
        pastFrequency: person.frequency,
        me: state.profile?.nickname,
        // 출생 시 기대수명보다 나이가 많으시면 축하 한 줄을 붙인다.
        averageLife: lookupLifeExpectancy(person.countryCode, person.sex),
        country: COUNTRIES.find((c) => c.code === (person.countryCode ?? DEFAULT_COUNTRY_CODE))?.name,
      }),
    [draft, result.total, today, myAge, theirAge, state.settings.tone, state.settings.showPast, person.frequency, person.countryCode, person.sex, state.profile?.nickname],
  );
  // 다시 들어온 사람에게만 말투 바꾸기를 보인다. createdAt은 UTC라 기기 날짜로 바꿔 비교한다.
  const created = new Date(person.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const returning = `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())}` !== today;
  // 설정을 끄면 시작점이 있어도 안 보인다. 어림값이라 끌 수 있어야 한다.
  const past = useMemo(
    () =>
      state.settings.showPast
        ? computePast(
            person.frequency,
            person.since,
            undefined,
            pastLimit(resolveAge(person), state.profile ? resolveAge(state.profile) : null),
          )
        : null,
    [person, state.profile, state.settings.showPast],
  );

  const age = resolveAge(person);
  const horizonText =
    !person.horizon || person.horizon.kind === "life"
      ? t.life
      : person.horizon.kind === "untilMyAge"
        ? t.untilMyAge(person.horizon.age)
        : t.years(person.horizon.years);

  return (
    <div className="space-y-5">
      <div className="flex justify-center pt-2">
        <Polaroid src={imageFor(person)} size="lg" tilt={-2}>
          <span aria-hidden="true" className="font-album mt-2 block px-1 text-center text-sm text-ink-800">{person.name}</span>
        </Polaroid>
      </div>
      <OwnPhotoPicker
        value={person.ownPhoto}
        onChange={(ownPhoto) => savePerson({ ...person, ownPhoto, updatedAt: new Date().toISOString() })}
      />
      <MeetingLog person={person} />
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        sentence={copy.meetingSentence(person.name, formatCount(result.total))}
        share={{
          photo: imageFor(person),
          label: person.name,
          title: pairTitle(person.name),
          subtitle: copy.meetingLabel,
          value: formatCount(result.total),
          unit: t.timesUnit,
          caption: `${formatFrequency(draftSetup.frequency)} · ${formatYears(result.sharedYears)}`,
          // 카드에는 숫자를 풀어 쓴 지금 줄과 맺음(비율)만 — 오늘 할 일은 보는 사람의 몫이 아니다.
          // 독립 나이를 가정한 비율은 카드에 그 단서를 붙일 자리가 없어 싣지 않는다.
          story: story ? [story.now, (story.assumed ? undefined : story.past) ?? story.today].filter((line): line is string => Boolean(line)) : undefined,
        }}
        story={story && <StoryLines story={story} personId={person.id} returning={returning} />}
        shareFileName={[person.name, t.times(formatCount(result.total))]}
        past={past}
        stats={[
          { label: t.interval, value: formatInterval(result.intervalDays) },
          {
            label: t.together,
            value: result.togetherDays === null ? "-" : formatDays(result.togetherDays),
          },
          { label: t.myTime, value: formatYears(result.myYears) },
          { label: t.theirTime(person.name), value: formatYears(result.theirYears) },
        ]}
      />

      <p className="px-1 text-xs text-ink-400">
        {result.horizonPassed && person.horizon?.kind === "untilMyAge"
          ? horizonPassedSentence(person.horizon.age)
          : copy.limitedBySentence(result.limitedBy, person.name)}
      </p>

      <div className="card">
        {/* 이름은 화면 제목과 히어로에 이미 두 번 나왔다. 여기서 또 쓰지 않는다. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-ink-400">
            {relationTag(person.name, person.relation) ?? t.info}
          </p>
          <Link href={`/people/edit?id=${person.id}`} className="btn-secondary shrink-0" prefetch={false}>
            {t.edit}
          </Link>
        </div>

        <div className="mt-3 divide-y divide-ink-200/60 border-t border-ink-200/60 pt-1">
          <Row label={t.age} value={formatAge(age)} />
          <Row label={t.lifeExpectancy} value={formatAge(person.lifeExpectancy)} />
          <Row label={t.frequency} value={formatFrequency(person.frequency)} />
          <Row label={t.horizon} value={horizonText} />
          {person.since && <Row label={t.since} value={person.since} />}
          {person.hoursPerMeeting !== undefined && (
            <Row label={t.perMeeting} value={t.hours(person.hoursPerMeeting)} />
          )}
        </div>

        {person.note && (
          <p className="mt-3 whitespace-pre-wrap border-t border-ink-200/60 pt-3 text-sm text-ink-600">
            {person.note}
          </p>
        )}
      </div>

      <WhatIf
        hint={hintFor(person.emoji, "person")}
        draft={draftSetup}
        onDraft={setDraftSetup}
        saved={{ frequency: person.frequency, filters: person.filters }}
        totalFor={(setup) => computeRelationship({ ...person, ...setup }, state.profile).total}
        scenarios={person.scenarios ?? []}
        onScenarios={(scenarios) => savePerson({ ...person, scenarios, updatedAt: new Date().toISOString() })}
        onApply={() => savePerson({ ...person, ...draftSetup, updatedAt: new Date().toISOString() })}
      />

      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">{t.byYear}</p>
        <YearBreakdown slices={result.slices} />
      </div>

      {growth && (
        <GrowthCalendar
          name={person.name}
          setup={person.growth ?? DEFAULT_GROWTH}
          result={growth}
          onChange={(setup) =>
            savePerson({ ...person, growth: setup, updatedAt: new Date().toISOString() })
          }
        />
      )}

      <div className="flex items-center gap-2">
        <Link href="/people" className="btn-secondary">
          {t.backToList}
        </Link>
        <button
          type="button"
          className="btn-danger ml-auto"
          onClick={() => {
            removePerson(person.id);
            offerUndo(t.removed(person.name), () => savePerson(person));
            router.push("/people");
          }}
        >
          {t.remove}
        </button>
      </div>
    </div>
  );
}

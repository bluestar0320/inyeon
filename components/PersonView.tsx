"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import GrowthCalendar from "@/components/GrowthCalendar";
import { hintFor } from "@/components/DecayHint";
import MeetingLog from "@/components/MeetingLog";
import MemoryLetter from "@/components/MemoryLetter";
import OwnPhotoPicker from "@/components/OwnPhotoPicker";
import Polaroid from "@/components/Polaroid";
import ResultPanel from "@/components/ResultPanel";
import Saying from "@/components/Saying";
import StoryLines from "@/components/StoryLines";
import WhatIf from "@/components/WhatIf";
import YearBreakdown from "@/components/YearBreakdown";
import { DAYS_PER_YEAR, DEFAULT_GROWTH, computeGrowth, computePast, computeRelationship, pastLimit, resolveAge } from "@/lib/calc";
import {
  formatAge,
  formatCount,
  formatDays,
  formatFrequency,
  formatInterval,
  formatYears,
  josa,
} from "@/lib/format";
import { cardLine, yearsKnown } from "@/lib/cardLine";
import { defineCopy, getLang, locale, tr } from "@/lib/i18n";
import { relOf } from "@/lib/rel";
import { useFlip } from "@/lib/flip";
import { useActions, useAppState } from "@/lib/store";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, lookupLifeExpectancy } from "@/lib/lifeExpectancy";
import { imageFor } from "@/lib/photos";
import { pairTitle } from "@/lib/shareCard";
import { bondBand, buildStory, relationTag, type BondBand } from "@/lib/story";
import { copyFor, horizonPassedSentence } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { ledger } from "@/lib/meetings";
import { useToday } from "@/lib/useToday";
import { birthYearOf, estimatePast } from "@/lib/bonds";
import type { Person } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    life: "남은 평생",
    untilMyAge: (age: number) => `내가 ${age}세 될 때까지`,
    years: (n: number) => `앞으로 ${n}년`,
    timesUnit: "번",
    // 공유 카드: "어머니와 나 / 함께한 37번, 그리고 앞으로 / 255번".
    togetherSub: (n: string) => `함께한 ${n}번, 그리고 앞으로`,
    togetherSubYear: (n: string) => `올해 함께한 ${n}번, 그리고 앞으로`,
    bond: { new: "이제 막 가까워지는 사이예요. 앞으로 더 자주 봐요.", growing: "차곡차곡 쌓여 가는 사이예요. 다음 만남이 벌써 기다려져요.", oldFew: "말 안 해도 아는 오래된 사이. 남은 만남이 아쉬울 만큼 소중해요.", oldMany: "천 번을 함께해도 아직 모자란 사이. 남은 날도 하나하나 소중하게.", most: "함께한 날이 남은 날보다 많아졌어요. 한 번 한 번이 소중해요.", half: "딱 반쯤 왔어요. 지금부터 죽이 척척 맞을 거예요.", ahead: "앞으로 함께할 날들이 더 기대돼요." } as Record<BondBand, string>,
    times: (n: string) => `${n}번`,
    interval: "만남 간격",
    together: "함께 보낼 시간",
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
    togetherSub: (n) => `${n} together, and still to come`,
    togetherSubYear: (n) => `${n} together this year, and still to come`,
    bond: { new: "Just getting closer. Let's meet more often.", growing: "Growing closer, one visit at a time. Bring on the next.", oldFew: "Old friends who don't need words. Too few left, each one precious.", oldMany: "A thousand times together and still not enough. Treasure each one.", most: "More days together behind you than ahead. Every one counts.", half: "About halfway there. You'll only get more in sync from here.", ahead: "Can't wait for all the days ahead." } as Record<BondBand, string>,
    times: (n) => `${n} times`,
    interval: "Every",
    together: "Time together",
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
    togetherSub: (n) => `一緒に${n}回、そしてこれから`,
    togetherSubYear: (n) => `今年一緒に${n}回、そしてこれから`,
    bond: { new: "これから近づいていく仲。もっと会おうね。", growing: "少しずつ積み重なっていく仲。次に会うのがもう楽しみ。", oldFew: "言わなくても分かる長い付き合い。残りが惜しいほど大切。", oldMany: "千回会ってもまだ足りない仲。残りの日も一つひとつ大切に。", most: "一緒に過ごした日のほうが多くなりました。一回一回が宝物。", half: "ちょうど半分くらい。ここからもっと息が合っていくはず。", ahead: "これから一緒に過ごす日がもっと楽しみ。" } as Record<BondBand, string>,
    times: (n) => `${n}回`,
    interval: "会う間隔",
    together: "一緒に過ごす時間",
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
    togetherSub: (n) => `${n} juntos, y aún por delante`,
    togetherSubYear: (n) => `${n} juntos este año, y aún por delante`,
    bond: { new: "Apenas empezando. A verse más a menudo.", growing: "Poco a poco, más cerca. Ya hay ganas de la próxima.", oldFew: "De los de toda la vida. Lo que queda sabe a poco y vale oro.", oldMany: "Mil veces juntos y aún no basta. Cada una, a cuidarla.", most: "Ya hay más días juntos detrás que delante. Cada uno cuenta.", half: "A mitad de camino, y cada vez más compenetrados.", ahead: "Qué ganas de todos los días que vienen." } as Record<BondBand, string>,
    times: (n) => `${n} veces`,
    interval: "Cada",
    together: "Tiempo juntos",
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
    life: "今后一直",
    untilMyAge: (age) => `到我${age}岁为止`,
    years: (n) => `今后${n}年`,
    timesUnit: "次",
    togetherSub: (n) => `共度${n}次，往后还有`,
    togetherSubYear: (n) => `今年共度${n}次，往后还有`,
    bond: { new: "刚刚开始熟起来，以后多见面吧。", growing: "一点一点攒起来的交情，已经开始期待下次见面。", oldFew: "不用多说的老交情，剩下的每一次都珍贵得让人不舍。", oldMany: "见了一千多次还嫌不够，剩下的每一次都要好好珍惜。", most: "一起走过的已经比剩下的多了，每一次都很珍贵。", half: "差不多走到一半，往后只会越来越合拍。", ahead: "往后一起的日子，更让人期待。" } as Record<BondBand, string>,
    times: (n) => `${n}次`,
    interval: "见面间隔",
    together: "相处的时间",
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
  const flip = useFlip<HTMLSpanElement>(`person:${person.id}`);
  const router = useRouter();
  const { state } = useAppState();
  const { savePerson, removePerson } = useActions();
  const t = tr(COPY);
  const copy = copyFor(state.settings.tone);

  // "만약에"로 바꿔 보는 빈도와 조건. 저장은 따로 눌러야 한다.
  const [draftSetup, setDraftSetup] = useState({ frequency: person.frequency, filters: person.filters });

  const draft = useMemo(() => ({ ...person, ...draftSetup }), [person, draftSetup]);
  // 화면을 켜 둔 채 자정을 넘기면 큰 숫자와 「오늘」 문장, 말투 바꾸기도 새날 기준으로 바뀐다.
  const today = useToday();
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile, today],
  );
  const growth = useMemo(() => computeGrowth(person), [person]);
  /*
   * 「만났어요」를 한 번이라도 쓴 사람만 기록으로 센다. 안 쓰는 사람에게 "놓친 만남 12번"이 쌓이면
   * 탓하는 숫자가 된다 — 그런 사람에게는 놓친 만남을 숨기고 이야기 비율도 어림 그대로 둔다.
   */
  const recording = (person.meetings?.length ?? 0) > 0;
  const addedAt = new Date(person.createdAt).getTime();
  const recordedYears = Number.isNaN(addedAt) ? 0 : Math.max(0, (Date.now() - addedAt) / 86_400_000 / DAYS_PER_YEAR);
  const myAge = state.profile ? resolveAge(state.profile) : null;
  const theirAge = resolveAge(person);
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
        recorded: recording ? { years: recordedYears, met: result.together.met } : undefined,
      }),
    // recordedYears는 날이 바뀔 때만 의미 있게 달라지므로 today로 갈음한다.
    [draft, result.total, result.together.met, recording, today, myAge, theirAge, state.settings.tone, state.settings.showPast, person.frequency, person.countryCode, person.sex, state.profile?.nickname],
  );
  // 다시 들어온 사람에게만 말투 바꾸기를 보인다. createdAt은 UTC라 기기 날짜로 바꿔 비교한다.
  const created = new Date(person.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const returning = `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())}` !== today;
  /*
   * 지금까지 함께한 만남 = 「언제부터」부터 앱에 넣은 날까지의 어림값 + 그 뒤 「만났어요」 기록.
   * 어림값은 설정으로 끌 수 있다(어림이라서). 기록은 실제로 누른 것이라 늘 보인다.
   */
  /*
   * 「올해」를 고르면 1월 1일부터 센다: 어림은 「언제부터」와 1월 1일 중 늦은 날부터, 기록은 올해 칸만.
   */
  const scope: "all" | "year" = person.togetherScope ?? "all";
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const estimate = useMemo(() => {
    if (!state.settings.showPast) return null;
    const added = new Date(person.createdAt);
    // 관계 칩이 있으면 학교·같이 산 해로 세고, 못 세면(내 나이 없음 등) 아래 기존 방식으로 간다.
    if (person.bonds?.length && scope === "all" && !Number.isNaN(added.getTime())) {
      const birthYear = (who: { birthDate?: string } | null, age: number | null) => birthYearOf(who, age, Number(today.slice(0, 4)));
      const past = estimatePast({
        bonds: person.bonds,
        detail: person.bondDetail,
        frequency: person.frequency,
        since: person.since,
        myBirthYear: birthYear(state.profile, state.profile ? resolveAge(state.profile) : null),
        theirBirthYear: birthYear(person, resolveAge(person)),
        until: added,
      });
      if (past) return { count: past.count, years: 0, lines: past.lines };
    }
    const since = scope === "year" && person.since ? (person.since > yearStart ? person.since : yearStart) : person.since;
    return computePast(
      person.frequency,
      since,
      Number.isNaN(added.getTime()) ? undefined : added,
      pastLimit(resolveAge(person), state.profile ? resolveAge(state.profile) : null),
    );
  }, [person, state.profile, state.settings.showPast, scope, yearStart, today]);
  const counted = useMemo(() => {
    if (scope !== "year") return result.together;
    const createdDay = `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())}`;
    return ledger(person.meetings ?? [], person.frequency, createdDay > yearStart ? createdDay : yearStart, today);
  }, [scope, result.together, person.meetings, person.frequency, person.createdAt, yearStart, today]);
  const together = {
    met: counted.met,
    missed: recording ? counted.missed : 0,
    showMissed: recording,
    estimated: estimate?.count ?? 0,
    estimatedYears: estimate?.years ?? 0,
    lines: estimate && "lines" in estimate ? estimate.lines : undefined,
    academy: person.bondDetail?.academy,
    ageHint: Boolean(state.settings.showPast && person.bonds?.length && scope === "all" && myAge === null && !(estimate && "lines" in estimate)),
    scope,
    onScope: (next: "all" | "year") =>
      savePerson({ ...person, togetherScope: next === "year" ? "year" : undefined, updatedAt: new Date().toISOString() }),
  };

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
        <span ref={flip} className="block w-full max-w-[16rem]">
          <Polaroid src={imageFor(person)} size="lg" tilt={-2}>
            <span aria-hidden="true" className="font-album mt-2 block px-1 text-center text-sm text-ink-800">{person.name}</span>
          </Polaroid>
        </span>
      </div>
      <OwnPhotoPicker
        value={person.ownPhoto}
        onChange={(ownPhoto) => savePerson({ ...person, ownPhoto, updatedAt: new Date().toISOString() })}
      />
      <Saying person={person} />
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        causes={result.causes}
        sentence={copy.meetingSentence(person.name, formatCount(result.total))}
        share={{
          photo: imageFor(person),
          label: person.name,
          title: pairTitle(person.name),
          subtitle: together.met + together.estimated >= 1
            ? (scope === "year" ? t.togetherSubYear : t.togetherSub)(formatCount(together.met + together.estimated))
            : copy.meetingLabel,
          value: formatCount(result.total),
          unit: t.timesUnit,
          // 어떤 사이인지 한 줄. 올해만 센 횟수로는 오래된 사이인지 알 수 없어 평생 기준일 때만.
          note: scope === "all" ? (() => {
            const past = together.met + together.estimated;
            const band = bondBand(past, result.total);
            const rel = relOf(person);
            return cardLine({ past, years: yearsKnown({ rel, since: person.since, myAge, theirAge }), rel, seed: person.id, lang: getLang(), left: result.total >= 1 ? formatCount(result.total) : null, bond: band ? t.bond[band] : undefined });
          })() : undefined,
          caption: `${formatFrequency(draftSetup.frequency)} · ${formatYears(result.sharedYears)}`,
          // 카드에는 숫자를 풀어 쓴 지금 줄과 맺음(비율)만 — 오늘 할 일은 보는 사람의 몫이 아니다.
          // 독립 나이를 가정한 비율은 카드에 그 단서를 붙일 자리가 없어 싣지 않는다.
          story: story ? [story.now, (story.assumed ? undefined : story.past) ?? story.today].filter((line): line is string => Boolean(line)) : undefined,
        }}
        story={story && <StoryLines story={story} personId={person.id} returning={returning} person={person} />}
        together={together}
        shareFileName={[person.name, t.times(formatCount(result.total))]}
        stats={[
          { label: t.interval, value: formatInterval(result.intervalDays) },
          // 한 번에 보내는 시간을 안 적었으면 "-"만 덩그러니 남으니 칸을 뺀다.
          // 남은 수명(내 시간·상대 시간)은 싣지 않는다 — 이 앱이 세는 건 만남이지 수명이 아니다.
          ...(result.togetherDays === null ? [] : [{ label: t.together, value: formatDays(result.togetherDays) }]),
        ]}
      />

      <p className="px-1 text-xs text-ink-400">
        {result.horizonPassed && person.horizon?.kind === "untilMyAge"
          ? horizonPassedSentence(person.horizon.age)
          : copy.limitedBySentence(result.limitedBy, person.name)}
      </p>

      {/* 편지(이야기)를 먼저 읽고, 그다음에 만난 걸 적는다. 예전에는 기록 단추가 숫자 위에 있어 편지가 한참 아래로 밀렸다. */}
      <MeetingLog person={person} />
      <MemoryLetter person={person} />

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

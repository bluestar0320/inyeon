import { DAYS_PER_YEAR, computePast, pastLimit, toPerYear } from "./calc.ts";
import { formatCount, josa } from "./format.ts";
import { defineCopy, getLang, tr, type Lang } from "./i18n.ts";
import { BANK } from "./storyBank.ts";
import type { Frequency, Person, Tone } from "./types";

/*
 * 숫자를 짧은 이야기로 읽어 준다. AI를 부르지 않는다 — 상황을 판별해 storyBank.ts에 미리 써 둔
 * 문장 중 하나를 고른다. 같은 사람에게는 늘 같은 문장(내 얘기 같아야 한다), 「오늘」만 날마다 바뀐다.
 */

export type Rel = "parent" | "grandparent" | "partner" | "child" | "sibling" | "friend" | "other";
export type CountBand = "week" | "month" | "c100" | "c200" | "c300" | "year" | "twoYears" | "c1000" | "more";
export type FreqBand = "often" | "sometimes" | "rarely";
export type PastBand = "start" | "early" | "middle" | "late" | "last";
export type Slot = "then" | "now" | "today" | "past" | "met";

/** 조부모를 먼저 본다 — "할머니"의 "머니", "grandmother"의 "mother"가 부모님으로 잡히지 않게. */
const REL_WORDS: [Rel, string[]][] = [
  ["grandparent", ["할머니", "할아버지", "조부모", "외할", "grand", "祖父", "祖母", "おじいちゃん", "おばあちゃん", "abuel", "爷爷", "奶奶", "外公", "外婆"]],
  ["parent", ["엄마", "어머니", "아빠", "아버지", "mom", "mother", "dad", "father", "お母さん", "お父さん", "母", "父", "mamá", "papá", "madre", "padre", "妈", "爸"]],
  ["partner", ["연인", "애인", "배우자", "남편", "아내", "여자친구", "남자친구", "partner", "wife", "husband", "girlfriend", "boyfriend", "恋人", "妻", "夫", "パートナー", "pareja", "esposa", "esposo", "novia", "novio", "伴侣", "老公", "老婆", "男朋友", "女朋友"]],
  ["child", ["자녀", "아들", "딸", "아이", "child", "son", "daughter", "kid", "子ども", "息子", "娘", "hijo", "hija", "孩子", "儿子", "女儿"]],
  ["sibling", ["형제", "자매", "누나", "오빠", "언니", "동생", "sibling", "brother", "sister", "きょうだい", "兄", "姉", "弟", "妹", "herman", "兄弟", "姐妹", "哥", "姐"]],
  ["friend", ["친구", "friend", "友", "amig", "朋友"]],
];

export function relationKind(relation: string | undefined): Rel {
  const text = (relation ?? "").trim().toLowerCase();
  if (!text) return "other";
  for (const [rel, words] of REL_WORDS) if (words.some((w) => text.includes(w))) return rel;
  return "other";
}

const COUNT_BANDS: [number, CountBand][] = [
  [7, "week"], [30, "month"], [100, "c100"], [200, "c200"], [300, "c300"], [365, "year"], [730, "twoYears"], [1000, "c1000"],
];

export function countBand(count: number): CountBand {
  return COUNT_BANDS.find(([max]) => count <= max)?.[1] ?? "more";
}

export function freqBand(frequency: Frequency): FreqBand {
  const perYear = toPerYear(frequency);
  return perYear >= 52 ? "often" : perYear >= 12 ? "sometimes" : "rarely";
}

export function pastBand(pct: number): PastBand {
  return pct < 10 ? "start" : pct < 40 ? "early" : pct < 70 ? "middle" : pct < 90 ? "late" : "last";
}

/** 부모님 곁을 떠난 나이. since가 없을 때만 쓰고, 쓴다고 화면에 밝힌다. */
export const ASSUMED_MOVE_OUT_AGE = 20;

/** 함께할 만남 전체 중 이미 지나간 몫(%). 셀 수 없으면 null. */
export function pastShare(i: {
  rel: Rel;
  frequency: Frequency;
  since?: string;
  myAge: number | null;
  theirAge: number | null;
  remaining: number;
  now?: Date;
}): { pct: number; assumed: boolean } | null {
  const now = i.now ?? new Date();
  let away: number | null = null;
  if (i.since) {
    const start = new Date(`${i.since}T00:00:00`);
    if (Number.isNaN(start.getTime()) || start > now) return null;
    away = (now.getTime() - start.getTime()) / 86_400_000 / DAYS_PER_YEAR;
  }
  let past: number;
  let assumed = false;
  if (i.rel === "parent") {
    if (i.myAge === null) return null;
    if (away === null) {
      if (i.myAge < ASSUMED_MOVE_OUT_AGE) return null; // 아직 같이 사는 중
      away = i.myAge - ASSUMED_MOVE_OUT_AGE;
      assumed = true;
    }
    away = Math.min(away, i.myAge);
    // 같이 산 동안은 하루 한 번, 떠난 뒤로는 지금 빈도.
    past = (i.myAge - away) * DAYS_PER_YEAR + toPerYear(i.frequency) * away;
  } else {
    if (!i.since) return null;
    const result = computePast(i.frequency, i.since, now, pastLimit(i.theirAge, i.myAge));
    if (!result) return null;
    past = result.count;
  }
  const total = past + Math.max(0, i.remaining);
  if (!(total > 0)) return null;
  const pct = Math.min(100, Math.max(0, Math.floor((past / total) * 100)));
  return { pct, assumed };
}

const SPAN = defineCopy({
  ko: { week: "일주일", month: "한 달", months: (n: number) => `${n}달`, year: "1년", years: (n: number) => `${n}년` },
  en: { week: "a week", month: "a month", months: (n) => `${n} months`, year: "a year", years: (n) => `${n} years` },
  ja: { week: "1週間", month: "1か月", months: (n) => `${n}か月`, year: "1年", years: (n) => `${n}年` },
  es: { week: "una semana", month: "un mes", months: (n) => `${n} meses`, year: "un año", years: (n) => `${n} años` },
  zh: { week: "一周", month: "一个月", months: (n) => `${n}个月`, year: "一年", years: (n) => `${n}年` },
});

/** 남은 횟수를 하루 1번으로 바꿨을 때 "채 안 되는" 가장 작은 덩어리. */
export function spanText(count: number): string {
  const t = tr(SPAN);
  const days = Math.ceil(count);
  if (days <= 7) return t.week;
  if (days <= 31) return t.month;
  if (days < 365) {
    const months = Math.ceil(days / 30.44);
    return months >= 12 ? t.year : t.months(months);
  }
  const years = Math.ceil(days / DAYS_PER_YEAR);
  return years === 1 ? t.year : t.years(years);
}

const JOSA_PAIRS = new Set(["와/과", "을/를", "은/는", "이/가"]);

/** {key}·{key:와/과}를 채운다. 모르는 빈칸이 있으면 null — 화면에 "{name}"이 새어 나가지 않게. */
export function fill(template: string, vars: Record<string, string>): string | null {
  let broken = false;
  const out = template.replace(/\{(\w+)(?::([^}]+))?\}/g, (_, key: string, pair?: string) => {
    const value = vars[key];
    if (value === undefined || (pair && !JOSA_PAIRS.has(pair))) {
      broken = true;
      return "";
    }
    return pair ? josa(value, pair as Parameters<typeof josa>[1]) : value;
  });
  return broken ? null : out;
}

/** FNV-1a. 같은 사람·같은 날이면 같은 문장을 고르게 한다. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function sources(tone: Tone, lang: Lang): [Tone, Lang][] {
  const chain: [Tone, Lang][] = [[tone, lang], ["aware", lang]];
  if (lang !== "ko") chain.push([tone, "en"], ["aware", "en"]);
  return chain;
}

function pick(slot: Slot, keys: string[], tone: Tone, seed: string, vars: Record<string, string>): string | undefined {
  for (const [t, l] of sources(tone, getLang())) {
    const bank = BANK[t]?.[l]?.[slot];
    if (!bank) continue;
    for (const key of keys) {
      const list = bank[key];
      if (!list?.length) continue;
      return fill(list[hash(seed) % list.length], vars) ?? undefined;
    }
  }
  return undefined;
}

export interface Story {
  then?: string;
  now?: string;
  today?: string;
  past?: string;
  /** 부모님 독립 나이를 가정했다. 화면에 그렇다고 밝힌다. */
  assumed: boolean;
}

export function buildStory(i: {
  person: Person;
  remaining: number;
  myAge: number | null;
  theirAge?: number | null;
  tone: Tone;
  today: string;
  now?: Date;
}): Story | null {
  if (!(i.remaining >= 1)) return null;
  const { person } = i;
  const rel = relationKind(person.relation);
  const freq = freqBand(person.frequency);
  const share = pastShare({
    rel,
    frequency: person.frequency,
    since: person.since,
    myAge: i.myAge,
    theirAge: i.theirAge ?? null,
    remaining: i.remaining,
    now: i.now,
  });
  const vars: Record<string, string> = {
    name: person.name,
    count: formatCount(i.remaining),
    span: spanText(i.remaining),
    pct: share ? String(share.pct) : "",
  };
  const count = countBand(i.remaining);
  const band = share ? pastBand(share.pct) : null;
  const story: Story = {
    then: rel === "parent" && share ? pick("then", [`${rel}.${freq}`, rel], i.tone, `${person.id}then`, vars) : undefined,
    now: pick("now", [`${rel}.${count}`, count, "*"], i.tone, `${person.id}now`, vars),
    today: pick("today", [`${rel}.${freq}`, freq, "*"], i.tone, `${person.id}today${i.today}`, vars),
    past: band ? pick("past", [`${rel}.${band}`, band], i.tone, `${person.id}past`, vars) : undefined,
    assumed: Boolean(share?.assumed),
  };
  return story.then || story.now || story.today || story.past ? story : null;
}

/** 「만났어요」 직후 한 마디. 남은 횟수는 줄지 않으니 쌓인 쪽(올해 n번째)을 말한다. */
export function metLine(i: { person: Person; tone: Tone; thisYear: number }): string | null {
  const rel = relationKind(i.person.relation);
  return (
    pick("met", [rel, "*"], i.tone, `${i.person.id}met${i.thisYear}`, { name: i.person.name, n: String(i.thisYear) }) ??
    null
  );
}

/*
 * 지나온 만남 어림에 쓰는 관계 칩(Bond)과 세부 값(BondDetail).
 * 저장소·백업에서 온 값을 믿지 않고 모양과 범위를 다시 확인한다.
 */
import { toPerYear } from "./calc.ts";
import {
  ACADEMY_DEFAULT, armyServiceDays, ATTENDANCE, DAYS_TOGETHER_PER_YEAR, entryYear, GRANDPARENT_APART_PER_YEAR,
  highSchoolEndYear, schoolMeetingsFor, stageYears, UNIVERSITY_DAYS_PER_WEEK, UNIVERSITY_WEEKS, WORK_DAYS_PER_YEAR,
} from "./pastRules.ts";
import type { Bond, BondDetail, Frequency, SchoolStage } from "./types";

const BONDS: readonly Bond[] = ["elementary", "middle", "high", "university", "academy", "coworker", "parent", "grandparent", "sibling"];
const STAGE_MAX: Record<SchoolStage, number> = { elementary: 6, middle: 3, high: 3 };

const obj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** 모르는 칩과 중복은 버린다. 비면 undefined. */
export function cleanBonds(value: unknown): Bond[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = BONDS.filter((b) => value.includes(b));
  return out.length ? out : undefined;
}

/** 해는 1950년부터 올해까지. 밖이면 버린다. */
function year(v: unknown): number | undefined {
  return num(v) && Number.isInteger(v) && v >= 1950 && v <= new Date().getFullYear() ? v : undefined;
}

export function cleanBondDetail(value: unknown): BondDetail | undefined {
  if (!obj(value)) return undefined;
  const out: BondDetail = {};

  if (obj(value.schoolYears)) {
    const years: Partial<Record<SchoolStage, number>> = {};
    for (const stage of Object.keys(STAGE_MAX) as SchoolStage[]) {
      const v = value.schoolYears[stage];
      if (num(v) && v >= 0) years[stage] = Math.min(STAGE_MAX[stage], Math.round(v));
    }
    if (Object.keys(years).length) out.schoolYears = years;
  }

  const a = value.academy;
  if (obj(a) && num(a.years) && a.years > 0 && num(a.perWeek)) {
    out.academy = { years: Math.min(20, a.years), perWeek: Math.min(7, Math.max(1, Math.round(a.perWeek))) };
  }

  if (obj(value.military)) {
    const me = year(value.military.me);
    const them = year(value.military.them);
    if (me !== undefined || them !== undefined) {
      out.military = {};
      if (me !== undefined) out.military.me = me;
      if (them !== undefined) out.military.them = them;
    }
  }

  if (num(value.livedUntilAge) && value.livedUntilAge >= 0 && value.livedUntilAge <= 120) out.livedUntilAge = value.livedUntilAge;
  if (typeof value.livesTogether === "boolean") out.livesTogether = value.livesTogether;
  const end = year(value.workEndYear);
  if (end !== undefined) out.workEndYear = end;
  if (value.schoolShift === -1 || value.schoolShift === 0 || value.schoolShift === 1) out.schoolShift = value.schoolShift;

  return Object.keys(out).length ? out : undefined;
}

export type PastLineKind = "elementary" | "middle" | "high" | "university" | "academy" | "coworker" | "together" | "apart" | "after" | "military";
/** from/to = 해. 학교·대학·같이 산 구간은 학년도(3월~이듬해 2월), 나머지는 달력 해. military는 count가 음수(뺀 양). */
export interface PastLine { kind: PastLineKind; from: number; to: number; count: number }
export interface PastEstimate { count: number; lines: PastLine[] }

/*
 * 시간은 「달 번호」로 센다: 해 × 12 + 달(0~11) + 그 달에서 지난 비율.
 * 학년도 하나가 정확히 12, 2024-11-12부터 2026-11-12까지가 정확히 24가 된다.
 */
const month = (y: number, m = 2) => y * 12 + m; // 기본은 3월
function monthOf(d: Date): number {
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const into = (d.getTime() - new Date(d.getFullYear(), d.getMonth(), 1).getTime()) / 86400000;
  return d.getFullYear() * 12 + d.getMonth() + into / days;
}
function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface Segment { kind: PastLineKind; start: number; end: number; perYear: number }
const SCHOOL_LIKE: readonly PastLineKind[] = ["elementary", "middle", "high", "university", "together"];
const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/*
 * 시작부터 until까지, 구간 경계로 자른 조각마다 센다.
 * 조각을 덮는 구간 중 1년 횟수가 가장 큰 것 하나만 세고, 덮는 게 없으면 지금 빈도(after).
 * 군 복무 중인 조각은 0이고, 셌을 양을 military 줄에 음수로 적는다. 그래서 줄의 합 = count.
 */
function tally(segments: Segment[], services: [number, number][], start: number, until: number, afterRate: number): PastLine[] {
  const cuts = [start, until, ...segments.flatMap((s) => [s.start, s.end]), ...services.flat()]
    .filter((t) => t >= start && t <= until)
    .sort((a, b) => a - b);
  const lines = new Map<PastLineKind, { from: number; to: number; count: number }>();
  const add = (kind: PastLineKind, a: number, b: number, count: number) => {
    const line = lines.get(kind);
    if (line) Object.assign(line, { from: Math.min(line.from, a), to: Math.max(line.to, b), count: line.count + count });
    else lines.set(kind, { from: a, to: b, count });
  };
  for (let k = 0; k + 1 < cuts.length; k += 1) {
    const a = cuts[k], b = cuts[k + 1];
    if (b <= a) continue;
    const mid = (a + b) / 2;
    let best: Segment | null = null;
    for (const s of segments) if (s.start <= mid && mid < s.end && (!best || s.perYear > best.perYear)) best = s;
    const count = ((best ? best.perYear : afterRate) * (b - a)) / 12;
    add(best ? best.kind : "after", a, b, count);
    if (services.some(([s, e]) => s <= mid && mid < e)) add("military", a, b, -count);
  }
  return [...lines]
    .filter(([, l]) => l.count !== 0)
    .map(([kind, l]) => ({
      kind,
      from: Math.floor(l.from / 12),
      // 3월에 끝나는 학년도 구간은 2월이 마지막 달이라 끝 해를 학년도로 적는다(초등 2000~2005).
      to: Math.max(Math.floor(l.from / 12), Math.floor((l.to - (SCHOOL_LIKE.includes(kind) ? 2 : 0) - 1e-9) / 12)),
      count: l.count,
    }));
}

const sum = (lines: PastLine[]) => Math.max(0, lines.reduce((s, l) => s + l.count, 0));

/** 같이 산 동안 329번/년 + 떠난 뒤 지금 빈도. pastShare가 쓴다. */
export function livedTogetherCount(i: { myBirthYear: number; leftYear: number; frequency: Frequency; until: Date }): number {
  const until = monthOf(i.until);
  const start = month(i.myBirthYear);
  if (!Number.isFinite(until) || !Number.isFinite(start) || !Number.isFinite(i.leftYear) || start >= until) return 0;
  const seg: Segment = { kind: "together", start, end: month(i.leftYear), perYear: DAYS_TOGETHER_PER_YEAR };
  return sum(tally([seg], [], start, until, clean(toPerYear(i.frequency))));
}

const NEEDS_BIRTH: readonly Bond[] = ["elementary", "middle", "high", "university", "parent", "grandparent", "sibling"];
const finiteYear = (y: number | null | undefined) => (typeof y === "number" && Number.isFinite(y) ? Math.round(y) : null);

export function estimatePast(i: {
  bonds: Bond[]; detail?: BondDetail; frequency: Frequency; since?: string;
  myBirthYear: number | null; theirBirthYear: number | null; until: Date;
}): PastEstimate | null {
  const bonds = i.bonds ?? [];
  const detail = i.detail ?? {};
  const has = (b: Bond) => bonds.includes(b);
  const until = monthOf(i.until);
  if (!bonds.length || !Number.isFinite(until)) return null;
  const born = finiteYear(i.myBirthYear);
  // 내 나이를 모르면 학교·같이 산 해를 맞출 수 없다. 기존 방식(since × 빈도)으로 돌아간다.
  if (born === null && bonds.some((b) => NEEDS_BIRTH.includes(b))) return null;
  if (bonds.every((b) => b === "academy") && !detail.academy) return null;

  const since = parseDate(i.since);
  const sinceAt = since ? monthOf(since) : null;
  // 동료를 골랐으면 지금 빈도는 일하며 보는 횟수다. 빈 곳·그 뒤도 근무일 상한을 넘지 않는다.
  const afterRate = Math.min(clean(toPerYear(i.frequency)), has("coworker") ? WORK_DAYS_PER_YEAR * ATTENDANCE : Infinity);
  const segments: Segment[] = [];
  const shift = detail.schoolShift ?? 0;

  // 군 복무: 그해 1월 1일 입대로 친다(겹치는 기간이 가장 길게). 나와 상대가 겹친 기간은 한 번만 빠진다.
  const services: [number, number][] = [finiteYear(detail.military?.me), finiteYear(detail.military?.them)]
    .filter((y): y is number => y !== null)
    .map((y) => {
      const end = new Date(y, 0, 1);
      end.setTime(end.getTime() + armyServiceDays(y) * 86400000);
      return [month(y, 0), monthOf(end)];
    });
  const served = (a: number, b: number) => services.reduce((s, [x, y]) => s + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0);

  if (born !== null) {
    const entry = entryYear(born) + shift;
    const myHighEnd = highSchoolEndYear(born) + shift;
    for (const stage of ["elementary", "middle", "high"] as SchoolStage[]) {
      if (!has(stage)) continue;
      const [a, b] = stageYears[stage];
      const n = Math.min(b - a, detail.schoolYears?.[stage] ?? b - a);
      for (let k = 0; k < n; k += 1) {
        const y = entry + a + k;
        segments.push({ kind: stage, start: month(y), end: month(y + 1), perYear: schoolMeetingsFor(y) });
      }
    }
    if (has("university")) {
      // 고교 졸업한 해 3월 입학. 복무와 6달 이상 겹치는 학년은 한 해 뒤로 민다. 휴학은 묻지 않는다.
      let y = myHighEnd;
      for (const days of UNIVERSITY_DAYS_PER_WEEK) {
        while (served(month(y), month(y + 1)) >= 6) y += 1;
        segments.push({ kind: "university", start: month(y), end: month(y + 1), perYear: days * UNIVERSITY_WEEKS });
        y += 1;
      }
    }
    // 같이 산 끝: 지금도 같이 살면 until, 아니면 since → 같이 산 마지막 나이 → 기본값.
    // 동료를 골랐으면 since는 같이 일하기 시작한 때라 같이 산 끝으로 쓰지 않는다.
    const leftAt = (fallbackYear: number) =>
      detail.livesTogether ? until
        : sinceAt !== null && !has("coworker") ? sinceAt
        : detail.livedUntilAge !== undefined ? month(born + detail.livedUntilAge)
        : month(fallbackYear);
    if (has("parent")) segments.push({ kind: "together", start: month(born), end: leftAt(myHighEnd), perYear: DAYS_TOGETHER_PER_YEAR });
    if (has("sibling")) {
      const their = finiteYear(i.theirBirthYear) ?? born;
      const end = Math.min(myHighEnd, highSchoolEndYear(their));
      segments.push({ kind: "together", start: month(Math.max(born, their)), end: leftAt(end), perYear: DAYS_TOGETHER_PER_YEAR });
    }
    if (has("grandparent")) {
      // 같이 산 나이를 고른 때만 같이 산 것으로 친다. 비우면 따로 산 조부모님(1년 2번).
      if (detail.livesTogether || detail.livedUntilAge !== undefined) {
        const end = detail.livesTogether ? until : month(born + (detail.livedUntilAge ?? 0));
        segments.push({ kind: "together", start: month(born), end, perYear: DAYS_TOGETHER_PER_YEAR });
      } else segments.push({ kind: "apart", start: month(born), end: until, perYear: GRANDPARENT_APART_PER_YEAR });
    }
  }
  if (has("coworker") && sinceAt !== null) {
    // 그만둔 해는 그해 끝까지 같이 일한 것으로 친다.
    const end = detail.workEndYear !== undefined ? month(detail.workEndYear + 1, 0) : until;
    segments.push({ kind: "coworker", start: sinceAt, end, perYear: afterRate });
  }

  const live = segments.filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start);
  // 첫 구간부터 센다. 구간이 없으면 since부터 지금 빈도로(학원만 고른 경우).
  const start = live.length ? Math.min(...live.map((s) => s.start)) : sinceAt;
  if (start === null && !has("academy")) return null;
  // 아직 시작 안 한 인연은 0번. 학원도 더하지 않는다(기준일 뒤의 해를 줄에 적지 않는다).
  if (start !== null && start >= until) return { count: 0, lines: [] };
  const lines = start !== null ? tally(live, services, start, until, afterRate) : [];

  if (has("academy")) {
    const { years, perWeek } = detail.academy ?? ACADEMY_DEFAULT;
    // 학원은 언제였는지 묻지 않는다. 줄의 해는 셈을 시작한 해(없으면 기준일의 해)로 둔다.
    const y = Math.floor((start ?? until) / 12);
    const count = clean(years * perWeek * 52);
    if (count) lines.push({ kind: "academy", from: y, to: y, count });
  }
  return { count: sum(lines), lines };
}

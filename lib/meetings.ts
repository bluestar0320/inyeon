/*
 * 「만났어요」 기록. 만날 때마다 한 번 누르면 그날 날짜가 쌓인다. 날짜는 기기 시간대의 YYYY-MM-DD다.
 * 이 기록으로 오늘 기준의 함께한·놓친 만남을 세고, 남은 횟수를 고친다(ledger).
 */
import type { Frequency } from "./types";

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** 하루 한 번씩 13년치. 저장 공간을 지키는 상한이다. */
const MAX = 5000;

export function addMeeting(meetings: string[], today: string): string[] {
  return [...meetings, today].slice(-MAX);
}

function dayNumber(iso: string): number {
  return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
}

export function daysSinceLast(meetings: string[], today: string): number | null {
  const last = meetings.at(-1);
  return last ? Math.max(0, dayNumber(today) - dayNumber(last)) : null;
}

export function metThisYear(meetings: string[], today: string): number {
  const year = today.slice(0, 4);
  return meetings.filter((d) => d.startsWith(year)).length;
}

/** 저장소·백업에서 온 값을 믿지 않는다. 날짜가 아닌 건 빼고, 날짜순으로, 최근 MAX개만. */
export function cleanMeetings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((d): d is string => typeof d === "string" && DATE.test(d))
    .sort()
    .slice(-MAX);
}

function isoOf(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1 + months, 1));
  return d.toISOString().slice(0, 10);
}

function addYears(iso: string, years: number): string {
  return `${+iso.slice(0, 4) + years}${iso.slice(4)}`.replace(/-02-29$/, "-02-28");
}

/** iso가 든 기간의 첫날. 주는 월요일부터, 달·분기·해는 달력으로, 여러 해 단위는 anchor에서 N년씩. */
function startOf(unit: Frequency["unit"], iso: string, anchor: string): string {
  const n = dayNumber(iso);
  switch (unit) {
    case "day":
      return iso;
    case "week":
      return isoOf(n - ((new Date(n * 86_400_000).getUTCDay() + 6) % 7));
    case "month":
      return `${iso.slice(0, 7)}-01`;
    case "quarter": {
      const m = +iso.slice(5, 7);
      return `${iso.slice(0, 4)}-${String(m - ((m - 1) % 3)).padStart(2, "0")}-01`;
    }
    case "year":
      return `${iso.slice(0, 4)}-01-01`;
    default: {
      const years = Number(unit.slice(4));
      let start = anchor;
      while (addYears(start, years) <= iso) start = addYears(start, years);
      return start;
    }
  }
}

function nextOf(unit: Frequency["unit"], start: string): string {
  switch (unit) {
    case "day":
      return isoOf(dayNumber(start) + 1);
    case "week":
      return isoOf(dayNumber(start) + 7);
    case "month":
      return addMonths(start, 1);
    case "quarter":
      return addMonths(start, 3);
    case "year":
      return addYears(start, 1);
    default:
      return addYears(start, Number(unit.slice(4)));
  }
}

export interface Ledger {
  /** 세기 시작한 날부터 「만났어요」로 기록한 만남 전부(계획보다 더 만난 것도). */
  met: number;
  /** 끝난 기간마다 계획만큼 못 만난 칸의 합. */
  missed: number;
  /** 이번 기간에 기록한 만남. */
  metNow: number;
  /** 시간으로만 센 남은 횟수에 더할 값. 이번 기간의 아직 안 만난 칸을 남기고, 만난 칸은 뺀다. */
  adjust: number;
}

/**
 * 빈도 하나가 한 칸이다(주 1회면 한 주가 한 칸, 주 5회면 한 주에 다섯 칸). 오늘을 기준으로
 * 끝난 기간의 칸은 함께했거나(기록 있음) 놓쳤고, 이번 기간의 칸은 만나면 그 자리에서 앞으로에서 빠진다.
 * 세기 시작한 날이 기간 한가운데면 그 기간은 남은 날만큼만 센다.
 */
export function ledger(meetings: string[], frequency: Frequency, start: string, today: string): Ledger {
  const count = Number.isFinite(frequency.count) ? Math.max(0, frequency.count) : 0;
  const from = start > today ? today : start;
  const inRange = (a: string, b: string) => meetings.filter((d) => d >= a && d < b).length;
  const share = (p: string, next: string) =>
    p >= from ? 1 : (dayNumber(next) - dayNumber(from)) / (dayNumber(next) - dayNumber(p));

  let missed = 0;
  const current = startOf(frequency.unit, today, from);
  // 하루 단위로 수십 년이 지나도 멈추게 상한을 둔다.
  for (let p = startOf(frequency.unit, from, from), i = 0; p < current && i < 40_000; i += 1) {
    const next = nextOf(frequency.unit, p);
    missed += Math.max(0, count * share(p, next) - inRange(p > from ? p : from, next));
    p = next;
  }
  const next = nextOf(frequency.unit, current);
  const metNow = inRange(current > from ? current : from, isoOf(dayNumber(today) + 1));
  const left = (dayNumber(next) - dayNumber(today)) / (dayNumber(next) - dayNumber(current));
  return {
    met: inRange(from, isoOf(dayNumber(today) + 1)),
    missed: Math.floor(missed + 1e-9),
    metNow,
    // 걸쳐 있는 기간도 칸은 온전히 센다(0.7칸이면 1칸) — 만나면 앞으로가 꼭 하나 줄어야 한다.
    adjust: Math.max(0, Math.ceil(count * share(current, next) - 1e-9) - metNow) - count * left,
  };
}

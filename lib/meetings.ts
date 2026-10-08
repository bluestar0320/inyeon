/*
 * 「만났어요」 기록. 만날 때마다 한 번 누르면 그날 날짜가 쌓인다.
 *
 * 남은 횟수는 "지금 빈도로 계속 만난다"는 예측이라, 예측 안에 든 만남을 또 빼면 두 번 센다.
 * 그래서 이번 기간(이번 달 등)에 예측보다 **더** 만난 만큼만 남은 횟수에서 뺀다(extraMeetings).
 * 예측 안의 만남은 숫자 대신 점 색으로 보인다(ResultPanel). 날짜는 기기 시간대의 YYYY-MM-DD다.
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

function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 빈도 단위로 본 "이번 기간"의 첫날. 주는 월요일부터, 여러 해 단위는 오늘까지 그 햇수. */
function periodStart(unit: Frequency["unit"], today: string): string {
  const [y, m] = [+today.slice(0, 4), +today.slice(5, 7)];
  const d = new Date(Date.UTC(y, m - 1, +today.slice(8, 10)));
  switch (unit) {
    case "day":
      return today;
    case "week":
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      return isoOf(d);
    case "month":
      return `${today.slice(0, 7)}-01`;
    case "quarter":
      return `${y}-${String(m - ((m - 1) % 3)).padStart(2, "0")}-01`;
    case "year":
      return `${y}-01-01`;
    default: {
      const years = Number(unit.slice(4));
      d.setUTCFullYear(d.getUTCFullYear() - years);
      d.setUTCDate(d.getUTCDate() + 1);
      return isoOf(d);
    }
  }
}

/** 이번 기간에 기록한 만남 수. */
export function metThisPeriod(meetings: string[], frequency: Frequency, today: string): number {
  const start = periodStart(frequency.unit, today);
  return meetings.filter((d) => d >= start && d <= today).length;
}

/** 이번 기간에 예측(빈도)보다 더 만난 횟수. 남은 횟수에서 이만큼 뺀다. */
export function extraMeetings(meetings: string[], frequency: Frequency, today: string): number {
  const count = Number.isFinite(frequency.count) ? Math.max(0, frequency.count) : 0;
  return Math.max(0, Math.floor(metThisPeriod(meetings, frequency, today) - count));
}

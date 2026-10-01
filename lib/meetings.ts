/*
 * 「만났어요」 기록. 만날 때마다 한 번 누르면 그날 날짜가 쌓인다.
 *
 * 남은 횟수 계산에는 쓰지 않는다 — 남은 횟수는 시간에서 나온다. 이 기록은 "마지막으로 만난 지
 * 며칠"과 "올해 몇 번 만났나"를 보여 줘서, 알림 없이도 앱을 다시 열 이유가 되게 한다.
 * 날짜는 기기 시간대의 YYYY-MM-DD 문자열이다.
 */

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

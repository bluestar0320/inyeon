import { defineCopy, tr } from "./i18n.ts";
import { relationKind } from "./story.ts";
import type { Person } from "./types";

/*
 * 생신·생일이 다가오는지. 생년월일(YYYY-MM-DD)을 넣은 사람만 본다 — 나이만 적은
 * 사람은 날짜를 모르니 아무것도 띄우지 않는다. 칸을 새로 묻지 않는다.
 */

export const UPCOMING_DAYS = 14;

const DAY = 86_400_000;

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 그해의 생일(기기 시간대 자정). 2월 29일생은 윤년이 아니면 2월 28일에 챙긴다. */
function birthdayIn(year: number, month: number, day: number): Date {
  const d = month === 2 && day === 29 && !isLeap(year) ? 28 : day;
  return new Date(year, month - 1, d);
}

/** 다음 생일과 그날까지 남은 날. 오늘이 생일이면 0일. 날짜가 없거나 이상하면 null. */
export function nextBirthday(birthDate: string | undefined, now: Date = new Date()): { date: Date; days: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let date = birthdayIn(today.getFullYear(), month, day);
  if (date < today) date = birthdayIn(today.getFullYear() + 1, month, day);
  // 서머타임이 끼면 하루가 23·25시간이라 반올림한다.
  return { date, days: Math.round((date.getTime() - today.getTime()) / DAY) };
}

export interface UpcomingBirthday {
  person: Person;
  date: Date;
  days: number;
}

/** 14일 안에 생일이 오는 사람들, 가까운 순. */
export function upcomingBirthdays(people: Person[], now: Date = new Date(), within = UPCOMING_DAYS): UpcomingBirthday[] {
  return people
    .map((person) => ({ person, next: nextBirthday(person.birthDate, now) }))
    .filter((row): row is { person: Person; next: { date: Date; days: number } } => row.next !== null && row.next.days <= within)
    .map(({ person, next }) => ({ person, ...next }))
    .sort((a, b) => a.days - b.days);
}

/** 부모님·조부모님이면 생신. 관계 칸이 비었어도 이름이 "엄마"면 알아듣는다. */
export function isElder(person: Pick<Person, "name" | "relation">): boolean {
  const elder = (text?: string) => ["parent", "grandparent"].includes(relationKind(text));
  return elder(person.relation) || elder(person.name);
}

const COPY = defineCopy({
  ko: (name: string, days: number, elder: boolean) => {
    const what = elder ? "생신" : "생일";
    if (days === 0) return `오늘은 ${name} ${what}이에요`;
    if (days === 1) return `내일이 ${name} ${what}이에요`;
    return `${name} ${what}까지 ${days}일 남았어요`;
  },
  en: (name, days) => {
    if (days === 0) return `Today is ${name}'s birthday`;
    if (days === 1) return `${name}'s birthday is tomorrow`;
    return `${name}'s birthday is in ${days} days`;
  },
  ja: (name, days, elder) => {
    const what = elder ? "お誕生日" : "誕生日";
    if (days === 0) return `今日は${name}の${what}です`;
    if (days === 1) return `明日は${name}の${what}です`;
    return `${name}の${what}まであと${days}日です`;
  },
  es: (name, days) => {
    if (days === 0) return `Hoy es el cumpleaños de ${name}`;
    if (days === 1) return `Mañana es el cumpleaños de ${name}`;
    return `Faltan ${days} días para el cumpleaños de ${name}`;
  },
  zh: (name, days) => {
    if (days === 0) return `今天是${name}的生日`;
    if (days === 1) return `明天是${name}的生日`;
    return `离${name}的生日还有${days}天`;
  },
});

const LETTER = defineCopy({
  ko: "기억 편지가 준비돼 있어요",
  en: "a letter of your memories is ready",
  ja: "思い出の手紙ができています",
  es: "tu carta de recuerdos está lista",
  zh: "回忆信已经备好了",
});

/** letter: 건넬 기억 편지가 있으면 한마디 덧붙인다(components/MemoryLetter). */
export function birthdayLine(person: Pick<Person, "name" | "relation">, days: number, letter = false): string {
  const line = tr(COPY)(person.name, days, isElder(person));
  return letter ? `${line} · ${tr(LETTER)}` : line;
}

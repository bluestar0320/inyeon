import type { GrowthResult } from "./calc.ts";
import { formatCount } from "./format.ts";
import { defineCopy, tr } from "./i18n.ts";

export type RowKey = "people" | "moments";
export type DeckPos = { row: RowKey; people: number; moments: number };
type Sizes = { people: number; moments: number };

const KEY = "deck.pos.v1";

/** 인연 줄 안의 시작 번호. 0 = 「나」, 사람 k = k+1. upcoming은 가까운 순. */
export function startIndex(personIds: string[], upcoming: { id: string; days: number }[]): number {
  for (const u of upcoming) {
    const i = personIds.indexOf(u.id);
    if (i >= 0) return i + 1;
  }
  return personIds.length > 0 ? 1 : 0;
}

const clamp = (n: number, size: number) => Math.min(n, Math.max(0, size - 1));

/** 모양이 틀리면 null, 번호는 0…size-1로 줄인다. */
export function cleanPos(value: unknown, sizes: Sizes): DeckPos | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.row !== "people" && v.row !== "moments") return null;
  const ok = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;
  if (!ok(v.people) || !ok(v.moments)) return null;
  return { row: v.row, people: clamp(v.people, sizes.people), moments: clamp(v.moments, sizes.moments) };
}

export function readPos(sizes: Sizes): DeckPos | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(KEY);
    return raw ? cleanPos(JSON.parse(raw), sizes) : null;
  } catch {
    return null;
  }
}

export function writePos(pos: DeckPos): void {
  try {
    globalThis.sessionStorage?.setItem(KEY, JSON.stringify(pos));
  } catch {
    // 못 쓰면 위치만 기억 못 한다.
  }
}

const NOTE = defineCopy({
  ko: (age: number, label: string, count: string) => `만 ${age}세까지 ${label} ${count}번`,
  en: (age, label, count) => `${count} ${label} left until ${age}`,
  ja: (age, label, count) => `${age}歳まで${label}はあと${count}回`,
  es: (age, label, count) => `${count} ${label} hasta los ${age}`,
  zh: (age, label, count) => `到${age}岁，${label}还有${count}次`,
});

/** 자란 뒤거나 나이를 모르면 null. 아니면 남은 횟수가 가장 적은 것 하나. */
export function growthNote(growth: GrowthResult): string | null {
  if (growth.grownUp || growth.yearsLeft === null || growth.items.length === 0) return null;
  const least = growth.items.reduce((a, b) => (b.count < a.count ? b : a));
  return tr(NOTE)(growth.adultAge, least.label, formatCount(least.count));
}

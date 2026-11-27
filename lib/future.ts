/*
 * 앞으로 남은 만남 보정: 나이에 따른 감소(감소만)와 「앞으로」 칩의 관계별 배수.
 * 저장소·백업에서 온 값은 cleanAhead로 다듬는다.
 */
import { AGE_SOCIAL_MINUTES, AHEAD_FACTOR, MY_MARRY_FACTOR } from "./futureRules.ts";
import type { Rel } from "./rel.ts";
import type { Ahead } from "./types";

const AHEADS: readonly Ahead[] = ["marry", "child", "health"];

/** 모르는 칩과 중복은 버린다. 비면 undefined. */
export function cleanAhead(value: unknown): Ahead[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = AHEADS.filter((a) => value.includes(a));
  return out.length ? out : undefined;
}

/** 그 관계에 보이고 적용되는 칩. */
export function aheadFor(rel: Rel): Ahead[] {
  return AHEADS.filter((a) => AHEAD_FACTOR[rel][a] !== undefined);
}

/** 나이 감소는 친구·그 밖에만. */
export const ageApplies = (rel: Rel): boolean => rel === "friend" || rel === "other";

const minutesAt = (age: number): number => {
  let m = AGE_SOCIAL_MINUTES[0].minutes;
  for (const row of AGE_SOCIAL_MINUTES) if (age >= row.from) m = row.minutes;
  return m;
};

/** t년 뒤(나이 baseAge + t)까지 거친 연령대 중 가장 작은 값 ÷ 지금 값. 늘지 않는다(≤ 1). */
export function ageFactorAt(baseAge: number, t: number): number {
  const now = minutesAt(baseAge);
  let low = now;
  for (const row of AGE_SOCIAL_MINUTES) if (row.from > baseAge && row.from <= baseAge + t) low = Math.min(low, row.minutes);
  return low / now;
}

/** 내 결혼이 줄이는 관계인지. */
export const myMarryApplies = (rel: Rel): boolean => MY_MARRY_FACTOR[rel] !== undefined;

/**
 * i번째 조각(i년 뒤부터 span년)의 배수. 칩은 내년(i ≥ 1)부터, 나이는 조각 한가운데로 본다.
 * marryIn은 내가 결혼할 때까지 남은 해(결혼 계획). 조각 한가운데가 그 뒤면 반으로.
 */
export function yearFactor(rel: Rel, ahead: Ahead[] | undefined, baseAge: number | null, marryIn: number | null = null): (i: number, span: number) => number {
  const age = baseAge !== null && Number.isFinite(baseAge) && ageApplies(rel) ? baseAge : null;
  const chips = (ahead ?? []).map((a) => AHEAD_FACTOR[rel][a] ?? 1).reduce((x, y) => x * y, 1);
  const mine = marryIn !== null && marryIn > 0 ? MY_MARRY_FACTOR[rel] ?? 1 : 1;
  return (i, span) =>
    (age === null ? 1 : ageFactorAt(age, i + span / 2)) * (i >= 1 ? chips : 1) * (mine !== 1 && i + span / 2 >= marryIn! ? mine : 1);
}

/*
 * 지나온 만남 어림에 쓰는 관계 칩(Bond)과 세부 값(BondDetail).
 * 저장소·백업에서 온 값을 믿지 않고 모양과 범위를 다시 확인한다.
 */
import type { Bond, BondDetail, SchoolStage } from "./types";

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

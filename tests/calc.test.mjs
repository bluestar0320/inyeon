import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DAYS_PER_YEAR,
  computeMarriage,
  computeMoment,
  computeRelationship,
  countOccurrences,
  lifeProgress,
  remainingYears,
  resolveAge,
  toPerYear,
} from "../lib/calc.ts";

const NOW = new Date("2026-01-01T00:00:00Z");

function person(overrides = {}) {
  return {
    id: "p1",
    name: "어머니",
    lifeExpectancy: 80,
    lifeExpectancyManual: false,
    ageYears: 60,
    frequency: { count: 1, unit: "month" },
    filters: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

function profile(overrides = {}) {
  return {
    lifeExpectancy: 83,
    lifeExpectancyManual: false,
    ageYears: 30,
    ...overrides,
  };
}

test("toPerYear normalises every unit to a yearly rate", () => {
  assert.equal(toPerYear({ count: 1, unit: "year" }), 1);
  assert.equal(toPerYear({ count: 1, unit: "month" }), 12);
  assert.equal(toPerYear({ count: 1, unit: "quarter" }), 4);
  assert.equal(toPerYear({ count: 2, unit: "week" }), (2 * DAYS_PER_YEAR) / 7);
  assert.equal(toPerYear({ count: 1, unit: "day" }), DAYS_PER_YEAR);
});

test("toPerYear clamps negative or broken input to zero", () => {
  assert.equal(toPerYear({ count: -3, unit: "week" }), 0);
  assert.equal(toPerYear({ count: Number.NaN, unit: "week" }), 0);
});

test("resolveAge prefers birthDate and falls back to a typed age", () => {
  const age = resolveAge({ birthDate: "1996-01-01" }, NOW);
  assert.ok(Math.abs(age - 30) < 0.05, `expected ~30, got ${age}`);
  assert.equal(resolveAge({ ageYears: 42 }, NOW), 42);
  assert.equal(resolveAge({}, NOW), null);
  // 생년월일이 깨졌으면 직접 입력한 나이로 내려온다.
  assert.equal(resolveAge({ birthDate: "not-a-date", ageYears: 7 }, NOW), 7);
});

test("remainingYears never goes below zero", () => {
  assert.equal(remainingYears({ ageYears: 60, lifeExpectancy: 80 }, NOW), 20);
  assert.equal(remainingYears({ ageYears: 95, lifeExpectancy: 80 }, NOW), 0);
  assert.equal(remainingYears({ lifeExpectancy: 80 }, NOW), null);
});

test("the README example: 어머니 60세 / 수명 80세 / 월 1회 = 240번", () => {
  const result = computeRelationship(person(), profile(), NOW);
  assert.equal(result.sharedYears, 20);
  assert.equal(result.total, 240);
  assert.equal(result.limitedBy, "them");
});

test("my own remaining time can be the binding constraint", () => {
  // 아이는 5세, 나는 70세. 함께할 수 있는 기간은 내 남은 시간으로 잘린다.
  const child = person({ name: "아이", ageYears: 5, lifeExpectancy: 90 });
  const me = profile({ ageYears: 70, lifeExpectancy: 83 });
  const result = computeRelationship(child, me, NOW);
  assert.equal(result.sharedYears, 13);
  assert.equal(result.limitedBy, "me");
  assert.equal(result.total, 13 * 12);
});

test("limitedBy reports 'both' when the two horizons nearly coincide", () => {
  const twin = person({ ageYears: 30, lifeExpectancy: 83.2 });
  const result = computeRelationship(twin, profile(), NOW);
  assert.equal(result.limitedBy, "both");
});

test("a missing profile falls back to the other side's horizon", () => {
  const result = computeRelationship(person(), null, NOW);
  assert.equal(result.sharedYears, 20);
  assert.equal(result.limitedBy, "them");
});

test("interval and together-time are derived from the same count", () => {
  const result = computeRelationship(person({ hoursPerMeeting: 6 }), profile(), NOW);
  assert.ok(Math.abs(result.intervalDays - DAYS_PER_YEAR / 12) < 1e-9);
  assert.equal(result.togetherDays, (240 * 6) / 24);
  assert.equal(computeRelationship(person(), profile(), NOW).togetherDays, null);
});

test("fractional horizons only count the part of the final year that fits", () => {
  const result = countOccurrences({ years: 2.5, perYear: 10 });
  assert.equal(result.total, 25);
  assert.equal(result.slices.length, 3);
  assert.equal(result.slices[2].span, 0.5);
});

test("multiplier filters scale the whole horizon", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [{ id: "f", label: "절반", enabled: true, kind: "multiplier", factor: 0.5 }],
  });
  assert.equal(result.baselineTotal, 100);
  assert.equal(result.total, 50);
});

test("disabled filters are ignored", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [{ id: "f", label: "꺼둠", enabled: false, kind: "multiplier", factor: 0.5 }],
  });
  assert.equal(result.total, 100);
});

test("decay shrinks each year and stays under the flat baseline", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [{ id: "f", label: "지구온난화", enabled: true, kind: "decay", ratePerYear: 0.1 }],
  });
  assert.equal(result.baselineTotal, 100);
  assert.ok(result.total < 100);
  assert.ok(result.total > 60);
  // 해가 갈수록 단조 감소해야 한다.
  for (let i = 1; i < result.slices.length; i += 1) {
    assert.ok(result.slices[i].adjusted < result.slices[i - 1].adjusted);
  }
});

test("a negative decay rate models something that gets more frequent", () => {
  const result = countOccurrences({
    years: 5,
    perYear: 10,
    filters: [{ id: "f", label: "증가", enabled: true, kind: "decay", ratePerYear: -0.1 }],
  });
  assert.ok(result.total > result.baselineTotal);
});

test("an 'only' window keeps just the years inside it, partial years included", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [
      { id: "f", label: "3~5.5년차만", enabled: true, kind: "window", mode: "only", fromYear: 3, toYear: 5.5 },
    ],
  });
  assert.equal(result.total, 25);
});

test("an 'except' window removes exactly the years inside it", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [
      { id: "f", label: "유학 3년", enabled: true, kind: "window", mode: "except", fromYear: 2, toYear: 5 },
    ],
  });
  assert.equal(result.total, 70);
});

test("cap truncates the total without touching the baseline", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [{ id: "f", label: "상한", enabled: true, kind: "cap", maxTotal: 30 }],
  });
  assert.equal(result.baselineTotal, 100);
  assert.equal(result.total, 30);
  assert.equal(result.cappedAt, 30);
});

test("a cap above the total leaves it alone", () => {
  const result = countOccurrences({
    years: 10,
    perYear: 10,
    filters: [{ id: "f", label: "상한", enabled: true, kind: "cap", maxTotal: 500 }],
  });
  assert.equal(result.total, 100);
  assert.equal(result.cappedAt, null);
});

test("filters compose: a window clips the horizon and decay thins what's left", () => {
  const result = countOccurrences({
    years: 20,
    perYear: 12,
    filters: [
      { id: "w", label: "70세까지", enabled: true, kind: "window", mode: "only", fromYear: 0, toYear: 10 },
      { id: "d", label: "체력 저하", enabled: true, kind: "decay", ratePerYear: 0.05 },
    ],
  });
  const windowOnly = countOccurrences({
    years: 20,
    perYear: 12,
    filters: [
      { id: "w", label: "70세까지", enabled: true, kind: "window", mode: "only", fromYear: 0, toYear: 10 },
    ],
  });
  assert.equal(windowOnly.total, 120);
  assert.ok(result.total < windowOnly.total);
  assert.ok(result.total > 90);
});

test("a zero-length horizon yields nothing rather than NaN", () => {
  const result = countOccurrences({ years: 0, perYear: 12 });
  assert.equal(result.total, 0);
  assert.equal(result.slices.length, 0);
  assert.equal(result.baselineTotal, 0);
});

test("someone already past their life expectancy has no meetings left", () => {
  const result = computeRelationship(person({ ageYears: 92 }), profile(), NOW);
  assert.equal(result.sharedYears, 0);
  assert.equal(result.total, 0);
});

test("moment horizons resolve against the profile", () => {
  const moment = {
    id: "m1",
    title: "벚꽃",
    frequency: { count: 1, unit: "year" },
    horizon: { kind: "life" },
    filters: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
  assert.equal(computeMoment(moment, profile(), NOW).total, 53);
  assert.equal(computeMoment({ ...moment, horizon: { kind: "untilAge", age: 40 } }, profile(), NOW).total, 10);
  assert.equal(computeMoment({ ...moment, horizon: { kind: "years", years: 4 } }, profile(), NOW).total, 4);
  // 프로필이 없으면 기간을 알 수 없으므로 0으로 세되 horizonYears로 그 사실을 알린다.
  const unknown = computeMoment(moment, null, NOW);
  assert.equal(unknown.horizonYears, null);
  assert.equal(unknown.total, 0);
});

test("untilAge in the past does not go negative", () => {
  const moment = {
    id: "m1",
    title: "지난 목표",
    frequency: { count: 1, unit: "year" },
    horizon: { kind: "untilAge", age: 20 },
    filters: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
  assert.equal(computeMoment(moment, profile(), NOW).total, 0);
});

function marriagePlan(overrides = {}) {
  return {
    targetAge: 35,
    frequency: { count: 1, unit: "month" },
    filters: [],
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

test("the concept example: 30세, 목표 35세, 월 1회 소개팅 = 60번의 기회", () => {
  const result = computeMarriage(marriagePlan(), profile(), NOW);
  assert.equal(result.yearsLeft, 5);
  assert.equal(result.total, 60);
  assert.equal(result.targetPassed, false);
});

test("marriage frequency presets from the concept all resolve", () => {
  const at = (frequency) => computeMarriage(marriagePlan({ frequency }), profile(), NOW).total;
  assert.equal(at({ count: 1, unit: "year" }), 5);
  assert.equal(at({ count: 1, unit: "month" }), 60);
  assert.ok(Math.abs(at({ count: 1, unit: "week" }) - (5 * DAYS_PER_YEAR) / 7) < 1e-9);
});

test("a target age already passed yields zero and says so", () => {
  const result = computeMarriage(marriagePlan({ targetAge: 25 }), profile(), NOW);
  assert.equal(result.yearsLeft, 0);
  assert.equal(result.total, 0);
  assert.equal(result.targetPassed, true);
});

test("a target age exactly at the current age counts as passed, not as unknown", () => {
  const result = computeMarriage(marriagePlan({ targetAge: 30 }), profile({ ageYears: 30 }), NOW);
  assert.equal(result.total, 0);
  assert.equal(result.targetPassed, true);
  assert.equal(result.yearsLeft, 0);
});

test("without a profile the horizon is unknown rather than zero-but-passed", () => {
  const result = computeMarriage(marriagePlan(), null, NOW);
  assert.equal(result.yearsLeft, null);
  assert.equal(result.total, 0);
  // 나이를 몰라서 못 센 것이지 목표를 지난 것이 아니다 — 화면 문구가 갈리는 지점.
  assert.equal(result.targetPassed, false);
});

test("marriage plans take the same filters as everything else", () => {
  const result = computeMarriage(
    marriagePlan({
      filters: [
        { id: "f", label: "바빠지는 해", enabled: true, kind: "decay", ratePerYear: 0.2 },
      ],
    }),
    profile(),
    NOW,
  );
  assert.equal(result.baselineTotal, 60);
  assert.ok(result.total < 60);
  assert.ok(result.total > 30);
});

test("marriage interval is derived from the same frequency", () => {
  const result = computeMarriage(marriagePlan(), profile(), NOW);
  assert.ok(Math.abs(result.intervalDays - DAYS_PER_YEAR / 12) < 1e-9);
  const never = computeMarriage(
    marriagePlan({ frequency: { count: 0, unit: "month" } }),
    profile(),
    NOW,
  );
  assert.equal(never.intervalDays, null);
  assert.equal(never.total, 0);
});

test("lifeProgress is a clamped 0..1 ratio", () => {
  assert.ok(Math.abs(lifeProgress({ ageYears: 30, lifeExpectancy: 60 }, NOW) - 0.5) < 1e-9);
  assert.equal(lifeProgress({ ageYears: 90, lifeExpectancy: 60 }, NOW), 1);
  assert.equal(lifeProgress({ lifeExpectancy: 60 }, NOW), null);
  assert.equal(lifeProgress({ ageYears: 30, lifeExpectancy: 0 }, NOW), null);
});

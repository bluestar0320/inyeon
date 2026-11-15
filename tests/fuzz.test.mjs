/*
 * 계산 엔진에 무작위 값을 수천 번 넣어 본다.
 *
 * 사람이 적는 테스트는 떠올린 경우만 본다. 여기서는 음수, 0, 아주 큰 수, 소수, NaN,
 * 빠진 필드, 망가진 날짜, 미래 날짜를 섞어 던지고 "절대 깨지면 안 되는 것"만 확인한다:
 * 예외가 나지 않고, 결과가 유한하고 음수가 아니며, 상한을 넘지 않는다.
 *
 * 씨앗을 고정해 두어 실패하면 같은 입력으로 다시 재현된다. FUZZ_RUNS로 횟수를 늘린다.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeGrowth,
  computeMarriage,
  computeMoment,
  computePast,
  computeRelationship,
  countOccurrences,
  lifeProgress,
  remainingYears,
  resolveAge,
} from "../lib/calc.ts";
import { cleanBondDetail, cleanBonds, estimatePast } from "../lib/bonds.ts";
import { lookupLifeExpectancy, refreshLifeSpan } from "../lib/lifeExpectancy.ts";

const RUNS = Number(process.env.FUZZ_RUNS ?? 2000);
const NOW = new Date("2026-09-28T12:00:00");

// mulberry32 — 씨앗이 같으면 같은 수열.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maker(seed) {
  const r = rng(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const num = () =>
    pick([
      () => 0,
      () => -r() * 100,
      () => r() * 10,
      () => r() * 130,
      () => Math.round(r() * 100),
      () => 1e9,
      () => Number.NaN,
      () => Number.POSITIVE_INFINITY,
      () => 0.0001,
      () => undefined,
    ])();
  const date = () =>
    pick([
      () => undefined,
      () => "",
      () => "어제",
      () => "2026-02-30",
      () => "2030-01-01",
      () => "1900-01-01",
      () => "2024-02-29",
      () => `${1930 + Math.floor(r() * 96)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`,
    ])();
  const frequency = () => ({ count: num(), unit: pick(["day", "week", "month", "quarter", "year"]) });
  const filter = () => ({
    id: String(r()),
    label: "",
    enabled: r() > 0.2,
    kind: pick(["multiplier", "decay", "window", "cap"]),
    factor: num(),
    ratePerYear: pick([num(), r() * 2 - 0.5]),
    fromYear: num(),
    toYear: pick([num(), undefined]),
    mode: pick(["only", "except", undefined]),
    maxTotal: num(),
  });
  const span = () => ({
    ageYears: num(),
    ageAsOf: date(),
    birthDate: r() > 0.6 ? date() : undefined,
    lifeExpectancy: num(),
    lifeExpectancyManual: r() > 0.5,
    countryCode: pick(["KR", "JP", "TW", "HK", "US", "ZZ", undefined]),
    sex: pick(["male", "female", "all", undefined]),
    health: r() > 0.5 ? { smoking: pick(["good", "mid", "bad"]), exercise: pick(["good", "bad"]) } : undefined,
  });
  const filters = () => Array.from({ length: Math.floor(r() * 4) }, filter);
  return {
    r,
    pick,
    num,
    frequency,
    filters,
    date,
    profile: () => (r() > 0.1 ? span() : null),
    person: () => ({
      ...span(),
      id: "p",
      name: "x",
      frequency: frequency(),
      filters: filters(),
      hoursPerMeeting: r() > 0.5 ? num() : undefined,
      horizon: pick([
        undefined,
        { kind: "life" },
        { kind: "untilMyAge", age: num() },
        { kind: "years", years: num() },
      ]),
      growth: r() > 0.7 ? { adultAge: num(), dinners: frequency() } : undefined,
      since: date(),
      bonds: r() > 0.5 ? [pick(["parent", "grandparent", "sibling", "school", "coworker"])] : undefined,
      relation: pick(["친구", "아들", "어머니", "", undefined, "friend"]),
      ahead: pick([
        () => undefined,
        () => ["marry", "child", "health"].filter(() => r() > 0.5),
        () => ["x", 1, null, "marry", "marry"],
        () => "marry",
        () => ({}),
      ])(),
    }),
    moment: () => ({
      id: "m",
      title: "x",
      frequency: frequency(),
      filters: filters(),
      horizon: pick([{ kind: "life" }, { kind: "untilAge", age: num() }, { kind: "years", years: num() }]),
      since: date(),
    }),
    marriage: () => ({ targetAge: num(), frequency: frequency(), filters: filters() }),
  };
}

/** null이거나, 유한하고 음수가 아닌 수. */
function sane(value, what) {
  if (value === null) return;
  assert.ok(Number.isFinite(value), `${what}이(가) ${value}`);
  assert.ok(value >= 0, `${what}이(가) 음수 ${value}`);
}

function checkCount(result, what) {
  sane(result.total, `${what}.total`);
  sane(result.baselineTotal, `${what}.baselineTotal`);
  assert.ok(result.slices.length <= 150, `${what} 조각 ${result.slices.length}개`);
  if (result.cappedAt !== null) assert.ok(result.total <= result.cappedAt + 1e-9, `${what} 상한 초과`);
}

test(`무작위 입력 ${RUNS}번에도 계산이 깨지지 않는다`, () => {
  for (let seed = 1; seed <= RUNS; seed += 1) {
    const m = maker(seed);
    try {
      const profile = m.profile();
      const person = m.person();

      sane(resolveAge(person, NOW), "나이");
      sane(remainingYears(person, NOW), "남은 기간");
      const progress = lifeProgress(person, NOW);
      if (progress !== null) assert.ok(progress >= 0 && progress <= 1, `진행률 ${progress}`);

      const rel = computeRelationship(person, profile, NOW);
      checkCount(rel, "인연");
      sane(rel.togetherDays, "함께 보낼 시간");

      checkCount(computeMoment(m.moment(), profile, NOW), "순간");
      checkCount(computeMarriage(m.marriage(), profile, NOW), "결혼");

      const growth = computeGrowth(person, NOW);
      if (growth) for (const item of growth.items) sane(item.count, `성장.${item.key}`);

      const past = computePast(m.frequency(), m.date(), NOW);
      if (past) sane(past.count, "지나온 횟수");

      const expectancy = lookupLifeExpectancy(person.countryCode, person.sex, resolveAge(person, NOW), person.health);
      assert.ok(Number.isFinite(expectancy) && expectancy > 0, `예상 수명 ${expectancy}`);
      refreshLifeSpan(person, NOW);
    } catch (error) {
      error.message = `씨앗 ${seed}: ${error.message}`;
      throw error;
    }
  }
});

test("필터가 없으면 빈도를 늘렸을 때 횟수가 줄지 않는다", () => {
  for (let seed = 1; seed <= RUNS; seed += 1) {
    const m = maker(seed);
    const years = m.r() * 100;
    const perYear = m.r() * 200;
    const a = countOccurrences({ years, perYear }).total;
    const b = countOccurrences({ years, perYear: perYear * (1 + m.r()) }).total;
    assert.ok(b >= a - 1e-9, `씨앗 ${seed}: ${a} → ${b}`);
  }
});

test("관계 칩·세부 값 다듬기는 무엇이 들어와도 깨지지 않는다", () => {
  for (let seed = 1; seed <= RUNS; seed += 1) {
    const m = maker(seed);
    const any = () => m.pick([m.num, () => "high", () => null, () => ({}), () => [], () => true, () => m.date()])();
    const obj = (keys) => Object.fromEntries(keys.map((k) => [k, any()]));
    try {
      cleanBonds(m.pick([any, () => Array.from({ length: 5 }, any)])());
      const d = cleanBondDetail(
        m.pick([
          any,
          () => ({
            schoolYears: m.pick([any, () => obj(["elementary", "middle", "high"])])(),
            academy: m.pick([any, () => obj(["years", "perWeek"])])(),
            military: m.pick([any, () => obj(["me", "them"])])(),
            livedUntilAge: any(),
            livesTogether: any(),
            workEndYear: any(),
            schoolShift: any(),
          }),
        ])(),
      );
      if (d?.academy) assert.ok(d.academy.years > 0 && d.academy.years <= 20 && d.academy.perWeek >= 1 && d.academy.perWeek <= 7);
    } catch (error) {
      error.message = `씨앗 ${seed}: ${error.message}`;
      throw error;
    }
  }
});

test("지나온 만남 어림은 무엇이 들어와도 null이거나 유한하고 0 이상이다", () => {
  const all = ["elementary", "middle", "high", "university", "academy", "coworker", "parent", "grandparent", "sibling"];
  const until = [NOW, new Date("2040-01-01T00:00:00"), new Date("1990-06-01T00:00:00")];
  for (let seed = 1; seed <= RUNS; seed += 1) {
    const m = maker(seed);
    const any = () => m.pick([m.num, () => 1950 + Math.floor(m.r() * 100), () => true, () => -1, () => 1])();
    const birth = () => m.pick([() => null, m.num, () => 1940 + Math.floor(m.r() * 90)])();
    try {
      const bonds = all.filter(() => m.r() > 0.7);
      // 다듬은 값과 다듬지 않은 값을 둘 다 던진다.
      const raw = {
        schoolYears: { elementary: any(), middle: any(), high: any() },
        academy: m.r() > 0.5 ? { years: any(), perWeek: any() } : undefined,
        military: { me: any(), them: any() },
        livedUntilAge: any(),
        livesTogether: m.r() > 0.5,
        workEndYear: any(),
        schoolShift: m.pick([-1, 0, 1]),
      };
      const detail = m.pick([() => undefined, () => cleanBondDetail(raw), () => raw])();
      const r = estimatePast({ bonds, detail, frequency: m.frequency(), since: m.date(), myBirthYear: birth(), theirBirthYear: birth(), until: m.pick(until) });
      if (r !== null) {
        sane(r.count, "어림");
        for (const l of r.lines) assert.ok(Number.isFinite(l.count) && Number.isFinite(l.from) && Number.isFinite(l.to), `줄 ${JSON.stringify(l)}`);
      }
    } catch (error) {
      error.message = `씨앗 ${seed}: ${error.message}`;
      throw error;
    }
  }
});

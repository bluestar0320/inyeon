import assert from "node:assert/strict";
import { test } from "node:test";

import { remainingYears, resolveAge } from "../lib/calc.ts";
import { refreshLifeSpan } from "../lib/lifeExpectancy.ts";

const NOW = new Date("2026-09-20T12:00:00");
const IN_5Y = new Date("2031-09-20T12:00:00");

function span(extra = {}) {
  return {
    lifeExpectancy: 81.6,
    lifeExpectancyManual: false,
    countryCode: "KR",
    sex: "male",
    ...extra,
  };
}

test("나이만 적어도 시간이 흐르면 같이 늙는다", () => {
  // 이 앱의 존재 이유가 남은 날을 세는 것인데, 남은 날이 안 줄어들고 있었다.
  const s = span({ ageYears: 38, ageAsOf: "2026-09-20" });
  assert.equal(Math.round(resolveAge(s, NOW)), 38);
  assert.equal(Math.round(resolveAge(s, IN_5Y)), 43);
});

test("남은 시간도 같이 줄어든다", () => {
  const s = span({ ageYears: 38, ageAsOf: "2026-09-20" });
  const now = remainingYears(s, NOW);
  const later = remainingYears(s, IN_5Y);
  assert.ok(now - later > 4.9 && now - later < 5.1, `5년이 줄어야 하는데 ${(now - later).toFixed(2)}년`);
});

test("적어 넣은 날 하루 동안은 적은 그대로다", () => {
  // 소수점이 한 톨이라도 붙으면 올림 경계를 넘겨 사고가 난다.
  // (결혼 계획 기본 목표 나이가 35세에서 40세로 밀려 60번이 120번이 됐었다)
  const s = span({ ageYears: 30, ageAsOf: "2026-09-20" });
  assert.equal(resolveAge(s, new Date("2026-09-20T00:00:00")), 30);
  assert.equal(resolveAge(s, new Date("2026-09-20T23:59:59")), 30);
  // 다음 날 하루치만 오른다.
  assert.ok(Math.abs(resolveAge(s, new Date("2026-09-21T09:00:00")) - 30 - 1 / 365.2425) < 1e-9);
});

test("적어 넣은 날짜가 없는 옛 기록은 예전처럼 동작한다", () => {
  const s = span({ ageYears: 38 });
  assert.equal(resolveAge(s, NOW), 38);
  assert.equal(resolveAge(s, IN_5Y), 38);
});

test("기기 시계가 과거로 틀어져도 젊어지지 않는다", () => {
  const s = span({ ageYears: 38, ageAsOf: "2026-09-20" });
  assert.equal(resolveAge(s, new Date("2020-01-01")), 38);
});

test("망가진 날짜는 무시하고 적어 둔 나이를 쓴다", () => {
  assert.equal(resolveAge(span({ ageYears: 38, ageAsOf: "어제" }), IN_5Y), 38);
});

test("생년월일이 있으면 그쪽이 이긴다", () => {
  const s = span({ birthDate: "1988-09-20", ageYears: 99, ageAsOf: "2026-09-20" });
  assert.equal(Math.round(resolveAge(s, NOW)), 38);
});

test("예상 수명이 나이를 따라 다시 구해진다", () => {
  // 저장값 81.6을 그대로 두면 68세에 13.6년이라고 말한다. 맞는 값은 17년대다.
  const stale = span({ ageYears: 68, ageAsOf: "2026-09-20", lifeExpectancy: 81.6 });
  const fixed = refreshLifeSpan(stale, NOW);
  assert.ok(fixed.lifeExpectancy > 84, `68세 예상 수명이 ${fixed.lifeExpectancy}세`);
  const before = remainingYears(stale, NOW);
  const after = remainingYears(fixed, NOW);
  assert.ok(after - before > 3, `${before.toFixed(1)}년 → ${after.toFixed(1)}년`);
});

test("직접 고친 예상 수명은 덮어쓰지 않는다", () => {
  const mine = span({ ageYears: 68, ageAsOf: "2026-09-20", lifeExpectancy: 95, lifeExpectancyManual: true });
  assert.equal(refreshLifeSpan(mine, NOW).lifeExpectancy, 95);
});

test("생활 습관도 다시 구할 때 반영된다", () => {
  const s = span({ ageYears: 40, ageAsOf: "2026-09-20", health: { smoking: "bad" } });
  const plain = span({ ageYears: 40, ageAsOf: "2026-09-20" });
  assert.ok(refreshLifeSpan(s, NOW).lifeExpectancy < refreshLifeSpan(plain, NOW).lifeExpectancy);
});

test("바뀔 게 없으면 같은 객체를 그대로 돌려준다", () => {
  const s = refreshLifeSpan(span({ ageYears: 38, ageAsOf: "2026-09-20" }), NOW);
  assert.equal(refreshLifeSpan(s, NOW), s);
});

test("나이를 모르면 손대지 않는다", () => {
  const s = span();
  assert.equal(refreshLifeSpan(s, NOW), s);
});

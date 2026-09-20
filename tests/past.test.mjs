import assert from "node:assert/strict";
import { test } from "node:test";

import { computePast } from "../lib/calc.ts";

const NOW = new Date("2026-09-21T12:00:00");
const weekly = { count: 1, unit: "week" };
const monthly = { count: 1, unit: "month" };

test("시작점이 없으면 세지 않는다 — 모르는 것을 지어내지 않는다", () => {
  assert.equal(computePast(weekly, undefined, NOW), null);
  assert.equal(computePast(weekly, "", NOW), null);
});

test("망가진 날짜도 세지 않는다", () => {
  assert.equal(computePast(weekly, "작년쯤", NOW), null);
});

test("시작한 날 당일은 0번이다", () => {
  const r = computePast(weekly, "2026-09-21", NOW);
  assert.equal(r.count, 0);
  assert.equal(r.years, 0);
});

test("1년이면 주 1회는 52번쯤", () => {
  const r = computePast(weekly, "2025-09-21", NOW);
  assert.ok(Math.abs(r.count - 52) < 0.3, `${r.count.toFixed(1)}번`);
  assert.ok(Math.abs(r.years - 1) < 0.01);
});

test("16년 동안 월 1회면 192번쯤", () => {
  const r = computePast(monthly, "2010-09-21", NOW);
  assert.ok(Math.abs(r.count - 192) < 2, `${r.count.toFixed(0)}번`);
});

test("미래 날짜는 세지 않는다 — 음수가 나오면 안 된다", () => {
  assert.equal(computePast(weekly, "2030-01-01", NOW), null);
});

test("앞으로 세는 것과 같은 방식이다", () => {
  // 같은 빈도, 같은 기간이면 뒤와 앞의 숫자가 같아야 한다.
  const past = computePast(weekly, "2016-09-21", NOW);
  assert.ok(Math.abs(past.years - 10) < 0.02, `${past.years.toFixed(2)}년`);
  assert.ok(Math.abs(past.count - 521) < 3, `${past.count.toFixed(0)}번`);
});

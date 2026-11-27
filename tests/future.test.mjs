import assert from "node:assert/strict";
import { test } from "node:test";

import { aheadFor, ageFactorAt, cleanAhead, yearFactor } from "../lib/future.ts";
import { relOf } from "../lib/story.ts";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !~ ${b}`);

test("cleanAhead: 모르는 값·중복 버림, 비면 undefined", () => {
  assert.deepEqual(cleanAhead(["marry", "x", "marry", 3, "health"]), ["marry", "health"]);
  assert.equal(cleanAhead([]), undefined);
  assert.equal(cleanAhead("marry"), undefined);
});
test("관계별 칩", () => {
  assert.deepEqual(aheadFor("friend"), ["marry", "child", "health"]);
  assert.deepEqual(aheadFor("sibling"), ["marry", "child", "health"]);
  assert.deepEqual(aheadFor("child"), ["marry", "health"]);
  assert.deepEqual(aheadFor("partner"), ["health"]);
  assert.deepEqual(aheadFor("parent"), ["health"]);
  assert.deepEqual(aheadFor("grandparent"), ["health"]);
});
test("나이 감소: 감소만, 10년 계단", () => {
  assert.equal(ageFactorAt(25, 4.5), 1);          // 29.5세
  near(ageFactorAt(25, 5.5), 0.9);                // 30대 18/20
  near(ageFactorAt(25, 25.5), 0.9);               // 50대 23이어도 늘지 않음
  near(ageFactorAt(15, 6), 20 / 28);
  near(ageFactorAt(15, 16), 18 / 28);
  assert.equal(ageFactorAt(35, 30), 1);
  assert.equal(ageFactorAt(45, 10), 1);
});
test("yearFactor: 칩은 내년부터, 관계별 배수", () => {
  const f = yearFactor("friend", ["marry", "child"], 40);
  assert.equal(f(0, 1), 1);
  near(f(1, 1), 0.25);
  near(yearFactor("parent", ["health", "marry"], 40)(1, 1), 2);   // marry 무시
  near(yearFactor("partner", ["health"], 40)(2, 1), 2);
  near(yearFactor("sibling", ["health"], 40)(2, 1), 0.5);
  near(yearFactor("parent", undefined, 25)(10, 1), 1);            // 부모님은 나이 감소 없음
  near(yearFactor("friend", undefined, 25)(10, 1), 0.9);
  assert.equal(yearFactor("friend", undefined, null)(10, 1), 1);
  assert.equal(yearFactor("friend", undefined, NaN)(10, 1), 1);
});
test("relOf는 story.ts에서 그대로 쓸 수 있다", () => {
  assert.equal(relOf({ bonds: ["parent"] }), "parent");
});

test("연령대 경계와 이상 값", () => {
  assert.ok(Math.abs(ageFactorAt(25, 5) - 0.9) < 1e-9);
  assert.equal(ageFactorAt(25, -3), 1);
  assert.equal(yearFactor("friend", undefined, Number.NaN)(5, 1), 1);
  assert.equal(yearFactor("friend", ["marry"], Number.NaN)(5, 1), 0.5);
});

test("친구의 나이 감소와 칩이 함께 곱해진다, 그 밖에도 나이 감소", () => {
  assert.ok(Math.abs(yearFactor("friend", ["marry"], 25)(10, 1) - 0.45) < 1e-9);
  assert.ok(yearFactor("other", undefined, 25)(10, 1) < 1);
});

test("yearFactor: 내 결혼(marryIn)부터 친구·형제·그 밖만 반으로, 이미 지났으면 그대로", () => {
  const f = yearFactor("friend", undefined, null, 3);
  assert.equal(f(1, 1), 1);
  assert.equal(f(3, 1), 0.5);
  assert.equal(yearFactor("parent", undefined, null, 3)(5, 1), 1);
  assert.equal(yearFactor("friend", undefined, null, null)(5, 1), 1);
  assert.equal(yearFactor("friend", ["marry"], null, 3)(5, 1), 0.25);
});

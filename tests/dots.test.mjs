import assert from "node:assert/strict";
import { test } from "node:test";

import { dotsFor } from "../lib/dots.ts";

test("100번 이하면 점 하나가 한 번이다", () => {
  assert.deepEqual(dotsFor(0, 37), { unit: 1, past: 0, left: 37 });
  assert.deepEqual(dotsFor(60, 40), { unit: 1, past: 60, left: 40 });
});

test("많으면 1·2·5 단위로 묶어 점이 100개 안팎이 되게 한다", () => {
  assert.deepEqual(dotsFor(0, 150), { unit: 2, past: 0, left: 75 });
  assert.deepEqual(dotsFor(1100, 100), { unit: 20, past: 55, left: 5 });
  const big = dotsFor(0, 123456);
  assert.equal(big.unit, 2000);
  assert.ok(big.left <= 100);
});

test("남은 게 조금이라도 있으면 점 하나는 남긴다 — 0개로 보이면 안 된다", () => {
  assert.equal(dotsFor(5000, 3).left, 1);
});

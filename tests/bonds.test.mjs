import assert from "node:assert/strict";
import { test } from "node:test";

import { cleanBondDetail, cleanBonds } from "../lib/bonds.ts";

test("모르는 칩과 중복은 버리고, 비면 undefined", () => {
  assert.deepEqual(cleanBonds(["high", "x", "high", 3]), ["high"]);
  assert.equal(cleanBonds([]), undefined);
  assert.equal(cleanBonds("high"), undefined);
});
test("세부 값은 범위에 묶고 망가진 건 버린다", () => {
  const d = cleanBondDetail({ schoolYears: { elementary: 9, middle: -1, high: 2 }, academy: { years: 999, perWeek: 2 }, military: { me: 1800, them: 2014 }, livedUntilAge: -3, schoolShift: 5 });
  assert.deepEqual(d.schoolYears, { elementary: 6, high: 2 }); // 6을 넘으면 6, 음수는 버림
  assert.equal(d.academy.years, 20);                           // 학원은 20년까지
  assert.deepEqual(d.military, { them: 2014 });                // 1950년 이전·미래 해는 버림
  assert.equal(d.livedUntilAge, undefined);
  assert.equal(d.schoolShift, undefined);
  assert.equal(cleanBondDetail(null), undefined);
});
test("0은 남기고, 비면 키를 뺀다", () => {
  assert.deepEqual(cleanBondDetail({ schoolYears: { middle: 0 }, livesTogether: false, livedUntilAge: 0 }), { schoolYears: { middle: 0 }, livesTogether: false, livedUntilAge: 0 });
  assert.equal(cleanBondDetail({ schoolYears: { high: -2 }, academy: { years: 0, perWeek: 3 }, livesTogether: "y" }), undefined);
});

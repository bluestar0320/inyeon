import assert from "node:assert/strict";
import { test } from "node:test";

import { HEALTH_FACTORS, healthAgeOffset, healthBreakdown } from "../lib/health.ts";
import { lookupLifeExpectancy } from "../lib/lifeExpectancy.ts";

test("아무것도 고르지 않으면 보정이 없다", () => {
  assert.equal(healthAgeOffset(undefined), 0);
  assert.equal(healthAgeOffset({}), 0);
  // 기능이 생겼다고 기존 사용자의 숫자가 달라지면 안 된다.
  assert.equal(
    lookupLifeExpectancy("KR", "female", 38, undefined),
    lookupLifeExpectancy("KR", "female", 38),
  );
});

test("좋은 쪽만 고르면 0이거나 음수다", () => {
  assert.equal(healthAgeOffset({ smoking: "good", drinking: "good" }), 0);
  assert.equal(healthAgeOffset({ exercise: "good" }), -2);
});

test("흡연이 가장 크다", () => {
  assert.equal(healthAgeOffset({ smoking: "bad" }), 10);
  assert.equal(healthAgeOffset({ smoking: "mid" }), 3);
  // 근거가 약한 항목들을 다 합쳐도 흡연 하나를 넘지 못한다.
  assert.ok(healthAgeOffset({ drinking: "bad", exercise: "bad" }) < 10);
});

test("합계에 상한이 있다", () => {
  const worst = { smoking: "bad", drinking: "bad", exercise: "bad" };
  assert.equal(healthAgeOffset(worst), 14);
  // 좋은 쪽을 다 골라도 보태 주는 건 운동 하나뿐이다. 깎아 주는 쪽은 인색하게 둔다.
  const best = { smoking: "good", drinking: "good", exercise: "good" };
  assert.equal(healthAgeOffset(best), -2);
});

test("모르는 값은 0으로 우기지 않고 무시한다", () => {
  assert.equal(healthAgeOffset({ smoking: "unknown" }), 0);
  assert.equal(healthBreakdown({ smoking: "unknown" }).length, 0);
});

test("내역에는 0이 아닌 항목만 남는다", () => {
  const rows = healthBreakdown({ smoking: "bad", drinking: "good", exercise: "bad" });
  assert.deepEqual(
    rows.map((r) => [r.key, r.offsetYears]),
    [
      ["smoking", 10],
      ["exercise", 2],
    ],
  );
});

test("흡연은 수명을 줄이지만 10년을 통째로 빼지는 않는다", () => {
  const base = lookupLifeExpectancy("KR", "male", 38);
  const smoker = lookupLifeExpectancy("KR", "male", 38, { smoking: "bad" });
  assert.ok(smoker < base, "흡연자가 더 짧아야 한다");
  const lost = base - smoker;
  assert.ok(lost > 4 && lost < 10, `38세 손실이 ${lost.toFixed(1)}년 — 4~10년 사이여야 한다`);
});

test("같은 흡연이라도 고령일수록 덜 깎인다", () => {
  const lossAt = (age) =>
    lookupLifeExpectancy("KR", "male", age) -
    lookupLifeExpectancy("KR", "male", age, { smoking: "bad" });
  // 이미 살아낸 몫을 다시 빼지 않는다는 것이 이 설계의 핵심이다.
  assert.ok(lossAt(30) > lossAt(60), "30세 손실이 60세보다 커야 한다");
  assert.ok(lossAt(60) > lossAt(85), "60세 손실이 85세보다 커야 한다");
});

test("운동은 수명을 늘린다", () => {
  assert.ok(
    lookupLifeExpectancy("KR", "all", 40, { exercise: "good" }) >
      lookupLifeExpectancy("KR", "all", 40),
  );
});

test("나이를 모르면 보정하지 않는다", () => {
  assert.equal(
    lookupLifeExpectancy("KR", "all", null, { smoking: "bad" }),
    lookupLifeExpectancy("KR", "all", null),
  );
});

test("아주 어린 나이에서도 조회 나이가 음수로 내려가지 않는다", () => {
  const v = lookupLifeExpectancy("KR", "all", 1, { exercise: "good" });
  assert.ok(Number.isFinite(v) && v > 1);
});

test("표의 모든 선택지가 화면에 쓸 수 있는 꼴이다", () => {
  for (const factor of HEALTH_FACTORS) {
    assert.ok(factor.basis.length > 10, `${factor.key}: 근거 문구가 있어야 한다`);
    assert.equal(new Set(factor.options.map((o) => o.level)).size, factor.options.length);
  }
});

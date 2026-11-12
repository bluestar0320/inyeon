import assert from "node:assert/strict";
import { test } from "node:test";

import { cleanBondDetail, cleanBonds, estimatePast, livedTogetherCount } from "../lib/bonds.ts";

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

const UNTIL = new Date("2026-11-12T12:00:00");
const monthly = { count: 1, unit: "month" };
const near = (a, b, tol = 3) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("1993년생 초등 친구, 매달 1번: 1,044 + 248 ≈ 1,292", () => {
  const r = estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "elementary").count, 1044);
  near(r.lines.find((l) => l.kind === "after").count, 248);
  near(r.count, 1292);
});
test("어머니: 같이 산 19년 × 329 = 6,251, 그 뒤 매달 1번", () => {
  const r = estimatePast({ bonds: ["parent"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "together").count, 19 * 365 * 0.9, 2); // 약 6,242(화면 예시 6,251은 329로 반올림한 값)
  near(r.count, 19 * 365 * 0.9 + 176, 4);
});
test("형제자매 + 같은 초등학교: 겹친 해는 큰 쪽(329)만", () => {
  const both = estimatePast({ bonds: ["sibling", "elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: 1993, until: UNTIL });
  const sib = estimatePast({ bonds: ["sibling"], frequency: monthly, myBirthYear: 1993, theirBirthYear: 1993, until: UNTIL });
  near(both.count, sib.count, 1);
});
test("학원은 위에 더한다(비우면 1년 주 2번 = 104)", () => {
  const a = estimatePast({ bonds: ["elementary", "academy"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  const b = estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  assert.equal(Math.round(a.count - b.count), 104);
});
test("군 복무는 비우면 빼지 않고, 둘 다 가서 겹치면 한 번만 뺀다", () => {
  const base = { bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL };
  const none = estimatePast(base).count;
  const me = estimatePast({ ...base, detail: { military: { me: 2013 } } }).count;
  const both = estimatePast({ ...base, detail: { military: { me: 2013, them: 2013 } } }).count;
  near(none - me, 21, 1);   // 21개월 × 매달 1번
  near(me, both, 0.5);
});
test("프로필 나이가 없으면 null(기존 방식으로 돌아간다)", () => {
  assert.equal(estimatePast({ bonds: ["high"], frequency: monthly, myBirthYear: null, theirBirthYear: null, until: UNTIL }), null);
});
test("아직 끝나지 않은 구간·미래 입대·미래 기준일도 유한하고 음수가 아니다", () => {
  for (const r of [
    estimatePast({ bonds: ["middle"], frequency: monthly, myBirthYear: 2013, theirBirthYear: null, until: UNTIL }),
    estimatePast({ bonds: ["high"], detail: { military: { me: 2030 } }, frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL }),
    estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 2024, theirBirthYear: null, until: UNTIL }),
  ]) assert.ok(r === null || (Number.isFinite(r.count) && r.count >= 0));
});
test("지금도 같이 일하는 동료: 1년에 min(지금 빈도, 약 182)", () => {
  const r = estimatePast({ bonds: ["coworker"], since: "2024-11-12", frequency: { count: 5, unit: "week" }, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.count, 2 * 230 * (150 / 190), 4);
});
test("근거 줄을 더하면 합계가 되고, 군 복무 줄은 음수다", () => {
  const r = estimatePast({ bonds: ["university"], detail: { military: { me: 2013 } }, frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.reduce((s, l) => s + l.count, 0), r.count, 1e-6);
  assert.ok(r.lines.find((l) => l.kind === "military").count < 0);
  const uni = r.lines.find((l) => l.kind === "university");
  near(uni.count, 120 + 90 + 60 + 60, 1); // 복무로 학년이 밀려도 4개 학년은 다 센다
});
test("livedTogetherCount: 같이 산 동안 329번/년 + 떠난 뒤 지금 빈도", () => {
  near(livedTogetherCount({ myBirthYear: 1993, leftYear: 2012, frequency: monthly, until: UNTIL }), 19 * 365 * 0.9 + 176, 4);
});
test("동료를 고르면 빈 곳·그 뒤도 근무일 상한(약 182)을 넘지 않는다", () => {
  const r = estimatePast({ bonds: ["coworker", "elementary"], since: "2021-03-01", frequency: { count: 5, unit: "week" }, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "after").count, 15 * 230 * (150 / 190), 1); // 2006.3~2021.3 빈 곳, 260/년이 아니라 182/년
});
test("동료를 고르면 since는 일 시작이고, 같이 산 끝으로 쓰지 않는다", () => {
  const r = estimatePast({ bonds: ["parent", "coworker"], since: "2024-11-12", frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "together").count, 19 * 365 * 0.9, 2);
});
test("첫 구간이 기준일 뒤면 학원도 더하지 않는다", () => {
  const r = estimatePast({ bonds: ["elementary", "academy"], frequency: monthly, myBirthYear: 2024, theirBirthYear: null, until: UNTIL });
  assert.deepEqual(r, { count: 0, lines: [] });
});
test("아직 시작 안 한 구간은 null이 아니라 0번", () => {
  assert.deepEqual(estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 2024, theirBirthYear: null, until: UNTIL }), { count: 0, lines: [] });
});
test("복무로 대학 학년이 밀리면 줄의 시작 해도 밀린다(2013 → 2015)", () => {
  const base = { bonds: ["university"], frequency: monthly, myBirthYear: 1994, theirBirthYear: null, until: UNTIL };
  assert.equal(estimatePast(base).lines.find((l) => l.kind === "university").from, 2013);
  assert.equal(estimatePast({ ...base, detail: { military: { me: 2013 } } }).lines.find((l) => l.kind === "university").from, 2015);
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { addMeeting, cleanMeetings, daysSinceLast, ledger, metThisYear } from "../lib/meetings.ts";

test("오늘 만남을 더하면 날짜가 쌓이고, 같은 날 두 번 눌러도 두 번 센다", () => {
  const once = addMeeting([], "2026-10-02");
  assert.deepEqual(once, ["2026-10-02"]);
  assert.deepEqual(addMeeting(once, "2026-10-02"), ["2026-10-02", "2026-10-02"]);
});

test("마지막 만남부터 며칠 지났는지 — 기록이 없으면 null", () => {
  assert.equal(daysSinceLast([], "2026-10-02"), null);
  assert.equal(daysSinceLast(["2026-09-01", "2026-09-30"], "2026-10-02"), 2);
  assert.equal(daysSinceLast(["2026-10-02"], "2026-10-02"), 0);
});

test("올해 만난 횟수", () => {
  assert.equal(metThisYear(["2025-12-31", "2026-01-01", "2026-10-02"], "2026-10-02"), 2);
});

test("망가진 기록은 걸러 내고 날짜순으로, 너무 많으면 최근 것만", () => {
  assert.deepEqual(cleanMeetings(["2026-03-01", "abc", 3, null, "2026-01-05", "2026-13-40"]), ["2026-01-05", "2026-03-01"]);
  assert.equal(cleanMeetings("nope"), undefined);
  const many = Array.from({ length: 6000 }, (_, i) => new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10));
  const kept = cleanMeetings(many);
  assert.equal(kept.length, 5000);
  assert.equal(kept.at(-1), many.at(-1));
});

const week = { count: 1, unit: "week" };

test("끝난 주마다 만났으면 함께한 칸, 아니면 놓친 칸", () => {
  // 9/14(월)부터 세기 시작, 오늘 10/8(목). 끝난 주는 9/14·9/21·9/28.
  const l = ledger(["2026-09-22"], week, "2026-09-14", "2026-10-08");
  assert.equal(l.met, 1);
  assert.equal(l.missed, 2);
  assert.equal(l.metNow, 0);
});

test("이번 주에 만나면 그 자리에서 앞으로가 하나 준다, 더 만난 건 함께한 쪽에만 더한다", () => {
  const before = ledger([], week, "2026-10-05", "2026-10-08");
  const once = ledger(["2026-10-08"], week, "2026-10-05", "2026-10-08");
  const twice = ledger(["2026-10-07", "2026-10-08"], week, "2026-10-05", "2026-10-08");
  assert.ok(Math.abs(before.adjust - once.adjust - 1) < 1e-9);
  assert.equal(twice.adjust, once.adjust);
  assert.equal(twice.met, 2);
});

test("세기 시작한 날이 기간 한가운데면 그 기간은 남은 날만큼만 센다", () => {
  // 9/16에 넣은 월 1회 — 9월은 반만 세서 놓친 칸이 되지 않는다.
  assert.equal(ledger([], { count: 1, unit: "month" }, "2026-09-16", "2026-10-08").missed, 0);
  assert.equal(ledger([], { count: 1, unit: "month" }, "2026-08-01", "2026-10-08").missed, 2);
  // 넣은 날이 주 한가운데여도 이번 주에 만나면 앞으로가 꼭 하나 준다.
  const fresh = ledger([], week, "2026-10-08", "2026-10-08").adjust;
  assert.ok(Math.abs(fresh - ledger(["2026-10-08"], week, "2026-10-08", "2026-10-08").adjust - 1) < 1e-9);
});

test("주 5회는 한 주에 다섯 칸, 여러 해 단위도 센다", () => {
  assert.equal(ledger(["2026-09-28", "2026-09-29"], { count: 5, unit: "week" }, "2026-09-28", "2026-10-08").missed, 3);
  assert.equal(ledger([], { count: 1, unit: "year2" }, "2022-10-08", "2026-10-08").missed, 2);
});

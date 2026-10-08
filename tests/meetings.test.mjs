import assert from "node:assert/strict";
import { test } from "node:test";

import { addMeeting, cleanMeetings, daysSinceLast, metThisYear, extraMeetings, metThisPeriod } from "../lib/meetings.ts";

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

test("이번 기간은 달력으로 끊는다 — 이번 주(월요일부터)·이번 달·이번 분기·올해", () => {
  const m = ["2026-09-30", "2026-10-01", "2026-10-05", "2026-10-08"];
  const today = "2026-10-08"; // 목요일
  assert.equal(metThisPeriod(m, { count: 1, unit: "day" }, today), 1);
  assert.equal(metThisPeriod(m, { count: 1, unit: "week" }, today), 2);
  assert.equal(metThisPeriod(m, { count: 1, unit: "month" }, today), 3);
  assert.equal(metThisPeriod(m, { count: 1, unit: "quarter" }, today), 3);
  assert.equal(metThisPeriod(m, { count: 1, unit: "year" }, today), 4);
  assert.equal(metThisPeriod(["2024-10-09", "2024-10-08"], { count: 1, unit: "year2" }, today), 1);
});

test("예측보다 많이 만난 만큼만 더 줄어든다", () => {
  const month = { count: 1, unit: "month" };
  assert.equal(extraMeetings([], month, "2026-10-08"), 0);
  assert.equal(extraMeetings(["2026-10-02"], month, "2026-10-08"), 0);
  assert.equal(extraMeetings(["2026-10-02", "2026-10-08"], month, "2026-10-08"), 1);
  assert.equal(extraMeetings(["2026-09-02", "2026-09-08"], month, "2026-10-08"), 0);
  assert.equal(extraMeetings(["2026-10-02", "2026-10-03"], { count: 1.5, unit: "month" }, "2026-10-08"), 0);
});

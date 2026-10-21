import assert from "node:assert/strict";
import { test } from "node:test";

import { backupDue, backupReminderAt } from "../lib/backup.ts";

const NOW = new Date("2026-09-28T12:00:00Z");
const item = (createdAt, updatedAt = createdAt) => ({ createdAt, updatedAt });
const state = (people, lastBackupAt) => ({
  people,
  moments: [],
  marriage: null,
  settings: { lastBackupAt },
});

test("기록이 없으면 권하지 않는다", () => {
  assert.equal(backupDue(state([]), NOW), false);
});

test("처음 만든 지 일주일이 안 됐으면 기다린다", () => {
  assert.equal(backupDue(state([item("2026-09-25T00:00:00Z")]), NOW), false);
});

test("백업한 적 없이 일주일이 지나면 권한다", () => {
  assert.equal(backupDue(state([item("2026-09-20T00:00:00Z")]), NOW), true);
});

test("백업 뒤로 바뀐 것이 없으면 아무리 오래돼도 권하지 않는다", () => {
  const s = state([item("2026-01-01T00:00:00Z")], "2026-02-01T00:00:00Z");
  assert.equal(backupDue(s, NOW), false);
});

test("백업 뒤에 바뀌었고 백업이 일주일 넘었으면 권한다", () => {
  const s = state([item("2026-01-01T00:00:00Z", "2026-09-27T00:00:00Z")], "2026-09-01T00:00:00Z");
  assert.equal(backupDue(s, NOW), true);
});

test("백업 뒤에 바뀌었어도 백업한 지 일주일이 안 됐으면 기다린다", () => {
  const s = state([item("2026-01-01T00:00:00Z", "2026-09-27T00:00:00Z")], "2026-09-25T00:00:00Z");
  assert.equal(backupDue(s, NOW), false);
});

test("결혼 계획만 바뀌어도 센다", () => {
  const s = {
    ...state([], "2026-09-01T00:00:00Z"),
    marriage: { updatedAt: "2026-09-10T00:00:00Z" },
  };
  assert.equal(backupDue(s, NOW), true);
});

test("백업 알림은 기다리기 시작한 날부터 30일마다, 아직 오지 않은 첫 날 아침 9시", () => {
  const s = state([item("2026-01-01T00:00:00Z", "2026-09-27T00:00:00Z")], "2026-09-01T03:00:00Z");
  const at = backupReminderAt(s, NOW);
  assert.equal(at.getHours(), 9);
  assert.equal(Math.round((at - new Date(2026, 8, 1, 9)) / 86_400_000), 30);
  // 한 달 넘게 지났으면 60일째로 — 앱을 열 때마다 내일로 당겨 오지 않는다.
  const later = backupReminderAt(s, new Date("2026-10-15T12:00:00Z"));
  assert.equal(Math.round((later - new Date(2026, 8, 1, 9)) / 86_400_000), 60);
});

test("백업 뒤로 바뀐 것이 없으면 알림을 걸지 않는다", () => {
  assert.equal(backupReminderAt(state([item("2026-01-01T00:00:00Z")], "2026-02-01T00:00:00Z"), NOW), null);
  assert.equal(backupReminderAt(state([]), NOW), null);
});

test("날짜가 깨진 기록이면 알림을 걸지 않는다(끝없이 돌지 않는다)", () => {
  assert.equal(backupReminderAt(state([item("", "")]), NOW), null);
  assert.equal(backupReminderAt(state([item("not a date", "not a date")]), NOW), null);
});

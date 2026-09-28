import assert from "node:assert/strict";
import { test } from "node:test";

import { backupDue } from "../lib/backup.ts";

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

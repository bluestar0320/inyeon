import assert from "node:assert/strict";
import { test } from "node:test";

import { CONSENT_VERSION, consentDate, consentRecord, needsConsent } from "../lib/consent.ts";

const NOW = new Date("2026-09-30T09:00:00Z");

test("기록이 없으면 묻는다", () => {
  assert.equal(needsConsent(null), true);
});

test("지금 버전에 동의했으면 묻지 않는다", () => {
  assert.equal(needsConsent(consentRecord(NOW)), false);
});

test("옛 버전에 동의했으면 다시 묻는다", () => {
  assert.equal(needsConsent(JSON.stringify({ version: CONSENT_VERSION - 1, at: NOW.toISOString() })), true);
});

test("망가진 기록이면 멈추지 않고 다시 묻는다", () => {
  for (const raw of ["abc", "null", "[]", '{"version":"1"}', '{"version":1}', '{"version":1,"at":3}']) {
    assert.equal(needsConsent(raw), true, raw);
  }
});

test("동의한 날짜를 돌려준다", () => {
  assert.equal(consentDate(consentRecord(NOW)), "2026-09-30T09:00:00.000Z");
  assert.equal(consentDate("abc"), null);
});

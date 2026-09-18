import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COUNTRIES,
  isEstimatedTable,
  lookupLifeExpectancy,
  remainingLifeAt,
} from "../lib/lifeExpectancy.ts";
import { LIFE_TABLE, LIFE_TABLE_AGES } from "../lib/lifeTable.ts";

test("모든 국가가 세 성별 × 모든 연령 칸을 채우고 있다", () => {
  for (const { code, name } of COUNTRIES) {
    const entry = LIFE_TABLE[code];
    assert.ok(entry, `${name}(${code}) 표 없음`);
    for (const sex of ["male", "female", "all"]) {
      assert.equal(entry[sex].length, LIFE_TABLE_AGES.length, `${code}.${sex} 길이`);
      for (const v of entry[sex]) {
        assert.ok(Number.isFinite(v) && v > 0, `${code}.${sex}에 이상한 값: ${v}`);
      }
    }
  }
});

test("기대여명은 나이가 들수록 줄어든다 — 모든 국가에서", () => {
  for (const { code } of COUNTRIES) {
    for (const sex of ["male", "female", "all"]) {
      const row = LIFE_TABLE[code][sex];
      // 0세 -> 1세만 예외다. 영아 사망 구간을 넘기면 남은 햇수가 오히려 늘 수 있다.
      for (let i = 2; i < row.length; i += 1) {
        assert.ok(row[i] < row[i - 1], `${code}.${sex} ${LIFE_TABLE_AGES[i]}세에서 증가`);
      }
    }
  }
});

test("한국 값이 KOSIS 공표치와 맞는다", () => {
  // 통계청 2021년 생명표: 남 80.6세, 여 86.6세
  assert.ok(Math.abs(LIFE_TABLE.KR.male[0] - 80.6) < 0.3);
  assert.ok(Math.abs(LIFE_TABLE.KR.female[0] - 86.6) < 0.3);
});

test("핵심 교정: 68세는 출생 시 평균으로 계산할 때보다 오래 산다", () => {
  const flat = 83.5 - 68; // 예전 방식
  const table = remainingLifeAt("KR", "all", 68);
  assert.ok(table > flat + 3, `표 ${table.toFixed(1)}년 vs 예전 ${flat}년`);
  // 예상 수명으로 환산하면 90세 언저리가 나와야 한다.
  const expectancy = lookupLifeExpectancy("KR", "all", 68);
  assert.ok(expectancy > 85 && expectancy < 93, `${expectancy}세`);
});

test("나이를 모르면 출생 시 기대수명으로 떨어진다", () => {
  assert.equal(lookupLifeExpectancy("KR", "female"), 86.7);
  assert.equal(lookupLifeExpectancy("KR", "female", null), 86.7);
  assert.equal(lookupLifeExpectancy("KR", "female", Number.NaN), 86.7);
});

test("성별을 고르면 그 성별 표를 쓴다", () => {
  const f = lookupLifeExpectancy("KR", "female", 60);
  const m = lookupLifeExpectancy("KR", "male", 60);
  const a = lookupLifeExpectancy("KR", "all", 60);
  assert.ok(f > a && a > m, `여 ${f} / 전체 ${a} / 남 ${m}`);
});

test("표 사이 나이는 직선으로 이어 준다", () => {
  const at60 = remainingLifeAt("KR", "female", 60);
  const at65 = remainingLifeAt("KR", "female", 65);
  const mid = remainingLifeAt("KR", "female", 62.5);
  assert.ok(Math.abs(mid - (at60 + at65) / 2) < 1e-9);
});

test("예상 수명은 나이가 들수록 올라간다 — 오래 살수록 더 오래 산다", () => {
  const ages = [30, 50, 65, 75, 85];
  for (let i = 1; i < ages.length; i += 1) {
    const younger = lookupLifeExpectancy("KR", "all", ages[i - 1]);
    const older = lookupLifeExpectancy("KR", "all", ages[i]);
    assert.ok(older > younger, `${ages[i]}세(${older}) <= ${ages[i - 1]}세(${younger})`);
  }
});

test("표 마지막 칸(85세)을 넘어도 0이나 음수로 떨어지지 않는다", () => {
  for (const age of [86, 95, 105, 130]) {
    const left = remainingLifeAt("KR", "all", age);
    assert.ok(left >= 1.2, `${age}세에서 ${left}`);
    assert.ok(lookupLifeExpectancy("KR", "all", age) > age, `${age}세에서 수명이 나이보다 작음`);
  }
});

test("고령에서도 남은 햇수는 계속 줄어든다", () => {
  assert.ok(remainingLifeAt("KR", "all", 90) < remainingLifeAt("KR", "all", 86));
});

test("모르는 국가는 세계 평균으로 떨어진다", () => {
  const unknown = lookupLifeExpectancy("ZZ", "all", 40);
  assert.ok(Number.isFinite(unknown) && unknown > 40);
  assert.equal(lookupLifeExpectancy(undefined, "all", 40), unknown);
});

test("음수 나이도 계산을 깨뜨리지 않는다", () => {
  assert.equal(remainingLifeAt("KR", "all", -5), remainingLifeAt("KR", "all", 0));
});

test("생명표를 빌려 쓴 국가만 근사치로 표시된다", () => {
  assert.equal(isEstimatedTable("TW"), true);
  assert.equal(isEstimatedTable("HK"), true);
  assert.equal(isEstimatedTable("KR"), false);
  assert.equal(isEstimatedTable(undefined), false);
});

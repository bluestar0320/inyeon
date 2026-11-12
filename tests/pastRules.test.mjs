import assert from "node:assert/strict";
import { test } from "node:test";

import { schoolDaysFor, schoolMeetingsFor, entryYear, highSchoolEndYear, armyServiceDays } from "../lib/pastRules.ts";

test("법정 수업일수: 2005까지 220, 2006~2011 205, 2012부터 190", () => {
  assert.equal(schoolDaysFor(1999), 220); assert.equal(schoolDaysFor(2005), 220);
  assert.equal(schoolDaysFor(2006), 205); assert.equal(schoolDaysFor(2011), 205);
  assert.equal(schoolDaysFor(2012), 190); assert.equal(schoolDaysFor(2030), 190);
});
test("결석·다른 반을 뺀 1년: 174 / 162 / 150", () => {
  assert.equal(Math.round(schoolMeetingsFor(2003)), 174);
  assert.equal(Math.round(schoolMeetingsFor(2008)), 162);
  assert.equal(Math.round(schoolMeetingsFor(2015)), 150);
});
test("1993년생은 2000년 입학, 2012년 고교 졸업", () => {
  assert.equal(entryYear(1993), 2000); assert.equal(highSchoolEndYear(1993), 2012);
});
test("육군 복무: 식을 모르는 해는 단축 전의 긴 기간", () => {
  const months = (y) => Math.round(armyServiceDays(y) / 30.44);
  assert.equal(months(1990), 30);  // 1993 이전
  assert.equal(months(1995), 26);  // 1993.1~
  assert.equal(months(2003), 26);  // 2003 단축 식 미확인 → 단축 전
  assert.equal(months(2005), 24);
  assert.equal(months(2009), 24);  // 2008~2010 단축 식 미확인 → 단축 전
  assert.equal(months(2013), 21);
  assert.equal(months(2021), 18);
});
test("2017~2020 입대자는 2주에 하루씩 줄어든 실제 기간(그해 1월 1일 입대로 쳐서 가장 길게)", () => {
  const d21 = armyServiceDays(2016);
  assert.equal(armyServiceDays(2017), d21 - 1);
  assert.ok(armyServiceDays(2019) < armyServiceDays(2018));
  assert.equal(Math.round(armyServiceDays(2020) / 30.44), 18 + 0); // 하한 18개월에 닿는다
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { birthdayLine, isElder, nextBirthday, upcomingBirthdays } from "../lib/birthdays.ts";
import { setLang } from "../lib/i18n.ts";

const at = (iso) => new Date(`${iso}T15:30:00`);
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

test("오늘이 생일이면 0일", () => {
  const next = nextBirthday("1960-10-12", at("2026-10-12"));
  assert.equal(next.days, 0);
  assert.equal(ymd(next.date), "2026-10-12");
});

test("올해 생일이 지났으면 내년으로 센다", () => {
  const next = nextBirthday("1960-10-11", at("2026-10-12"));
  assert.equal(ymd(next.date), "2027-10-11");
  assert.equal(next.days, 364);
});

test("연말에서 연초로 넘어가도 맞다", () => {
  assert.equal(nextBirthday("1990-01-03", at("2026-12-30")).days, 4);
});

test("2월 29일생은 윤년이 아니면 2월 28일에 챙긴다", () => {
  const plain = nextBirthday("1964-02-29", at("2027-02-01"));
  assert.equal(ymd(plain.date), "2027-2-28");
  assert.equal(plain.days, 27);
  assert.equal(ymd(nextBirthday("1964-02-29", at("2028-02-01")).date), "2028-2-29");
  // 2월 28일이 지나면 다음 해(윤년)의 29일.
  assert.equal(ymd(nextBirthday("1964-02-29", at("2027-03-01")).date), "2028-2-29");
});

test("날짜가 없거나 이상하면 null", () => {
  for (const bad of [undefined, "", "1960-13-01", "1960-00-10", "abc", "1960-1-1"]) {
    assert.equal(nextBirthday(bad, at("2026-10-12")), null, String(bad));
  }
});

test("14일 안에 오는 사람만 가까운 순으로, 나이만 적은 사람은 빼고", () => {
  const people = [
    { id: "a", name: "민수", birthDate: "1995-10-26" },
    { id: "b", name: "엄마", birthDate: "1962-10-17" },
    { id: "c", name: "아빠", ageYears: 66 },
    { id: "d", name: "누나", birthDate: "1990-10-27" },
  ];
  const rows = upcomingBirthdays(people, at("2026-10-12"));
  assert.deepEqual(rows.map((r) => [r.person.id, r.days]), [["b", 5], ["a", 14]]);
});

test("부모님·조부모님은 생신, 나머지는 생일", () => {
  setLang("ko");
  assert.equal(isElder({ name: "김영희", relation: "어머니" }), true);
  assert.equal(isElder({ name: "할머니" }), true);
  assert.equal(isElder({ name: "민수", relation: "친구" }), false);
  assert.equal(birthdayLine({ name: "엄마" }, 12), "엄마 생신까지 12일 남았어요");
  assert.equal(birthdayLine({ name: "엄마" }, 0), "오늘은 엄마 생신이에요");
  assert.equal(birthdayLine({ name: "민수", relation: "친구" }, 5), "민수 생일까지 5일 남았어요");
  setLang("en");
  assert.equal(birthdayLine({ name: "Mom" }, 3), "Mom's birthday is in 3 days");
  setLang("ko");
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { birthdayRibbon } from "../lib/birthdays.ts";
import { cleanPos, growthNote, readPos, startIndex, writePos } from "../lib/deck.ts";
import { setLang } from "../lib/i18n.ts";

setLang("ko");

test("시작: 생일 가까운 사람 → 첫 사람 → 나", () => {
  assert.equal(startIndex(["a", "b", "c"], [{ id: "c", days: 3 }, { id: "a", days: 9 }]), 3);
  assert.equal(startIndex(["a", "b"], []), 1);
  assert.equal(startIndex([], []), 0);
  assert.equal(startIndex(["a"], [{ id: "gone", days: 1 }]), 1); // 목록에 없는 id
});
test("cleanPos: 범위로 줄이고 이상한 값은 버린다", () => {
  const sizes = { people: 3, moments: 1 };
  assert.deepEqual(cleanPos({ row: "people", people: 9, moments: 0 }, sizes), { row: "people", people: 2, moments: 0 });
  assert.equal(cleanPos({ row: "x", people: 0, moments: 0 }, sizes), null);
  assert.equal(cleanPos({ row: "people", people: -1, moments: 0 }, sizes), null);
  assert.equal(cleanPos("people", sizes), null);
  assert.equal(cleanPos({ row: "people", people: 1.5, moments: 0 }, sizes), null);
});
test("readPos/writePos: sessionStorage가 없어도 던지지 않는다", () => {
  assert.equal(readPos({ people: 3, moments: 1 }), null);
  writePos({ row: "moments", people: 0, moments: 0 });
});
test("readPos/writePos: 저장한 값을 범위로 줄여 읽는다", () => {
  const mem = new Map();
  globalThis.window = {};
  globalThis.sessionStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
  };
  try {
    writePos({ row: "people", people: 7, moments: 0 });
    assert.ok(mem.has("deck.pos.v1"));
    assert.deepEqual(readPos({ people: 3, moments: 1 }), { row: "people", people: 2, moments: 0 });
    mem.set("deck.pos.v1", "{깨짐");
    assert.equal(readPos({ people: 3, moments: 1 }), null);
  } finally {
    delete globalThis.window;
    delete globalThis.sessionStorage;
  }
});
test("growthNote: 가장 적게 남은 것 하나", () => {
  const g = { yearsLeft: 12, adultAge: 19, grownUp: false, items: [
    { key: "summer", label: "여름", emoji: "", count: 12 },
    { key: "dinner", label: "함께하는 저녁 식사", emoji: "", count: 3000 } ] };
  assert.equal(growthNote(g), "만 19세까지 여름 12번");
  assert.equal(growthNote({ ...g, grownUp: true }), null);
  assert.equal(growthNote({ ...g, yearsLeft: null }), null);
  assert.equal(growthNote({ ...g, items: [] }), null);
});
test("birthdayRibbon", () => {
  assert.equal(birthdayRibbon({ name: "지훈", relation: "친구" }, 6), "생일 6일 전");
  assert.equal(birthdayRibbon({ name: "엄마", relation: "어머니" }, 0), "오늘 생신");
  assert.equal(birthdayRibbon({ name: "지훈", relation: "친구" }, 1), "내일 생일");
  assert.equal(birthdayRibbon({ name: "엄마", relation: "어머니" }, 1), "내일 생신");
});
test("birthdayRibbon: 다른 언어", () => {
  const friend = { name: "Ji", relation: "친구" };
  const want = {
    en: ["Birthday today", "Birthday tomorrow", "Birthday in 6 days"],
    ja: ["今日は誕生日", "明日は誕生日", "誕生日まで6日"],
    es: ["Cumple hoy", "Cumple mañana", "Cumple en 6 días"],
    zh: ["今天生日", "明天生日", "生日还有6天"],
  };
  try {
    for (const [lang, lines] of Object.entries(want)) {
      setLang(lang);
      assert.deepEqual([0, 1, 6].map((d) => birthdayRibbon(friend, d)), lines, lang);
    }
  } finally {
    setLang("ko");
  }
});
test("growthNote: 영어는 소문자, 한 번이면 단수. 스페인어는 Quedan", () => {
  const g = (label, count) => ({ yearsLeft: 12, adultAge: 19, grownUp: false, items: [{ key: "summer", label, emoji: "", count }] });
  try {
    setLang("en");
    assert.equal(growthNote(g("Summers", 12)), "12 summers left until they're 19");
    assert.equal(growthNote(g("Summers", 1)), "1 summer left until they're 19");
    assert.equal(growthNote(g("Dinners together", 1)), "1 dinner together left until they're 19");
    setLang("es");
    assert.equal(growthNote(g("Veranos", 12)), "Quedan 12 veranos hasta los 19");
  } finally {
    setLang("ko");
  }
});

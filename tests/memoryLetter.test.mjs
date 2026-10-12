import assert from "node:assert/strict";
import { test } from "node:test";

import { setLang } from "../lib/i18n.ts";
import { memoryLetter } from "../lib/memoryLetter.ts";

const mom = (memories, meetings = memories.map((m) => m.date)) => ({ name: "엄마", relation: "어머니", memories, meetings });

test("지난 1년 안의 기억이 두 줄은 있어야 편지가 된다", () => {
  setLang("ko");
  assert.equal(memoryLetter(mom([{ date: "2026-09-01", text: "송편" }]), "2026-10-12"), null);
  // 1년보다 오래된 기억은 세지 않는다.
  assert.equal(memoryLetter(mom([{ date: "2025-10-12", text: "옛날" }, { date: "2026-09-01", text: "송편" }]), "2026-10-12"), null);
});

test("편지 모양: 부르는 말·안부·기억 문단·맺음·날짜와 이름, 기억은 내가 쓴 말 그대로", () => {
  setLang("ko");
  const letter = memoryLetter(
    mom([{ date: "2026-03-14", text: "시장 가서 떡볶이" }, { date: "2026-03-20", text: "꽃 보러 감!" }, { date: "2025-11-02", text: "김장" }], ["2026-03-14"]),
    "2026-10-12",
    "청규",
  );
  assert.equal(letter.greeting, "사랑하는 엄마께");
  assert.match(letter.open, /엄마와 보낸 날을 세어 봤어요\. 세 번이더라고요\.$/);
  // 날짜 순서 그대로, 같은 달은 이음말 한 번, 해가 다르면 「작년」, 마침표는 없을 때만.
  assert.deepEqual(letter.memories, ["작년 11월엔 김장.", "3월엔 시장 가서 떡볶이.", "꽃 보러 감!"]);
  assert.equal(letter.date, "2026년 10월");
  assert.equal(letter.from, "청규 올림");
});

test("친구에게는 「에게」와 「~가/~이가」, 이름이 없으면 서명 없이 날짜만", () => {
  setLang("ko");
  const friend = (memories) => ({ name: "민수", relation: "친구", memories });
  const two = [{ date: "2026-09-01", text: "a" }, { date: "2026-10-01", text: "b" }];
  assert.equal(memoryLetter(friend(two), "2026-10-12").greeting, "민수에게");
  assert.equal(memoryLetter(friend(two), "2026-10-12").from, null);
  assert.equal(memoryLetter(friend(two), "2026-10-12", "청규").from, "청규가");
  assert.equal(memoryLetter(friend(two), "2026-10-12", "민정").from, "민정이가");
  for (const lang of ["en", "ja", "es", "zh"]) {
    setLang(lang);
    const l = memoryLetter(friend(two), "2026-10-12", "Kyu");
    assert.ok(l.greeting.includes("민수") && l.open.includes("2") && l.from.includes("Kyu"), lang);
  }
  setLang("ko");
});

test("자주 하는 말은 맺음 앞에 따옴표로 한 줄, 없으면 null", () => {
  setLang("ko");
  const two = [{ date: "2026-09-01", text: "a" }, { date: "2026-10-01", text: "b" }];
  assert.equal(memoryLetter(mom(two), "2026-10-12").saying, null);
  assert.equal(memoryLetter({ ...mom(two), saying: "밥은 먹고 다니니?" }, "2026-10-12").saying, "“밥은 먹고 다니니?” 늘 하시는 그 말, 저도 잊지 않고 있어요.");
  setLang("en");
  assert.equal(memoryLetter({ ...mom(two), saying: "Eat something" }, "2026-10-12").saying, "You always say, “Eat something.” I keep it with me.");
  setLang("ko");
});

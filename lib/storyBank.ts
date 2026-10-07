import type { Lang } from "./i18n";
import type { Slot } from "./story";
import type { Tone } from "./types";

/*
 * 이야기 문장 은행. 코드는 없다 — 줄을 더하면 끝난다.
 *
 * 키(구체 → 일반, lib/story.ts가 이 순서로 찾는다):
 *   then  "parent.often"  → "parent"
 *   now   "parent.c100"   → "c100" → "*"
 *   today "parent.often"  → "often" → "*"
 *   past  "partner.start" → "start"
 *   met   "parent" → "*"
 * 횟수 구간: week(≤7) month(≤30) c100 c200 c300 year(≤365) twoYears(≤730) c1000 more
 * 빈도: often(주 1회 이상) sometimes(월 1회 이상) rarely
 * 지나간 비율: start(<10%) early(<40%) middle(<70%) late(<90%) last
 *
 * 빈칸: {name} {count} {span} {pct} {n}. 조사는 {name:와/과} {name:을/를} {name:은/는} {name:이/가}.
 * {span}은 "매일 만난다면 채 안 되는 기간"이다("4달", "1년") — "{span:이/가} 채 안 돼요"로 쓴다.
 * 없는 칸은 aware → 영어 순으로 물러선다.
 * 「만났어요」(met) 문장에 "N번 남았다"는 쓰지 않는다 — 남은 횟수는 시간에서 나와 줄지 않는다.
 * 한 문장은 44자(영어·스페인어 90자) 안쪽 — 공유 카드 두 줄에 들어가야 한다.
 */
export type SlotBank = Partial<Record<Slot, Record<string, string[]>>>;

export const BANK: Record<Tone, Partial<Record<Lang, SlotBank>>> = {
  aware: {
    ko: {
      then: { parent: ["어릴 적엔 매일 아침 {name:와/과} 마주 앉는 게 당연했어요."] },
      now: { "*": ["이제 남은 건 {count}번. 매일 만난다 해도 {span:이/가} 채 안 돼요."] },
      today: { "*": ["오늘 {name}에게 먼저 연락해 보는 건 어때요?", "오늘 저녁, {name:와/과} 한 끼 어때요?", "오늘은 {name}에게 전화 한 통 걸어 보세요."] },
      past: {
        start: ["{name:와/과}의 이야기는 이제 막 첫 장이에요."],
        early: ["{name:와/과} 함께할 시간의 {pct}%가 지났어요. 아직 많이 남았어요."],
        middle: ["{name:와/과} 함께할 시간의 {pct}%가 지나갔어요."],
        late: ["{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요."],
        last: ["{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요."],
      },
      met: { "*": ["이번 한 번, 잘 쓰셨어요. 올해 {n}번째예요."] },
    },
    en: {
      now: { "*": ["{count} times left. Even if you met every day, that's less than {span}."] },
      today: { "*": ["How about reaching out to {name} today?"] },
      met: { "*": ["That one counted. That's {n} this year."] },
    },
    ja: {
      now: { "*": ["残りは{count}回。毎日会っても{span}に満たないんです。"] },
      today: { "*": ["今日、{name}に連絡してみませんか。"] },
      met: { "*": ["この一回、大切に使えましたね。今年{n}回目です。"] },
    },
    es: {
      now: { "*": ["Quedan {count} veces. Aunque os vierais cada día, no llegaría a {span}."] },
      today: { "*": ["¿Y si hoy le escribes a {name}?"] },
      met: { "*": ["Esta vez contó. Ya van {n} este año."] },
    },
    zh: {
      now: { "*": ["只剩{count}次了。就算每天见面，也不到{span}。"] },
      today: { "*": ["今天给{name}打个电话吧？"] },
      met: { "*": ["这一次，用得很好。今年第{n}次了。"] },
    },
  },
  calm: {},
  warm: {},
};

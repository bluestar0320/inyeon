import type { Lang } from "./i18n";
import type { CountBand, Slot } from "./story";
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
 * 한국어 met은 모두 "올해 {n}번째"를 담는다.
 * 한 문장은 44자(영어·스페인어 90자) 안쪽 — 공유 카드 두 줄에 들어가야 한다.
 *
 * 톤: aware(기본, 「찡하게」)는 유한함을 또렷하게 짚고 바로 행동으로. warm은 "아직 이만큼"(밖에 금지).
 * calm은 담담한 사실과 계획. 죄책감 주기·죽음 직접 언급은 어느 톤에서도 쓰지 않는다.
 */
export type SlotBank = Partial<Record<Slot, Record<string, string[]>>>;

const BANDS: CountBand[] = ["week", "month", "c100", "c200", "c300", "year", "twoYears", "c1000", "more"];

/** {span}이 구간의 결을 이미 실어 나르는 문장은 모든 구간에 같이 쓴다. */
function everyBand(list: string[]): Record<string, string[]> {
  return Object.fromEntries(BANDS.map((band) => [band, list]));
}

export const BANK: Record<Tone, Partial<Record<Lang, SlotBank>>> = {
  aware: {
    ko: {
      then: {
        parent: [
          "어릴 적엔 매일 아침 {name:와/과} 마주 앉는 게 당연했어요.",
          "학교 다녀오면 늘 {name:이/가} 집에 있었죠.",
          "한때는 {name:와/과} 하루에도 몇 번씩 얼굴을 봤어요.",
          "매일 듣던 {name}의 잔소리, 그땐 끝이 없을 줄 알았죠.",
          "{name:와/과} 한 지붕 아래 살던 날들이 있었어요.",
          "어릴 땐 {name:이/가} 차려 준 밥을 매일 먹었어요.",
          "그땐 {name:와/과}의 저녁이 특별한 일이 아니었죠.",
          "아플 때마다 {name:이/가} 곁에 있던 시절이 있었어요.",
          "{name}의 목소리로 하루를 시작하던 때가 있었어요.",
          "같이 살 땐 {name:와/과} 보내는 하루가 그냥 하루였죠.",
        ],
      },
      now: {
        week: [
          "남은 건 {count}번. 일주일이면 다 써 버릴 횟수예요.",
          "{count}번. 두 손이면 다 셀 수 있어요.",
          "매일 만난다면 {span:이/가} 채 안 돼서 끝나요.",
          "{name:와/과} 남은 만남, 손가락으로 꼽을 수 있어요.",
          "이제 {count}번. 한 번 한 번이 다 기억에 남을 거예요.",
          "남은 {count}번, 달력 한 줄도 다 못 채워요.",
          "{count}번이면 이번 주 안에 다 써 버릴 수도 있어요.",
          "이제 정말 몇 번 안 남았어요. {count}번이에요.",
          "{name:와/과}의 남은 만남은 {count}번이에요.",
          "남은 {count}번, 하나도 흘려보내지 마세요.",
        ],
        month: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번이면 달력 한 장도 다 못 채워요.",
          "{name:와/과} 남은 만남은 {count}번, 한 달 치도 안 돼요.",
          "매일 본다 해도 한 달이면 끝나는 횟수예요.",
          "이제 {count}번. 생각보다 훨씬 적죠.",
          "남은 {count}번을 이어 붙이면 {span:이/가} 안 돼요.",
          "{count}번. 한 번 한 번이 귀한 숫자예요.",
          "{name:와/과}의 남은 만남, 한 달 달력에 다 들어가요.",
          "이제 {count}번이 남았어요. 손꼽아 셀 수 있을 만큼.",
          "매일 만나도 {span:이/가} 안 돼요. 남은 건 {count}번.",
        ],
        c100: [
          "이제 남은 건 {count}번. 매일 만난다 해도 {span:이/가} 채 안 돼요.",
          "{count}번이면 매일 만나도 {span}. 생각보다 짧아요.",
          "남은 {count}번을 달력에 이어 붙이면 {span:이/가} 안 돼요.",
          "{name:와/과} 남은 만남은 {count}번. 한 계절이면 다 지나가요.",
          "{count}번. 매일 봐도 한 계절 남짓이에요.",
          "남은 건 {count}번. 봄 한 철이면 다 써 버려요.",
          "{name:와/과}의 시간, 매일로 치면 {span:이/가} 안 남았어요.",
          "{count}번이 많아 보여도 매일이면 {span}이에요.",
          "이제 {count}번. 한 번도 허투루 쓸 수 없는 숫자예요.",
          "남은 {count}번, 매일 만나도 {span} 안에 끝나요.",
        ],
        c200: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번. 매일 본다면 해가 바뀌기 전에 끝나요.",
          "{name:와/과} 남은 만남, 매일로 치면 {span:이/가} 안 돼요.",
          "{count}번. 매일 보면 몇 계절 안에 다 지나가요.",
          "이제 {count}번. 많아 보이지만 매일이면 {span}이에요.",
          "남은 {count}번, 달력 몇 장이면 다 넘어가요.",
          "{name:와/과}의 시간은 생각보다 빨리 줄어요. {count}번.",
          "매일 만나도 {span} 안에 끝나는 {count}번이에요.",
          "{count}번이 남았어요. 1년도 안 걸려 다 써 버릴 횟수예요.",
          "남은 건 {count}번. 한 번 한 번이 다 소중해요.",
        ],
        c300: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번. 매일 봐도 1년이 안 돼요.",
          "{name:와/과} 남은 만남, 1년 달력도 다 못 채워요.",
          "이제 {count}번. 많아 보여도 매일이면 {span}이에요.",
          "남은 {count}번을 이으면 한 해도 안 돼요.",
          "{count}번이면 넉넉해 보이죠. 매일이면 {span}이에요.",
          "{name:와/과}의 시간, 매일로 치면 1년도 안 남았어요.",
          "남은 건 {count}번. 올해 같은 한 해가 채 안 돼요.",
          "{count}번. 생일 한 번 돌아오기 전에 끝나는 횟수예요.",
          "매일 만나도 {span} 안에 끝나요. 남은 건 {count}번.",
        ],
        year: [
          "남은 건 {count}번. 매일 만나도 1년이 채 안 돼요.",
          "{count}번. 매일 봐도 한 해가 다 안 돼요.",
          "{name:와/과}의 남은 만남, 매일 봐도 1년이면 끝나요.",
          "1년 365일을 다 못 채우는 {count}번이에요.",
          "이제 {count}번. 한 해치 달력이면 다 들어가요.",
          "{count}번이 남았어요. 매일 보면 내년 이맘때 끝나요.",
          "많아 보여도 {count}번은 1년이 안 돼요.",
          "{name:와/과} 보낼 날, 매일로 치면 한 해뿐이에요.",
          "남은 {count}번, 사계절 한 바퀴면 다 지나가요.",
          "{count}번. 매일 만나도 해가 한 번 바뀌면 끝이에요.",
        ],
        twoYears: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번. 매일 봐도 2년이 안 돼요.",
          "{name:와/과} 남은 만남, 매일이면 두 해 안에 끝나요.",
          "많아 보이는 {count}번, 매일로 치면 {span:이/가} 안 돼요.",
          "이제 {count}번. 사계절을 두 번 돌면 끝나요.",
          "{count}번이면 두 해 달력에 다 들어가요.",
          "{name:와/과}의 시간, 매일로 치면 2년도 안 남았어요.",
          "남은 {count}번, 생일 두 번이면 다 지나가요.",
          "{count}번. 길어 보여도 매일이면 2년이 안 돼요.",
          "매일 만나도 {span} 안에 다 써요. 남은 건 {count}번.",
        ],
        c1000: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번. 매일 보면 3년이 안 걸려요.",
          "{name:와/과} 남은 만남, 매일로 치면 {span:이/가} 안 돼요.",
          "천 번도 안 남았어요. {count}번이에요.",
          "이제 {count}번. 길어 보여도 매일이면 3년이 안 돼요.",
          "{count}번이면 넉넉해 보이죠. 매일이면 {span}이에요.",
          "{name:와/과}의 시간, 매일로 치면 3년도 안 남았어요.",
          "남은 {count}번, 사계절 세 바퀴면 다 지나가요.",
          "{count}번. 생각보다 빨리 줄어드는 숫자예요.",
          "매일 만나도 {span} 안에 끝나요. 남은 건 {count}번.",
        ],
        more: [
          "남은 건 {count}번. 매일 만나도 {span:이/가} 채 안 돼요.",
          "{count}번. 넉넉해 보여도 매일이면 {span}이에요.",
          "{name:와/과} 남은 만남은 {count}번. 아직 많지만 끝은 있어요.",
          "{count}번이 많아 보여도 한 번씩 줄어들어요.",
          "이제 {count}번. 넉넉할 때 더 자주 만나요.",
          "{name:와/과}의 시간, 매일로 치면 {span:이/가} 안 돼요.",
          "남은 {count}번, 넉넉해 보이는 지금이 가장 많을 때예요.",
          "{count}번. 오늘이 남은 날 중 가장 많은 날이에요.",
          "많아 보이지만 {count}번에도 마지막은 있어요.",
          "매일 만나도 {span}. 남은 건 {count}번이에요.",
        ],
        "*": ["이제 남은 건 {count}번. 매일 만난다 해도 {span:이/가} 채 안 돼요."],
      },
      today: {
        often: [
          "오늘 저녁, {name:와/과} 한 끼 어때요?",
          "오늘은 휴대폰 내려놓고 {name:와/과} 이야기해 보세요.",
          "오늘 {name:와/과} 동네 한 바퀴 걸어 보는 건 어때요?",
          "오늘 {name}에게 고맙다는 말 한마디 해 보세요.",
          "오늘 저녁 식탁에서 {name}의 하루를 물어봐 주세요.",
          "오늘은 {name:와/과} 같이 장 보러 가 볼까요?",
          "오늘 {name:와/과} 사진 한 장 찍어 두세요.",
          "오늘은 {name}의 이야기를 끝까지 들어 주세요.",
          "오늘 {name:와/과} 차 한 잔 마셔 보세요.",
          "오늘 {name}에게 먼저 \"잘 잤어?\" 물어봐 주세요.",
        ],
        sometimes: [
          "이번 주말, {name:을/를} 찾아가 보는 건 어때요?",
          "오늘 {name}에게 사진 한 장 보내 보세요.",
          "다음 만남 날짜를 오늘 미리 잡아 두세요.",
          "오늘 {name}에게 전화 한 통 걸어 보세요.",
          "이번에 만나면 {name:이/가} 좋아하는 걸 사 가세요.",
          "오늘 {name}에게 \"보고 싶다\"고 보내 보세요.",
          "이번 달엔 {name:와/과} 한 번 더 만나 보세요.",
          "오늘 {name:와/과} 통화하며 안부를 물어 주세요.",
          "다음에 만나면 {name:와/과} 사진 한 장 꼭 남기세요.",
          "이번 주 안에 {name:와/과} 밥 약속을 잡아 보세요.",
        ],
        rarely: [
          "오늘 {name}에게 전화 한 통 걸어 보세요.",
          "다음 만남 날짜를 오늘 정해 보는 건 어때요?",
          "오늘 {name}에게 짧은 안부 문자를 보내 보세요.",
          "다음 명절까지 기다리지 말고 먼저 찾아가 보세요.",
          "오늘 {name}의 목소리를 들어 보세요. 5분이면 돼요.",
          "올해 안에 {name:을/를} 한 번 더 만날 계획을 세워 보세요.",
          "오늘 {name:와/과} 찍은 옛 사진을 보내 보세요.",
          "오늘 {name}에게 영상 통화 한 번 걸어 보세요.",
          "이번 휴가엔 {name}에게 들러 보는 건 어때요?",
          "오늘 {name}에게 \"잘 지내?\" 한마디 보내 보세요.",
        ],
        "*": [
          "오늘 {name}에게 먼저 연락해 보는 건 어때요?",
          "오늘 저녁, {name:와/과} 한 끼 어때요?",
          "오늘은 {name}에게 전화 한 통 걸어 보세요.",
        ],
      },
      past: {
        start: [
          "{name:와/과}의 이야기는 이제 막 첫 장이에요.",
          "함께할 날의 {pct}%만 지났어요. 앞으로가 훨씬 길어요.",
          "{name:와/과}의 시간은 이제 시작이에요. 설레는 날들이 남았어요.",
          "아직 {pct}%. {name:와/과} 쌓을 날이 거의 다 남아 있어요.",
          "{name:와/과} 함께할 날, 이제 겨우 {pct}% 지났어요.",
          "지금이 {name:와/과}의 첫 페이지예요. 예쁘게 채워 가세요.",
          "앞으로 쌓일 {name:와/과}의 날들이 훨씬 많아요.",
          "{name:와/과}의 시간은 아직 {pct}%. 이야기는 이제부터예요.",
          "처음의 설렘을 기억해 두세요. 아직 {pct}%예요.",
          "{name:와/과} 함께할 날의 대부분이 아직 앞에 있어요.",
        ],
        early: [
          "{name:와/과} 함께할 시간의 {pct}%가 지났어요. 아직 많이 남았어요.",
          "{pct}%가 지나갔어요. 남은 날이 지나간 날보다 많아요.",
          "{name:와/과}의 시간, 아직 앞이 더 길어요. {pct}% 지났어요.",
          "함께할 날의 {pct}%를 썼어요. 지금부터가 중요해요.",
          "{name:와/과} 쌓은 날은 {pct}%. 남은 날이 더 많아요.",
          "{pct}%. 아직 초반이지만 시간은 생각보다 빨라요.",
          "{name:와/과}의 날들, 이제 {pct}%쯤 왔어요.",
          "지나간 {pct}%보다 남은 날이 훨씬 길어요.",
          "{name:와/과} 함께할 시간, 아직 대부분이 남았어요.",
          "{pct}%가 벌써 지났어요. 남은 날도 금방이에요.",
        ],
        middle: [
          "{name:와/과} 함께할 시간의 {pct}%가 지나갔어요.",
          "벌써 절반쯤 왔어요. {pct}%가 지났어요.",
          "{name:와/과}의 시간, 이제 반환점 근처에 있어요.",
          "함께할 날의 {pct}%를 이미 썼어요.",
          "{name:와/과} 보낼 날, 남은 쪽이 점점 짧아져요.",
          "{pct}%. 남은 날이 지나간 날만큼 줄어들고 있어요.",
          "{name:와/과}의 날들, 어느새 반쯤 왔어요.",
          "지나간 {pct}%만큼, 남은 날도 금방 지나가요.",
          "{name:와/과} 함께할 시간은 이제 반쯤 남았어요.",
          "{pct}%가 지났어요. 남은 날을 어떻게 채울까요?",
        ],
        late: [
          "{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요.",
          "{pct}%가 지났어요. 남은 날이 훨씬 적어요.",
          "{name:와/과}의 날들, 대부분은 이미 지나왔어요.",
          "함께할 시간의 {pct}%를 이미 썼어요. 남은 건 소중해요.",
          "{name:와/과} 보낼 날, 이제 남은 쪽이 짧아요.",
          "지나간 {pct}%보다 남은 날이 훨씬 적어요.",
          "{name:와/과}의 시간, 벌써 {pct}%가 흘렀어요.",
          "{pct}%가 지났어요. 남은 날을 아껴 써요.",
          "{name:와/과} 함께할 날, 많이 지나왔어요.",
          "{pct}%. 남은 만남 하나하나가 더 귀해졌어요.",
        ],
        last: [
          "{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요.",
          "{pct}%가 지나갔어요. 남은 한 번 한 번이 전부예요.",
          "{name:와/과}의 날들, 거의 다 지나왔어요.",
          "함께할 시간의 {pct}%를 이미 써 버렸어요.",
          "{name:와/과} 남은 시간은 이제 아주 조금이에요.",
          "{pct}%가 지났어요. 지금 이 순간이 더 귀해요.",
          "{name:와/과} 보낼 날, 이제 얼마 남지 않았어요.",
          "{pct}%가 지나갔어요. 남은 건 생각보다 훨씬 적어요.",
          "{name:와/과}의 시간, 남은 몇 퍼센트를 꼭 붙잡으세요.",
          "{pct}%. 남은 만남은 하나도 흘려보낼 수 없어요.",
        ],
        "partner.start": [
          "{name:와/과}의 날들은 이제 막 시작됐어요. 설레죠?",
          "앞으로 {name:와/과} 쌓을 날이 훨씬 많아요.",
          "지금은 {name:와/과}의 첫 장. 아직 {pct}%예요.",
          "{name:와/과} 함께할 날, 거의 다 앞에 있어요.",
          "처음의 설렘, {name:와/과} 오래 간직하세요.",
        ],
        "partner.early": [
          "{name:와/과} 아직 할 이야기가 훨씬 많아요.",
          "{pct}%. {name:와/과}의 이야기는 아직 초반이에요.",
          "{name:와/과} 함께한 날보다 남은 날이 훨씬 길어요.",
          "{name:와/과} 쌓아 갈 날이 아직 많아요.",
          "{pct}%. 지금처럼만 {name:와/과} 이어 가세요.",
        ],
      },
      met: {
        "*": [
          "이번 한 번, 잘 쓰셨어요. 올해 {n}번째예요.",
          "오늘의 만남이 기록됐어요. 올해 {n}번째예요.",
          "{name:와/과}의 하루가 하나 더 쌓였어요. 올해 {n}번째.",
          "잘했어요. 올해 {n}번째 만남이에요.",
          "오늘을 기억해 둘게요. 올해 {n}번째예요.",
          "한 번 더 만났네요. 올해 {n}번째예요.",
          "{name:와/과} 보낸 오늘, 올해 {n}번째로 남겨 둘게요.",
          "소중한 한 번이었어요. 올해 {n}번째예요.",
          "오늘도 {name:와/과} 함께했네요. 올해 {n}번째예요.",
          "이 한 번이 오래 남을 거예요. 올해 {n}번째예요.",
        ],
      },
    },
    en: {
      then: {
        parent: [
          "As a kid, sitting across from {name} every morning was just normal.",
          "There was a time you saw {name} every single day.",
          "Once, dinner with {name} was nothing special. It was every night.",
          "You used to hear {name}'s voice first thing every morning.",
          "Back home, a day with {name} was just an ordinary day.",
        ],
      },
      now: everyBand([
        "{count} times left. Even if you met every day, that's less than {span}.",
        "{count} visits left. Every day in a row, it wouldn't fill {span}.",
        "Only {count} more. Back to back, that's under {span}.",
        "{count} times sounds like a lot. Daily, it's less than {span}.",
        "What's left with {name}: {count} times. Not even {span} of days.",
      ]),
      today: {
        often: [
          "How about dinner with {name} tonight?",
          "Put the phone down and really talk with {name} today.",
          "Take a short walk with {name} today.",
          "Tell {name} thank you today.",
          "Take one photo with {name} today.",
        ],
        sometimes: [
          "Why not visit {name} this weekend?",
          "Send {name} a photo today.",
          "Set the date for your next visit today.",
          "Call {name} today.",
          "Tell {name} \"I miss you\" today.",
        ],
        rarely: [
          "Give {name} a call today.",
          "Pick the date for your next visit today.",
          "Send {name} a short text today.",
          "Don't wait for the holidays. Go see {name}.",
          "Hear {name}'s voice today. Five minutes is enough.",
        ],
        "*": ["How about reaching out to {name} today?"],
      },
      past: {
        start: [
          "Your story with {name} is just beginning.",
          "Only {pct}% has passed. Most of it is still ahead.",
          "It's still the first chapter with {name}.",
          "{pct}% so far. So many days left to fill.",
          "Almost all your days with {name} are still ahead.",
        ],
        early: [
          "{pct}% of your time with {name} has passed. Plenty is left.",
          "{pct}% gone. More is ahead than behind.",
          "Still early with {name}, but time moves fast.",
          "You've used {pct}% of your time together.",
          "More days ahead than behind with {name}.",
        ],
        middle: [
          "{pct}% of your time with {name} has passed.",
          "About halfway. {pct}% is behind you.",
          "With {name}, you're around the middle now.",
          "{pct}% used. The rest is getting shorter.",
          "{pct}% gone. How will you fill the rest?",
        ],
        late: [
          "{pct}% of your time with {name} is already behind you.",
          "{pct}% gone. Far less is left.",
          "Most of your days with {name} are behind you.",
          "{pct}% used. What's left is precious.",
          "{pct}% has passed. Make each visit count.",
        ],
        last: [
          "{pct}% of your time with {name} is already behind you.",
          "{pct}% gone. Every visit left is everything.",
          "Nearly all your days with {name} have passed.",
          "{pct}% has passed. This moment matters more.",
          "{pct}% gone. Don't let a single visit slip.",
        ],
      },
      met: {
        "*": [
          "That one counted. That's {n} this year.",
          "Logged. That's {n} this year.",
          "One more day with {name}. That's {n} this year.",
          "Well spent. That's {n} this year.",
          "A good one. That's {n} this year.",
        ],
      },
    },
    ja: {
      then: {
        parent: [
          "子どもの頃は、毎朝{name}と向かい合うのが当たり前でした。",
          "毎日{name}の顔を見ていた頃がありました。",
          "{name}との夕飯が、特別じゃなかった頃。",
          "毎朝{name}の声で一日が始まっていました。",
          "一緒に暮らしていた頃は、{name}との一日がただの一日でした。",
        ],
      },
      now: everyBand([
        "残りは{count}回。毎日会っても{span}に満たないんです。",
        "あと{count}回。毎日会えば{span}もかかりません。",
        "{name}と会えるのはあと{count}回。毎日なら{span}足らず。",
        "{count}回は多く見えても、毎日なら{span}未満です。",
        "残り{count}回、毎日続けたら{span}もたたずに終わります。",
      ]),
      today: {
        often: [
          "今夜、{name}と一緒にごはんはどうですか。",
          "今日はスマホを置いて{name}と話してみて。",
          "今日、{name}と少し散歩してみませんか。",
          "今日、{name}に「ありがとう」を伝えてみて。",
          "今日、{name}と写真を一枚撮っておきましょう。",
        ],
        sometimes: [
          "今週末、{name}に会いに行きませんか。",
          "今日、{name}に写真を一枚送ってみて。",
          "次に会う日を今日決めておきましょう。",
          "今日、{name}に電話してみませんか。",
          "今日、{name}に「会いたい」と送ってみて。",
        ],
        rarely: [
          "今日、{name}に電話を一本かけてみて。",
          "次に会う日を今日決めてみませんか。",
          "今日、{name}に短いメッセージを送ってみて。",
          "お盆やお正月を待たずに、会いに行ってみて。",
          "今日は{name}の声を聞いてみて。5分で十分です。",
        ],
        "*": ["今日、{name}に連絡してみませんか。"],
      },
      past: {
        start: [
          "{name}との物語は、まだ始まったばかり。",
          "まだ{pct}%。ほとんどがこれからです。",
          "{name}との日々は、まだ最初のページ。",
          "まだ{pct}%。これから積み重ねる日のほうが多い。",
          "{name}と過ごす日の大半は、まだこの先にあります。",
        ],
        early: [
          "{name}と過ごす時間の{pct}%が過ぎました。まだたくさん残っています。",
          "{pct}%が過ぎました。この先のほうが長い。",
          "まだ序盤。でも時間は思ったより速い。",
          "一緒の時間の{pct}%を使いました。",
          "過ぎた日より、残る日のほうが多い。",
        ],
        middle: [
          "{name}と過ごす時間の{pct}%が過ぎました。",
          "もう半分くらい。{pct}%が過ぎました。",
          "{name}との時間は、いまちょうど真ん中あたり。",
          "{pct}%を使いました。残りは少しずつ短くなります。",
          "{pct}%が過ぎました。残りをどう過ごしますか。",
        ],
        late: [
          "{name}と過ごす時間の{pct}%は、もう過ぎました。",
          "{pct}%が過ぎました。残りはずっと少ない。",
          "{name}との日々の大半は、もう過ぎました。",
          "{pct}%を使いました。残りは大切に。",
          "{pct}%が過ぎました。一回一回を大切に。",
        ],
        last: [
          "{name}と過ごす時間の{pct}%は、もう過ぎました。",
          "{pct}%が過ぎました。残りの一回一回がすべてです。",
          "{name}との日々は、ほとんど過ぎました。",
          "{pct}%が過ぎました。今この時がいちばん大事。",
          "{pct}%が過ぎました。一回も無駄にできません。",
        ],
      },
      met: {
        "*": [
          "この一回、大切に使えましたね。今年{n}回目です。",
          "記録しました。今年{n}回目です。",
          "{name}との一日がまたひとつ。今年{n}回目。",
          "いい一回でした。今年{n}回目です。",
          "今日を覚えておきます。今年{n}回目です。",
        ],
      },
    },
    es: {
      then: {
        parent: [
          "De pequeño, sentarte cada mañana con {name} era lo normal.",
          "Hubo un tiempo en que veías a {name} todos los días.",
          "Antes, cenar con {name} no era nada especial: era cada noche.",
        ],
      },
      now: everyBand([
        "Quedan {count} veces. Aunque os vierais cada día, no llegaría a {span}.",
        "Solo quedan {count} veces con {name}. Ni {span} de días.",
        "{count} veces parecen muchas. Seguidas, no llegan a {span}.",
      ]),
      today: {
        often: ["¿Y si cenas hoy con {name}?", "Hoy deja el móvil y habla con {name}.", "Da un paseo con {name} hoy."],
        sometimes: [
          "¿Y si visitas a {name} este fin de semana?",
          "Mándale una foto a {name} hoy.",
          "Hoy fija la fecha de la próxima visita.",
        ],
        rarely: ["Llama a {name} hoy.", "Hoy elige la fecha de la próxima visita.", "Mándale a {name} un mensaje corto hoy."],
        "*": ["¿Y si hoy le escribes a {name}?"],
      },
      past: {
        start: [
          "Tu historia con {name} acaba de empezar.",
          "Solo ha pasado un {pct}%. Casi todo está por venir.",
          "Aún es el primer capítulo con {name}.",
        ],
        early: [
          "Ha pasado un {pct}% de tu tiempo con {name}. Queda mucho.",
          "Un {pct}%. Queda más por delante que por detrás.",
          "Aún es pronto, pero el tiempo vuela.",
        ],
        middle: [
          "Ha pasado un {pct}% de tu tiempo con {name}.",
          "Más o menos a mitad de camino: un {pct}%.",
          "Un {pct}% ya pasó. ¿Cómo llenarás el resto?",
        ],
        late: [
          "Ya pasó un {pct}% de tu tiempo con {name}.",
          "Un {pct}% ya pasó. Queda mucho menos.",
          "Un {pct}% ya pasó. Haz que cada visita cuente.",
        ],
        last: [
          "Ya pasó un {pct}% de tu tiempo con {name}.",
          "Un {pct}% ya pasó. Cada visita que queda lo es todo.",
          "Un {pct}% ya pasó. No dejes escapar ni una.",
        ],
      },
      met: {
        "*": ["Esta vez contó. Ya van {n} este año.", "Guardado. Ya van {n} este año.", "Un día más con {name}. Van {n} este año."],
      },
    },
    zh: {
      then: {
        parent: ["小时候，每天早上和{name}面对面吃饭是理所当然的。", "曾经，每天都能见到{name}。", "那时和{name}一起吃晚饭，再平常不过。"],
      },
      now: everyBand([
        "只剩{count}次了。就算每天见面，也不到{span}。",
        "和{name}还能见{count}次。每天见也不到{span}。",
        "{count}次看起来很多，连起来不到{span}。",
      ]),
      today: {
        often: ["今晚和{name}一起吃顿饭吧？", "今天放下手机，和{name}好好聊聊。", "今天和{name}出去走走吧。"],
        sometimes: ["这个周末去看看{name}吧？", "今天给{name}发张照片吧。", "今天就定下下次见面的日子。"],
        rarely: ["今天给{name}打个电话吧。", "今天定下下次见面的日子吧。", "今天给{name}发条短信问候一下。"],
        "*": ["今天给{name}打个电话吧？"],
      },
      past: {
        start: ["和{name}的故事才刚刚开始。", "才过去{pct}%，大部分还在前面。", "和{name}的日子，还在第一页。"],
        early: ["和{name}相处的时间已过去{pct}%，还有很多。", "过去了{pct}%，前面的路更长。", "还早，但时间过得比想象快。"],
        middle: ["和{name}相处的时间已过去{pct}%。", "差不多一半了，已过去{pct}%。", "过去了{pct}%，剩下的要怎么过？"],
        late: ["和{name}相处的时间，{pct}%已经过去了。", "过去了{pct}%，剩下的少多了。", "过去了{pct}%，每一次都要珍惜。"],
        last: ["和{name}相处的时间，{pct}%已经过去了。", "过去了{pct}%，剩下的每一次都是全部。", "过去了{pct}%，一次都不要错过。"],
      },
      met: {
        "*": ["这一次，用得很好。今年第{n}次了。", "记下了，今年第{n}次。", "和{name}又多了一天，今年第{n}次。"],
      },
    },
  },
  calm: {
    ko: {
      then: {
        parent: [
          "어릴 때는 {name:와/과} 매일 얼굴을 봤어요.",
          "함께 살던 시절엔 {name:와/과} 매일 만났어요.",
          "독립하기 전까지 {name:와/과}의 만남은 매일이었어요.",
        ],
      },
      now: everyBand([
        "앞으로 {count}번 만날 수 있어요. 매일로 치면 {span:이/가} 안 돼요.",
        "남은 만남은 {count}번이에요. 매일이라면 {span} 안쪽이에요.",
        "{count}번은 매일 만나면 {span} 안에 끝나는 횟수예요.",
      ]),
      today: {
        often: [
          "오늘 {name:와/과} 함께할 시간을 잠깐 내 보세요.",
          "이번 주 {name:와/과} 식사 계획을 세워 보세요.",
          "오늘 저녁 {name:와/과} 이야기를 나눠 보세요.",
        ],
        sometimes: [
          "다음 만남 날짜를 정해 두면 좋아요.",
          "이번 달 {name:와/과} 만날 날을 잡아 보세요.",
          "오늘 {name}에게 안부를 전해 보세요.",
        ],
        rarely: [
          "다음 만남을 미리 계획해 두세요.",
          "오늘 {name}에게 연락해 보는 건 어때요?",
          "올해 {name:와/과} 만날 날을 달력에 적어 두세요.",
        ],
      },
      past: {
        start: [
          "함께할 날의 {pct}%가 지났어요. 대부분이 앞에 있어요.",
          "{name:와/과}의 시간은 이제 시작 단계예요.",
          "아직 {pct}%. 앞으로 계획할 날이 많아요.",
        ],
        early: [
          "함께할 날의 {pct}%가 지났어요.",
          "{name:와/과}의 시간 중 {pct}%를 지나왔어요.",
          "지난 몫은 {pct}%, 남은 몫이 더 커요.",
        ],
        middle: [
          "함께할 날의 {pct}%가 지났어요.",
          "{name:와/과}의 시간 중 절반 안팎을 지나왔어요.",
          "지난 몫 {pct}%, 남은 몫과 비슷해요.",
        ],
        late: [
          "함께할 날의 {pct}%가 지났어요.",
          "{name:와/과}의 시간 중 대부분을 지나왔어요.",
          "지난 몫 {pct}%, 남은 몫은 그보다 작아요.",
        ],
        last: [
          "함께할 날의 {pct}%가 지났어요.",
          "{name:와/과}의 시간 중 거의 전부를 지나왔어요.",
          "{pct}%가 지났어요. 남은 만남을 계획적으로 써 보세요.",
        ],
      },
      met: {
        "*": [
          "기록했어요. 올해 {n}번째 만남이에요.",
          "오늘 만남을 남겼어요. 올해 {n}번째예요.",
          "올해 {n}번째 만남으로 적어 두었어요.",
        ],
      },
    },
    en: {
      now: everyBand([
        "{count} times ahead with {name}. Daily, that's under {span}.",
        "You can meet {name} {count} more times.",
        "{count} visits left. Back to back, less than {span}.",
      ]),
      today: {
        "*": [
          "Consider planning your next visit with {name}.",
          "Check in with {name} today.",
          "Put your next meeting with {name} on the calendar.",
        ],
      },
    },
    ja: {
      now: everyBand(["{name}とはあと{count}回会えます。", "残り{count}回。毎日なら{span}足らずです。", "あと{count}回の予定を立ててみましょう。"]),
      today: {
        "*": ["次に会う日を決めておきましょう。", "今日、{name}に連絡してみては。", "{name}と会う日をカレンダーに書いておきましょう。"],
      },
    },
  },
  warm: {
    ko: {
      then: {
        parent: [
          "어릴 적 {name:와/과} 마주 앉던 아침들, 아직 마음에 남아 있죠.",
          "{name:이/가} 차려 준 밥을 매일 먹던 시절이 있었어요.",
          "{name:와/과} 한 지붕 아래 지낸 날들이 지금의 나를 만들었어요.",
        ],
      },
      now: everyBand([
        "{name:와/과} 마주 앉을 날이 아직 {count}번 남아 있어요.",
        "아직 {count}번의 만남이 기다려요. 한 번 한 번이 선물이에요.",
        "{count}번, 매일이면 {span}. 그 하루하루가 다 선물이에요.",
      ]),
      today: {
        often: [
          "오늘 {name:와/과} 맛있는 저녁 함께해요.",
          "오늘 {name}에게 따뜻한 말 한마디 건네 보세요.",
          "오늘 {name:와/과} 천천히 걸어 보세요.",
        ],
        sometimes: [
          "이번 주말 {name:을/를} 만나러 가 볼까요?",
          "오늘 {name}에게 좋아하는 사진 한 장 보내요.",
          "다음 만남을 기분 좋게 약속해 보세요.",
        ],
        rarely: [
          "오늘 {name}의 목소리를 들어 보세요.",
          "{name}에게 \"보고 싶어\" 한마디 보내 보세요.",
          "다음에 {name:을/를} 만날 날을 설레며 기다려 봐요.",
        ],
      },
      past: {
        start: [
          "{name:와/과}의 이야기는 이제 막 시작됐어요.",
          "앞으로 {name:와/과} 쌓을 추억이 가득해요.",
          "아직 {pct}%. 설레는 날들이 기다려요.",
        ],
        early: [
          "{name:와/과} 함께할 날이 아직 훨씬 많아요.",
          "{pct}%를 지나왔어요. 좋은 날은 앞에도 많아요.",
          "{name:와/과} 만들 추억이 아직 많이 남았어요.",
        ],
        middle: [
          "{name:와/과} 함께한 날만큼 앞으로의 날도 있어요.",
          "{pct}%를 함께 걸어왔어요. 남은 길도 함께예요.",
          "{name:와/과}의 날들, 지금이 한가운데예요.",
        ],
        late: [
          "{name:와/과} 함께한 {pct}%의 날들, 다 고마운 날이었죠.",
          "지나온 날만큼 남은 날도 따뜻하게 채워요.",
          "{name:와/과} 남은 날을 더 다정하게 보내요.",
        ],
        last: [
          "{name:와/과} 함께한 날들이 이렇게 많았어요.",
          "지나온 {pct}%의 시간, 그리고 아직 남은 오늘.",
          "남은 만남을 한 번 한 번 꼭 안아 주세요.",
        ],
      },
      met: {
        "*": [
          "오늘도 좋은 하루였죠. 올해 {n}번째예요.",
          "함께한 오늘, 올해 {n}번째로 담아 둘게요.",
          "고마운 한 번이었어요. 올해 {n}번째예요.",
        ],
      },
    },
    en: {
      now: everyBand([
        "Still {count} more times with {name}. Each one a gift.",
        "{count} visits still waiting for you.",
        "{count} more days together. That's a lot of good.",
      ]),
      today: {
        "*": ["Share a warm meal with {name} today.", "Send {name} something kind today.", "Look forward to your next time with {name}."],
      },
    },
    ja: {
      now: everyBand(["{name}と向き合える日が、まだ{count}回あります。", "まだ{count}回、会える日が待っています。", "あと{count}回。一回一回が贈りものです。"]),
      today: {
        "*": ["今日、{name}とおいしいごはんを。", "今日、{name}にやさしい一言を。", "次に{name}と会える日を楽しみに。"],
      },
    },
  },
};

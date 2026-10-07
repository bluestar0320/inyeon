import type { Lang } from "./i18n";
import type { CountBand, Slot } from "./story";
import type { Tone } from "./types";

/*
 * 이야기 문장 은행. 코드는 없다 — 줄을 더하면 끝난다.
 *
 * 화면에는 그때 · 지금 · 오늘이 한 문단으로 이어지고, 지나간 비율이 맺음 문단으로 붙는다.
 * 그래서 문장은 따로 읽혀도 되지만, 이어 읽었을 때 한 사람이 말하듯 흘러야 한다.
 *
 * 키(구체 → 일반, lib/story.ts가 이 순서로 찾는다):
 *   then  "parent.often" → "parent"                      (부모님만, 지나간 날의 기억)
 *   now   그때 줄이 있으면 "after.c100" → "after.*" 먼저  ("이제는…"처럼 앞 문장을 이어받는다)
 *         그 다음 "parent.c100" → "c100" → "*"            (이름으로 시작한다)
 *   today "parent.often" → "elder.often" → "often" → "*"
 *   past  "partner.start" → "elder.last" → "last"        (맺음 문단)
 *   met   "parent" → "elder" → "*"
 * elder = 부모님·조부모님. 높임말로 쓴다("찾아뵐", "좋아하시는", "{name}께").
 * 횟수 구간: week(≤7) month(≤30) c100 c200 c300 year(≤365) twoYears(≤730) c1000 more
 * 빈도: often(주 1회 이상) sometimes(월 1회 이상) rarely
 * 지나간 비율: start(<10%) early(<40%) middle(<70%) late(<90%) last
 *
 * 빈칸: {name} {count} {span} {pct} {n} {me}. 조사는 {name:와/과} {me:이/가}처럼 붙인다(와/과·을/를·은/는·이/가).
 * {me}는 「내 정보」의 닉네임, 없으면 "당신".
 * {span}은 "매일 만난다면 채 안 되는 기간"이다("넉 달", "2년") — "{span:이/가} 채 안 돼요"로 쓴다.
 *
 * 말투 원칙:
 *   - 사람이 건네는 말처럼. "~하세요"만 늘어놓지 말고 "~해 봐요", "~하면 좋겠어요", "~하기 좋은 날이에요",
 *     "~해 드리면 분명 좋아하실 거예요"처럼 끝맺음을 섞는다. "어때요/어떨까요"는 드물게.
 *   - 죄책감 주기·죽음 직접 언급은 쓰지 않는다. 남은 건 "만남"이지 "수명"이 아니다.
 *   - 「만났어요」(met)에 "N번 남았다"는 쓰지 않는다 — 남은 횟수는 시간에서 나와 줄지 않는다.
 *     한국어 met은 모두 "올해 {n}번째"를 담는다.
 *   - 한 줄은 72자(영어·스페인어 150자) 안쪽 — 공유 카드 세 줄에 들어가야 한다.
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
      cheer: {
        "*": [
          "{name}께서는 {country} 평균수명보다 더 장수하고 계세요. 그동안 건강을 잘 지켜 오신 덕분이에요.",
          "{country} 평균수명을 넘어 지금도 곁에 계셔 주시네요. {name}께서 몸 관리를 참 잘해 오셨어요.",
          "{name}께서는 {country} 평균보다 더 오래 함께해 주고 계세요. 정말 축하드릴 일이에요.",
          "{country} 평균수명을 훌쩍 넘기셨어요. {name}께서 건강하게 지내 오신 덕분에 오늘도 만날 수 있어요.",
          "{country} 평균수명보다 더 오래, 건강하게 곁을 지켜 주고 계세요. 참 고마운 일이에요.",
        ],
      },
      then: {
        parent: [
          "매일 아침 {name} 목소리로 하루를 시작하던 때가 있었죠.",
          "학교에서 돌아오면 늘 {name:이/가} 집에서 {me:을/를} 기다려 주셨죠.",
          "{name:이/가} 차려 주신 밥을 매일 먹던 시절이 있었어요.",
          "한 지붕 아래에서 {name:와/과} 매일 얼굴을 마주하던 날들이 있었죠.",
          "아플 때면 밤새 {name:이/가} 곁을 지켜 주셨죠.",
          "그땐 {name:와/과} 함께하는 저녁이 특별할 것 없는 매일이었어요.",
          "어릴 적엔 하루에도 몇 번씩 \"{name}\" 하고 부르곤 했죠.",
          "{name}의 잔소리가 끝도 없이 이어질 것만 같던 날들이 있었죠.",
          "매일 저녁 {name:와/과} 같은 밥상에 둘러앉던 때가 있었어요.",
          "{name:이/가} 깨워 주시는 소리에 눈을 뜨던 아침들이 있었죠.",
        ],
      },
      now: {
        senior: [
          "{name:와/과} 함께하는 날은 하루하루가 선물이에요. 앞으로의 {count}번도 한 번 한 번 꼭 안아 주세요.",
          "{name:와/과} 마주 앉는 날 하나하나가 이제는 무엇보다 귀해요.",
          "앞으로 {count}번, 숫자보다 그 하루하루에 담길 이야기가 더 소중해요.",
          "{name}의 웃음을 볼 수 있는 날, 그 하루하루가 다 선물이에요.",
          "{name:와/과} 보내는 시간은 이제 셀수록 더 귀해지는 시간이에요.",
          "{name:와/과} 함께할 {count}번의 날, 한 번도 그냥 지나치지 말아요.",
        ],
        "senior.after": [
          "그리고 지금도 {name:와/과} 함께하는 하루하루가 이어지고 있어요. 그 하루하루가 모두 선물이에요.",
          "이제는 한 번 한 번의 만남이 무엇보다 귀한 선물이 되었어요.",
          "지금은 {name:와/과} 마주 앉는 날 하나하나가 다 소중한 선물이에요.",
          "그 시절처럼 매일은 아니어도, 지금 함께하는 날들이 더 깊이 남아요.",
          "이제 앞으로의 {count}번은 숫자로 다 담을 수 없을 만큼 귀한 날들이에요.",
        ],
        "after.*": [
          "이제는 남은 만남이 {count}번이에요. 날짜로만 세어 보면 {span:이/가} 채 안 되네요.",
          "그런데 이제 남은 건 {count}번. 하루에 한 번씩 만나도 {span:이/가} 안 되는 시간이에요.",
          "지금은 {count}번이 남았어요. 매일 만난다 해도 {span:을/를} 다 채우지 못해요.",
          "이제 {name:와/과} 마주할 날은 {count}번 남았어요. 이어 붙이면 {span}도 안 되는 날들이에요.",
          "그 많던 날들이 지나고, 이제 {count}번이 남았어요. 날짜로 치면 {span:이/가} 채 안 돼요.",
          "이제는 {count}번. 매일 찾아간다 해도 {span:이/가} 다 가기 전에 지나가 버려요.",
          "시간이 흘러 이제 남은 만남은 {count}번이에요. 날로 세면 {span:이/가} 안 되는 숫자예요.",
          "그런데 이제는 {count}번이 남았을 뿐이에요. 매일 만나도 {span:을/를} 넘기지 못하죠.",
          "이제 남은 건 {count}번이에요. 하루하루 이어 보면 {span}도 채 되지 않아요.",
          "지금 {name:와/과} 남은 만남은 {count}번. 날짜로만 계산하면 {span:이/가} 안 되네요.",
        ],
        "after.week": [
          "이제는 {count}번이 남았어요. 한 주면 다 지나가 버릴 만큼이에요.",
          "그런데 이제 남은 건 {count}번. 두 손으로 다 셀 수 있을 만큼이에요.",
          "이제 {count}번이 남았어요. 하나도 허투루 보낼 수 없겠죠.",
        ],
        "after.month": [
          "이제 남은 만남은 {count}번이에요. 달력 한 장이면 다 넘어가는 날들이죠.",
          "그런데 이제는 {count}번. 매일 만나면 한 달이 채 안 걸려요.",
          "이제 손꼽아 셀 수 있을 만큼, {count}번이 남았어요.",
        ],
        "*": [
          "{name:와/과} 앞으로 만날 날은 {count}번 남았어요. 날짜로만 세어 보면 {span:이/가} 채 안 되네요.",
          "{name:와/과} 함께할 수 있는 날, 이제 {count}번이에요. 매일 만나도 {span:이/가} 가기 전에 다 지나가요.",
          "{name:와/과} 남은 만남은 {count}번이에요. 하루씩 이어 붙이면 {span:이/가} 안 되는 시간이죠.",
          "{name:을/를} 만날 수 있는 날이 {count}번 남았어요. 매일 본다 해도 {span:을/를} 채우지 못해요.",
          "앞으로 {name:와/과} 마주할 날은 {count}번. 날로 세면 {span:이/가} 채 안 돼요.",
          "{name:와/과}의 남은 만남을 세어 보니 {count}번이에요. 매일이라 쳐도 {span}도 안 되네요.",
          "{count}번. {name:와/과} 앞으로 만날 수 있는 횟수예요. 이어 붙이면 {span:이/가} 채 안 돼요.",
          "{name:와/과} 보낼 날이 {count}번 남아 있어요. 하루에 한 번씩이면 {span:이/가} 가기 전에 끝나요.",
          "지금처럼 만나면 {name:을/를} {count}번 더 볼 수 있어요. 날짜로 치면 {span:이/가} 안 돼요.",
          "{name:와/과} 남은 날은 {count}번이에요. 매일 만나도 {span:을/를} 넘기지 못하는 숫자죠.",
        ],
        week: [
          "{name:와/과} 남은 만남은 이제 {count}번이에요. 한 주면 다 지나가 버릴 만큼이에요.",
          "{name:와/과} 만날 날이 {count}번 남았어요. 두 손으로 다 셀 수 있을 만큼이에요.",
          "이제 {name:와/과}의 만남은 {count}번이 남았어요. 하나도 허투루 보낼 수 없겠죠.",
        ],
        month: [
          "{name:와/과} 남은 만남은 {count}번이에요. 달력 한 장이면 다 넘어가는 날들이죠.",
          "{name:와/과} 만날 날이 {count}번 남았어요. 매일 만나면 한 달이 채 안 걸려요.",
          "{name:와/과}의 만남, 이제 {count}번이에요. 손꼽아 셀 수 있을 만큼 남았어요.",
        ],
        more: [
          "{name:와/과} 앞으로 만날 날은 {count}번이에요. 넉넉해 보여도, 날짜로 세면 {span:이/가} 채 안 돼요.",
          "{count}번이라니 아직 많아 보이죠. 그래도 매일 만난다면 {span:이/가} 가기 전에 다 지나가요.",
          "{name:와/과} 남은 만남은 {count}번. 넉넉해 보이는 지금이, 가장 많이 남아 있는 때예요.",
        ],
      },
      today: {
        senior: [
          "이번 주엔 목소리 들려 드리러 {name}께 전화 한 통 드려 보세요.",
          "다음에 찾아뵐 땐 옛날 사진 몇 장 챙겨 가 보세요. 이야기꽃이 필 거예요.",
          "{name}께서 좋아하시는 음식 하나 사 들고 찾아뵈면 좋겠어요.",
          "오늘은 {name}께 \"사랑해요\" 한마디 전해 드려 보세요.",
          "다음에 뵐 땐 {name}의 손을 한 번 꼭 잡아 드리세요.",
          "{name}께 옛날이야기를 청해 보세요. 오래도록 남을 이야기가 될 거예요.",
          "영상 통화로 얼굴 한 번 보여 드리는 것만으로도 큰 기쁨이 되실 거예요.",
          "다음 만남엔 {name:와/과} 사진 한 장 꼭 남겨 두세요.",
        ],
        often: [
          "오늘 저녁엔 {name:와/과} 같은 밥상에 앉아 하루 이야기를 나눠 보세요.",
          "휴대폰은 잠시 내려 두고, 오늘은 {name}의 이야기에 귀 기울여 봐요.",
          "저녁 먹고 {name:와/과} 동네 한 바퀴 천천히 걸어 보면 좋겠어요.",
          "늘 곁에 있어 미뤄 둔 \"고마워\"라는 말, 오늘은 꺼내 보기 좋은 날이에요.",
          "오늘은 {name:와/과} 사진 한 장 남겨 두세요. 나중에 꺼내 보면 분명 웃게 될 거예요.",
          "따뜻한 차 한 잔 앞에 두고, {name}의 하루가 어땠는지 물어봐 주세요.",
          "오늘 장 보러 갈 일이 있다면 {name:와/과} 함께 가 보는 건 어때요?",
          "별일 없는 오늘이야말로 {name:와/과} 마주 앉기 좋은 날이에요.",
        ],
        sometimes: [
          "이번 주말엔 {name:을/를} 만나러 가 보세요. 얼굴 한 번 보는 것만으로도 충분해요.",
          "다음 만남 날짜를 오늘 미리 정해 두면, 기다리는 시간까지 즐거워져요.",
          "{name}에게 요즘 찍은 사진 한 장 보내 봐요. 짧은 안부로도 마음은 전해져요.",
          "오늘 {name}에게 전화 한 통 걸어 보세요. 목소리만 들어도 하루가 달라질 거예요.",
          "다음에 만날 땐 {name:이/가} 좋아하는 걸 하나 챙겨 가면 좋겠어요.",
          "이번 달이 가기 전에 {name:와/과} 밥 한 끼 약속을 잡아 봐요.",
          "\"보고 싶다\"는 말, 생각났을 때 바로 {name}에게 보내 보세요.",
          "다음 만남엔 {name:와/과} 사진 한 장 꼭 남겨 두기로 해요.",
        ],
        rarely: [
          "오늘은 {name}에게 전화 한 통 걸어 보세요. 5분이면 충분해요.",
          "다음 만남을 명절까지 미루지 말고, 오늘 날짜부터 정해 봐요.",
          "먼저 \"잘 지내?\" 하고 {name}에게 안부 한 줄 보내 보세요.",
          "오래 묵혀 둔 사진 한 장, 오늘 {name}에게 보내 주면 반가워할 거예요.",
          "영상 통화 한 번이면 멀리 있어도 얼굴을 볼 수 있어요. 오늘 걸어 보세요.",
          "올해가 가기 전에 {name:을/를} 한 번 더 만날 계획을 세워 두면 좋겠어요.",
          "바쁘다는 핑계는 잠시 접어 두고, 오늘은 {me:이/가} 먼저 연락해 봐요.",
          "다음 휴가 땐 {name}에게 잠깐이라도 들러 보는 건 어떨까요?",
        ],
        "elder.often": [
          "오늘 저녁엔 {name:와/과} 마주 앉아 맛있는 밥 한 끼 함께해 보세요.",
          "식사하시면서 {name}의 하루가 어떠셨는지 여쭤봐 드리세요. 생각보다 많이 기뻐하실 거예요.",
          "저녁 먹고 {name:와/과} 동네 한 바퀴 천천히 걸어 보면 좋겠어요.",
          "늘 곁에 계셔서 미뤄 둔 \"고마워요\"라는 말, 오늘은 꼭 전해 드리세요.",
          "오늘은 {name:와/과} 사진 한 장 찍어 두세요. 나중에 가장 아끼는 사진이 될지도 몰라요.",
          "{name:이/가} 좋아하시는 반찬 하나, 오늘은 {me:이/가} 해 드려 보는 건 어때요?",
          "오늘은 {name}의 옛날이야기를 끝까지 들어 드려 보세요.",
          "별일 없는 하루라도, {name:와/과} 차 한 잔 나누기엔 충분한 날이에요.",
        ],
        "elder.sometimes": [
          "이번 주말엔 {name:을/를} 찾아뵈러 가 보세요. 얼굴 보여 드리는 것만으로도 큰 선물이에요.",
          "이번에 찾아뵐 땐 {name:이/가} 좋아하시는 걸 하나 사 들고 가 보세요.",
          "오늘 {name}께 전화 한 통 드려 보세요. 목소리만 들으셔도 하루가 환해지실 거예요.",
          "다음에 찾아뵐 날을 오늘 미리 정해 두면, {name}께도 기다리는 즐거움이 생겨요.",
          "요즘 찍은 사진 한 장 {name}께 보내 드리면 분명 좋아하실 거예요.",
          "이번 달이 가기 전에 {name:와/과} 밥 한 끼 꼭 함께하기로 해요.",
          "다음에 뵐 땐 {name:와/과} 사진 한 장 꼭 남겨 두세요.",
          "\"보고 싶어요\" 한마디, 오늘은 {name}께 먼저 건네 보세요.",
        ],
        "elder.rarely": [
          "오늘은 {name}께 전화 한 통 드려 보세요. 5분이면 충분해요.",
          "다음 명절까지 기다리지 말고, 이번엔 먼저 찾아뵐 날을 정해 봐요.",
          "짧은 안부 문자라도 {name}께는 하루 종일 기쁜 소식이 될 거예요.",
          "영상 통화 한 번이면 멀리 계셔도 얼굴을 뵐 수 있어요. 오늘 걸어 보세요.",
          "올해가 가기 전에 {name:을/를} 한 번 더 찾아뵐 계획을 세워 두면 좋겠어요.",
          "{name:와/과} 함께 찍은 옛 사진 한 장, 오늘 보내 드려 보세요.",
          "바쁘다는 말은 잠시 내려놓고, 오늘은 {name}께 먼저 연락드려 봐요.",
          "이번 휴가엔 {name}께 잠깐이라도 들러 보세요. 오래 기억하실 거예요.",
        ],
        "*": [
          "오늘은 {name}에게 먼저 연락해 봐요.",
          "오늘 저녁, {name:와/과} 밥 한 끼 함께하면 좋겠어요.",
          "오늘은 {name}에게 전화 한 통 걸어 보세요.",
        ],
      },
      past: {
        senior: [
          "{name:와/과} {me:이/가} 함께해 온 시간이 벌써 {pct}%예요. 그만큼 쌓인 추억이 많다는 뜻이에요.",
          "지나온 {pct}%의 날들 덕분에 지금의 {me:이/가} 있어요. 남은 날들도 따뜻하게 채워 가요.",
          "함께한 시간이 이렇게나 많았어요. 남은 날들은 고마운 마음을 전하는 데 써 보면 좋겠어요.",
          "{pct}%의 날들을 함께 지나왔어요. 남은 하루하루도 서로에게 선물이 되길 바라요.",
          "오래 함께해 온 만큼, 남은 날들은 더 다정하게 보내요.",
        ],
        start: [
          "{name:와/과} {me}의 이야기는 이제 겨우 {pct}%가 지났어요. 앞으로 함께 채워 갈 날들이 훨씬 많아요.",
          "함께할 시간의 {pct}%만 지났을 뿐이에요. 지금 이 설렘을 오래오래 아껴 주세요.",
          "{name:와/과}의 날들은 이제 막 첫 장을 넘겼어요. 남은 장들도 예쁘게 채워 가길 바라요.",
          "아직 {pct}%. {name:와/과} 쌓아 갈 추억이 거의 다 앞에 남아 있어요.",
          "둘의 시간은 이제 시작이에요. 처음의 마음을 잊지 않으면 좋겠어요.",
          "{name:와/과} 함께할 날의 대부분이 아직 앞에 있어요. 서두르지 말고 하나씩 쌓아 가요.",
        ],
        early: [
          "{name:와/과} {me:이/가} 함께할 시간은 {pct}%가 지났어요. 아직 많이 남았지만, 생각보다 빨리 흘러가요.",
          "지금까지 {pct}%를 함께 걸어왔어요. 남은 길이 더 길지만, 그 길도 금방 지나갈 거예요.",
          "{name:와/과}의 시간은 아직 초반이에요. 지금 쌓는 하루하루가 나중에 큰 힘이 될 거예요.",
          "{pct}%가 지났어요. 남은 날이 훨씬 많을 때, 더 자주 만나 두세요.",
          "{name:와/과} 함께한 날보다 함께할 날이 아직 더 많아요. 그 날들을 아껴 써 주세요.",
          "벌써 {pct}%. 남은 시간이 넉넉해 보일 때가 가장 소중한 때예요.",
        ],
        middle: [
          "{name:와/과} {me:이/가} 함께할 시간은 벌써 {pct}%가 지나갔어요. 남은 날들을 천천히, 소중히 보내 주세요.",
          "어느새 {pct}%, 절반쯤 왔어요. 지나온 날만큼 남은 날도 따뜻하게 채워 가면 좋겠어요.",
          "{pct}%를 함께 지나왔어요. 이제부터의 하루하루가 더 귀해질 거예요.",
          "{name:와/과}의 시간은 {pct}%, 반환점 근처에 와 있어요. 남은 만남을 어떻게 채울지 한번 생각해 봐요.",
          "벌써 {pct}%가 지났어요. 다음 만남이 조금 더 특별해지면 좋겠어요.",
          "함께할 시간의 {pct}%가 흘렀어요. 남은 날들도 오늘처럼 서로 아껴 주세요.",
        ],
        late: [
          "{name:와/과} {me:이/가} 함께할 시간은 벌써 {pct}%가 지나갔어요. 남은 만남 하나하나를 소중히 여겨 주세요.",
          "{pct}%를 이미 지나왔어요. 이제는 한 번의 만남이 예전보다 훨씬 크게 다가와요.",
          "함께할 시간의 {pct}%가 지나갔어요. 그래서 오늘의 한 번이 더 귀해요.",
          "벌써 {pct}%. 남은 만남이 많지 않다는 걸 알면, 오늘이 조금 달라 보일 거예요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 남은 날들은 미루지 말고 함께해 주세요.",
          "지나온 {pct}%의 날들이 그랬듯, 남은 날들도 따뜻하게 채워 가길 바라요.",
        ],
        last: [
          "{name:와/과} {me:이/가} 함께할 시간은 이제 {pct}%가 지나갔어요. 남은 만남 하루하루를 모두 소중히 여겨 주세요.",
          "함께할 시간의 {pct}%가 이미 흘렀어요. 남은 한 번 한 번을 마음에 꼭 담아 두세요.",
          "벌써 {pct}%가 지났어요. 다음 만남을 '언젠가'로 미루지 않으면 좋겠어요.",
          "{pct}%. 남은 만남은 지나온 날에 비하면 아주 적어요. 그래서 더 소중해요.",
          "지나온 날이 {pct}%예요. 남은 날들은 하루도 허투루 보내지 말아요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 오늘 같은 평범한 하루가 가장 귀한 선물이에요.",
        ],
        "elder.late": [
          "{name:와/과} {me:이/가} 함께할 시간은 벌써 {pct}%가 지나갔어요. 남은 만남 하나하나를 소중히 여겨 주세요.",
          "{pct}%를 이미 지나왔어요. {name}께 받은 만큼, 남은 날엔 조금씩 돌려 드려요.",
          "벌써 {pct}%. 다음에 찾아뵐 땐 조금 더 오래 머물다 오면 좋겠어요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 남은 날들은 미루지 말고 함께해 드리세요.",
          "지나온 {pct}%의 날들처럼, 남은 날도 {name} 곁에서 따뜻하게 채워 가요.",
        ],
        "elder.last": [
          "{name:와/과} {me:이/가} 함께할 시간은 이제 {pct}%가 지나갔어요. 남은 만남 하루하루를 모두 소중히 여겨 주세요.",
          "{name:와/과} 보낸 시간의 {pct}%가 이미 흘렀어요. 다음에 찾아뵐 날을 '언젠가'로 미루지 말아요.",
          "벌써 {pct}%가 지났어요. {name}께 드리고 싶은 말이 있다면, 다음 만남에 꼭 꺼내 보세요.",
          "{pct}%를 함께 지나왔어요. 남은 날들은 {name} 곁에 조금 더 오래 머물러 주세요.",
          "매일이던 만남이 어느새 이만큼 줄었어요. 벌써 {pct}%가 지났으니, 남은 날들을 마음에 꼭 담아 두세요.",
        ],
        "partner.start": [
          "{name:와/과} {me}의 이야기는 이제 막 시작됐어요. 지금의 설렘을 오래오래 아껴 주세요.",
          "둘의 시간은 아직 {pct}%. 앞으로 함께 채워 갈 날들이 훨씬 많아요.",
          "이제 겨우 첫 장을 넘겼을 뿐이에요. {name:와/과} 써 내려갈 이야기가 기대되네요.",
          "{name:와/과} 함께한 날은 아직 {pct}%. 처음의 마음을 잊지 않으면 좋겠어요.",
          "지금은 모든 게 처음이라 더 반짝이는 때예요. {name:와/과}의 오늘을 마음껏 즐겨요.",
        ],
        "partner.early": [
          "{name:와/과} {me}의 시간은 아직 {pct}%를 지났을 뿐이에요. 함께 갈 길이 훨씬 길어요.",
          "둘의 이야기는 아직 초반이에요. 지금처럼만 서로를 아껴 주세요.",
          "{pct}%를 함께 지나왔어요. 남은 날들도 지금처럼 다정하게 채워 가요.",
          "{name:와/과} 쌓아 갈 날이 아직 많이 남았어요. 그래도 오늘을 미루지는 말아요.",
          "지금 쌓는 평범한 하루들이 나중엔 둘만의 가장 큰 추억이 될 거예요.",
        ],
      },
      met: {
        "*": [
          "잘했어요. 오늘로 올해 {n}번째 만남이에요.",
          "오늘의 만남, 잘 담아 둘게요. 올해 {n}번째예요.",
          "{name:와/과} 함께한 오늘이 하나 더 쌓였어요. 올해 {n}번째예요.",
          "소중한 하루를 보냈네요. 올해 {n}번째 만남이에요.",
          "오늘 같은 날이 오래 기억에 남을 거예요. 올해 {n}번째예요.",
          "한 번 더 만났네요. 올해 {n}번째, 참 잘했어요.",
          "{name}에게도 좋은 하루였을 거예요. 올해 {n}번째예요.",
          "오늘의 만남을 남겨 둘게요. 올해 {n}번째예요.",
        ],
        elder: [
          "찾아뵙길 잘했어요. 올해 {n}번째 만남이에요.",
          "{name}께도 오늘이 좋은 하루였을 거예요. 올해 {n}번째예요.",
          "오늘 함께한 시간, {name}께선 오래 기억하실 거예요. 올해 {n}번째예요.",
          "잘했어요. {name:와/과}의 올해 {n}번째 만남이에요.",
        ],
      },
    },
    en: {
      cheer: { "*": ["{name} has already lived beyond the average life expectancy in {country}. That's years of good care paying off.", "{name} is outliving the {country} average. That's worth celebrating."] },
      then: {
        parent: [
          "There was a time every morning began with {name}'s voice.",
          "You used to come home from school to find {name} waiting for you.",
          "Once, you sat down to {name}'s cooking every single day.",
          "There were years when you saw {name} every day without a second thought.",
          "Dinner with {name} used to be just an ordinary, everyday thing.",
        ],
      },
      now: {
        "after.*": [
          "Now there are {count} visits left. Counted in days, that's not even {span}.",
          "These days, {count} times remain. Even meeting daily, that's less than {span}.",
          "Now it's {count} times. Laid end to end, they wouldn't fill {span}.",
          "Time moved on, and now {count} visits are left: less than {span} of days.",
          "Today, what's left is {count} times. Every day in a row, it wouldn't reach {span}.",
        ],
        "*": [
          "You have about {count} more visits with {name}. Counted in days, that's not even {span}.",
          "{count} times left with {name}. Even if you met every day, that's less than {span}.",
          "Your time with {name} comes to {count} more visits, under {span} day by day.",
          "At this pace, you'll see {name} {count} more times. That's less than {span} of days.",
          "{count} visits left with {name}. Back to back, they wouldn't fill {span}.",
        ],
      },
      today: {
        often: [
          "Share dinner with {name} tonight and ask how their day went.",
          "Put your phone away tonight and really listen to {name}.",
          "A slow walk with {name} after dinner would be a lovely thing today.",
          "That thank-you you keep putting off? Today's a good day to say it.",
          "Take one photo with {name} today. You'll be glad you did.",
        ],
        sometimes: [
          "This weekend, go see {name}. Just showing up is enough.",
          "Pick the date of your next visit today, and the waiting becomes part of the joy.",
          "Send {name} a recent photo. A small hello still carries a lot.",
          "Give {name} a call today. Hearing your voice may make their whole day.",
          "Next time, bring {name} something they love.",
        ],
        rarely: [
          "Call {name} today. Five minutes is plenty.",
          "Don't wait for the holidays. Set a date to see {name}.",
          "Send {name} a quick \"how are you?\" before the day ends.",
          "A video call puts you face to face, even from far away. Try one today.",
          "Make a plan to see {name} once more before the year is out.",
        ],
        "*": ["Reach out to {name} today."],
      },
      past: {
        start: [
          "Your story with {name} has only just begun, {pct}% so far. Hold on to this feeling.",
          "Only {pct}% of your time together has passed. Most of it is still ahead.",
          "You've just turned the first page with {name}. Fill the rest beautifully.",
          "So far, {pct}%. Nearly all the memories you'll make are still to come.",
          "It's all still new with {name}. No need to rush; enjoy every bit.",
        ],
        early: [
          "{pct}% of your time with {name} has passed. Plenty remains, but it moves faster than you think.",
          "You've walked {pct}% of the way together. The road ahead is longer, and it goes quickly.",
          "It's still early with {name}. The ordinary days you share now will matter later.",
          "{pct}% gone. See each other often while there's still plenty of time.",
          "More days ahead than behind with {name}. Spend them well.",
        ],
        middle: [
          "{pct}% of your time with {name} has already passed. Take the rest slowly, and gently.",
          "You're about halfway there. May the days ahead be as warm as the ones behind.",
          "{pct}% behind you. From here, each day counts a little more.",
          "With {name}, you're near the middle now. Think about how you'd like to fill the rest.",
          "{pct}% has gone by. Let the next visit be a little more special.",
        ],
        late: [
          "{pct}% of your time with {name} is already behind you. Please treasure every visit that's left.",
          "{pct}% has passed. Each visit now means more than it used to.",
          "Most of your time together has gone by. That's what makes today's visit precious.",
          "{pct}% already. Knowing that, today might look a little different.",
          "{pct}% has slipped by. Don't put off the visits that remain.",
        ],
        last: [
          "{pct}% of your time with {name} has already passed. Please hold every remaining visit close.",
          "{pct}% is behind you. Keep each visit that's left close to your heart.",
          "{pct}% has gone by. Try not to leave the next visit for 'someday.'",
          "{pct}% of the way. The visits left are few next to the ones behind, and all the more precious.",
          "{pct}% has passed. An ordinary day together is the finest gift now.",
        ],
      },
      met: {
        "*": [
          "Well done. That's visit {n} this year.",
          "Today's visit is saved. That's {n} this year.",
          "One more day with {name}. That's {n} this year.",
          "A good day spent together. That's {n} this year.",
          "Glad you went. That's {n} this year.",
        ],
      },
    },
    ja: {
      cheer: { "*": ["{name}は{country}の平均寿命を超えて、元気に過ごされています。日頃の健康管理のおかげですね。", "{country}の平均寿命より長く、そばにいてくれています。本当におめでたいことです。"] },
      then: {
        parent: [
          "毎朝、{name}の声で一日が始まっていた頃がありましたね。",
          "学校から帰ると、いつも{name}が待っていてくれましたね。",
          "{name}の作ってくれるごはんを、毎日食べていた頃がありました。",
          "毎日{name}と顔を合わせるのが、当たり前だった頃がありましたね。",
          "{name}と囲む夕食が、特別でもなんでもない毎日でした。",
        ],
      },
      now: {
        "after.*": [
          "今では、会えるのはあと{count}回。日にちに直すと{span}にも届きません。",
          "それが今では{count}回。毎日会ったとしても{span}もかかりません。",
          "今、残っているのは{count}回。一日ずつ並べても{span}に満たないんです。",
          "時が流れて、あと{count}回になりました。日数で数えると{span}足らずです。",
          "これから会えるのは{count}回。毎日続けても{span}もたたずに終わってしまいます。",
        ],
        "*": [
          "{name}とこれから会えるのは{count}回。日数にすると{span}にも満たないんです。",
          "{name}と会えるのはあと{count}回。毎日会っても{span}もかかりません。",
          "{name}との残りの時間は{count}回。一日ずつ並べても{span}に届きません。",
          "今のペースだと、{name}に会えるのはあと{count}回。日にちにすれば{span}足らずです。",
          "あと{count}回、{name}に会えます。毎日なら{span}もたたずに過ぎてしまいます。",
        ],
      },
      today: {
        often: [
          "今夜は{name}と同じ食卓で、今日の話をしてみてください。",
          "スマホを置いて、今日は{name}の話にゆっくり耳を傾けてみましょう。",
          "夕飯のあと、{name}と近所を少し歩いてみるのもいいですね。",
          "いつも言いそびれる「ありがとう」、今日は伝えるのにいい日です。",
          "今日は{name}と写真を一枚。きっと大切な一枚になります。",
        ],
        sometimes: [
          "今週末は{name}に会いに行ってみて。顔を見せるだけで十分です。",
          "次に会う日を今日決めておけば、待つ時間まで楽しくなります。",
          "最近の写真を一枚、{name}に送ってみましょう。",
          "今日は{name}に電話を。声を聞くだけで一日が変わります。",
          "次に会うときは、{name}の好きなものを持っていきましょう。",
        ],
        rarely: [
          "今日は{name}に電話を一本。5分で十分です。",
          "お盆やお正月を待たずに、会いに行く日を決めてみて。",
          "「元気？」の一言を、今日{name}に送ってみましょう。",
          "ビデオ通話なら、遠くても顔が見られます。今日かけてみて。",
          "今年のうちに、もう一度{name}に会う計画を立てておきましょう。",
        ],
        "*": ["今日、{name}に連絡してみましょう。"],
      },
      past: {
        start: [
          "{name}との物語は、まだ{pct}%。これから一緒に重ねる日のほうがずっと多いんです。",
          "まだ始まったばかり。今のときめきを、どうか大切に。",
          "{name}との日々は、まだ最初のページ。続きを素敵に書いていってください。",
          "まだ{pct}%。思い出のほとんどは、これから作られます。",
          "一緒に過ごす日の大半は、まだこの先にあります。焦らず、ひとつずつ。",
        ],
        early: [
          "{name}と過ごす時間は{pct}%が過ぎました。まだたくさんありますが、思ったより速く流れます。",
          "ここまで{pct}%を一緒に歩いてきました。この先のほうが長いけれど、すぐに過ぎていきます。",
          "まだ序盤。今の何気ない一日が、いつか宝物になります。",
          "{pct}%が過ぎました。時間がたっぷりあるうちに、たくさん会っておきましょう。",
          "過ぎた日より、これからの日のほうが多い。大切に使ってください。",
        ],
        middle: [
          "{name}と過ごす時間は、もう{pct}%が過ぎました。残りの日々を、ゆっくり大切に。",
          "いつの間にか半分ほど。これからの日々も、温かく満たしていけますように。",
          "{pct}%を一緒に過ごしてきました。ここからの一日は、もっと尊くなります。",
          "ちょうど折り返しのあたり。残りの時間をどう過ごすか、少し考えてみませんか。",
          "{pct}%が過ぎました。次に会う日が、少し特別になりますように。",
        ],
        late: [
          "{name}と過ごす時間は、もう{pct}%が過ぎました。残りの一回一回を大切にしてください。",
          "{pct}%が過ぎました。今の一回は、昔よりずっと重みがあります。",
          "一緒の時間の大半は過ぎました。だからこそ、今日の一回が尊いんです。",
          "もう{pct}%。そう知るだけで、今日が少し違って見えるはず。",
          "{pct}%が流れました。残りの日々を、先延ばしにしないでください。",
        ],
        last: [
          "{name}と過ごす時間は、もう{pct}%が過ぎました。残りの一日一日を、どうか大切に。",
          "{pct}%が過ぎました。残りの一回一回を、心にしまっておいてください。",
          "もう{pct}%。次に会う日を「いつか」にしないでくださいね。",
          "{pct}%を過ごしてきました。残りの回数は少ないけれど、だからこそ愛おしい。",
          "{pct}%が過ぎました。何気ない一日こそ、いちばんの贈りものです。",
        ],
      },
      met: {
        "*": [
          "よく会いに行きましたね。今年{n}回目です。",
          "今日の時間、ちゃんと残しておきます。今年{n}回目。",
          "{name}との一日がまたひとつ。今年{n}回目です。",
          "いい一日でしたね。今年{n}回目です。",
          "会えてよかったですね。今年{n}回目です。",
        ],
      },
    },
    es: {
      cheer: { "*": ["{name} ya supera la esperanza de vida media de {country}. Fruto de años cuidándose bien.", "{name} vive más que la media de {country}. Eso merece celebrarse."] },
      then: {
        parent: [
          "Hubo un tiempo en que cada mañana empezaba con la voz de {name}.",
          "Al volver del colegio, {name} siempre estaba esperándote.",
          "Antes, cenar con {name} era lo más normal del mundo, cada noche.",
        ],
      },
      now: {
        "after.*": [
          "Ahora quedan {count} veces. Contadas en días, no llegan a {span}.",
          "Hoy quedan {count} encuentros. Aunque os vierais a diario, no sería ni {span}.",
          "El tiempo pasó y ahora son {count} veces: menos de {span}, día a día.",
        ],
        "*": [
          "Con {name} os quedan unas {count} veces. Contadas en días, no llegan a {span}.",
          "Quedan {count} encuentros con {name}. Aunque os vierais a diario, no sería ni {span}.",
          "A este ritmo, verás a {name} {count} veces más: menos de {span}, día a día.",
        ],
      },
      today: {
        often: [
          "Esta noche, cena con {name} y pregúntale qué tal su día.",
          "Deja el móvil un rato y escucha de verdad a {name}.",
          "Un paseo tranquilo con {name} después de cenar sería un buen plan.",
        ],
        sometimes: [
          "Este fin de semana, ve a ver a {name}. Con aparecer basta.",
          "Pon hoy fecha a la próxima visita; la espera también cuenta.",
          "Mándale a {name} una foto reciente. Un saludo pequeño dice mucho.",
        ],
        rarely: [
          "Llama hoy a {name}. Cinco minutos bastan.",
          "No esperes a las fiestas: pon fecha para ver a {name}.",
          "Escríbele a {name} un \"¿qué tal?\" antes de que acabe el día.",
        ],
        "*": ["Escríbele hoy a {name}."],
      },
      past: {
        start: [
          "Vuestra historia acaba de empezar: solo ha pasado un {pct}%. Cuida esta ilusión.",
          "Casi todo el tiempo con {name} está todavía por delante.",
          "Acabáis de pasar la primera página. Llenad el resto con cariño.",
        ],
        early: [
          "Ha pasado un {pct}% de tu tiempo con {name}. Queda mucho, pero pasa más rápido de lo que crees.",
          "Lleváis un {pct}% del camino. Lo que queda es más largo, y aun así se va volando.",
          "Aún es pronto. Los días normales de ahora valdrán mucho más adelante.",
        ],
        middle: [
          "Ya ha pasado un {pct}% de tu tiempo con {name}. Vive lo que queda despacio y con cariño.",
          "Vais más o menos por la mitad. Que lo que viene sea tan cálido como lo vivido.",
          "Un {pct}% ya quedó atrás. Desde aquí, cada día cuenta un poco más.",
        ],
        late: [
          "Ya ha pasado un {pct}% de tu tiempo con {name}. Cuida cada encuentro que queda.",
          "Un {pct}% ya pasó. Cada visita pesa ahora más que antes.",
          "La mayor parte del tiempo juntos ya pasó. Por eso la visita de hoy vale tanto.",
        ],
        last: [
          "Ya ha pasado un {pct}% de tu tiempo con {name}. Guarda cerca cada encuentro que queda.",
          "Un {pct}% ya quedó atrás. No dejes la próxima visita para \"algún día\".",
          "Un {pct}% ya pasó. Un día cualquiera juntos es ahora el mejor regalo.",
        ],
      },
      met: {
        "*": [
          "Bien hecho. Ya van {n} este año.",
          "Guardado. Es el encuentro número {n} de este año.",
          "Un día más con {name}. Ya van {n} este año.",
        ],
      },
    },
    zh: {
      cheer: { "*": ["{name}已经超过了{country}的平均寿命，这是多年好好照顾身体的结果。", "{name}比{country}的平均寿命更长寿，真值得庆祝。"] },
      then: {
        parent: [
          "曾经，每天早上都是在{name}的声音里醒来。",
          "放学回家，{name}总在家里等着你。",
          "那时候，和{name}一起吃晚饭，是再平常不过的事。",
        ],
      },
      now: {
        "after.*": [
          "如今，剩下的只有{count}次。按天数算，还不到{span}。",
          "现在还能见{count}次。就算每天见面，也不到{span}。",
          "时间过去了，如今只剩{count}次，连起来不到{span}。",
        ],
        "*": [
          "和{name}往后还能见{count}次。按天数算，还不到{span}。",
          "照现在这样，和{name}还能见{count}次。每天见也不到{span}。",
          "和{name}剩下的见面是{count}次，连起来不到{span}。",
        ],
      },
      today: {
        often: ["今晚和{name}一起吃顿饭，问问今天过得怎样。", "今天放下手机，好好听{name}说说话。", "饭后和{name}在附近慢慢走一走，也很好。"],
        sometimes: ["这个周末去看看{name}吧，露个面就够了。", "今天就把下次见面的日子定下来，等待也会变成期待。", "给{name}发一张最近的照片，小小的问候也很暖。"],
        rarely: ["今天给{name}打个电话，五分钟就够了。", "别等到过节，先把见{name}的日子定下来。", "今天给{name}发一句“最近好吗？”"],
        "*": ["今天联系一下{name}吧。"],
      },
      past: {
        start: ["你和{name}的故事才刚开始，只过去了{pct}%。好好珍惜这份心动。", "和{name}的大部分时光，都还在前面。", "才翻过第一页，剩下的慢慢写满吧。"],
        early: ["和{name}相处的时间已过去{pct}%。还有很多，但比想象中流得快。", "已经一起走了{pct}%的路，前面更长，也会很快走完。", "还在开头，现在平凡的每一天，以后都会很珍贵。"],
        middle: ["和{name}相处的时间，已经过去了{pct}%。剩下的日子，慢慢地、好好地过。", "不知不觉走到一半了，愿往后的日子和过去一样温暖。", "已经过去{pct}%，从现在起，每一天都更珍贵。"],
        late: ["和{name}相处的时间，已经过去了{pct}%。请珍惜剩下的每一次见面。", "过去了{pct}%，现在的每一次见面，都比从前更重。", "大部分的时光已经过去，所以今天这一次格外珍贵。"],
        last: ["和{name}相处的时间，已经过去了{pct}%。请珍惜剩下的每一天。", "过去了{pct}%，别把下次见面留给“以后”。", "已经过去{pct}%，平凡的一天，就是现在最好的礼物。"],
      },
      met: {
        "*": ["做得好，这是今年第{n}次见面。", "今天的见面记下了，今年第{n}次。", "和{name}又多了一天，今年第{n}次。"],
      },
    },
  },
  calm: {
    ko: {
      then: {
        parent: [
          "어릴 땐 {name:와/과} 매일 얼굴을 보며 지냈어요.",
          "함께 살던 시절엔 {name:와/과}의 만남이 매일이었죠.",
          "독립하기 전까지는 {name:와/과} 매일 마주했어요.",
        ],
      },
      now: {
        "after.*": [
          "지금은 {count}번이 남아 있어요. 매일로 치면 {span:이/가} 안 되는 횟수예요.",
          "이제 남은 만남은 {count}번이에요. 날짜로 세면 {span} 안쪽이에요.",
          "지금부터는 {count}번. 매일 만난다면 {span:이/가} 채 안 걸려요.",
        ],
        "*": [
          "{name:와/과} 앞으로 {count}번 만날 수 있어요. 매일로 치면 {span:이/가} 안 되는 횟수예요.",
          "{name:와/과} 남은 만남은 {count}번이에요. 날짜로 세면 {span} 안쪽이에요.",
          "{name:을/를} 만날 날은 {count}번 남았어요. 매일 만난다면 {span:이/가} 채 안 걸려요.",
        ],
      },
      today: {
        often: [
          "이번 주 {name:와/과} 함께할 저녁을 하나 정해 두세요.",
          "오늘은 {name:와/과} 이야기 나눌 시간을 조금 내 봐요.",
          "{name:와/과} 함께할 일을 하나 계획해 두면 좋아요.",
        ],
        sometimes: [
          "다음 만남 날짜를 미리 정해 두면 좋아요.",
          "이번 달 {name:와/과} 만날 날을 달력에 적어 두세요.",
          "오늘 {name}에게 짧게 안부를 전해 봐요.",
        ],
        rarely: [
          "다음 만남을 미리 계획해 두면 좋겠어요.",
          "올해 {name:와/과} 만날 날을 달력에 적어 두세요.",
          "오늘 {name}에게 연락 한 번 해 봐요.",
        ],
      },
      past: {
        start: [
          "함께할 시간의 {pct}%가 지났어요. 대부분은 아직 앞에 있어요.",
          "{name:와/과}의 시간은 이제 시작 단계예요. 계획할 날이 많아요.",
          "아직 {pct}%예요. 앞으로의 만남을 차근차근 쌓아 가면 돼요.",
        ],
        early: [
          "함께할 시간의 {pct}%가 지났어요. 남은 쪽이 더 커요.",
          "{name:와/과}의 시간 중 {pct}%를 지나왔어요.",
          "지난 몫은 {pct}%예요. 남은 만남을 계획해 두면 좋아요.",
        ],
        middle: [
          "함께할 시간의 {pct}%가 지났어요. 남은 몫과 비슷해요.",
          "{name:와/과}의 시간 중 절반 안팎을 지나왔어요.",
          "{pct}%가 지났어요. 남은 만남을 어떻게 쓸지 정해 둘 때예요.",
        ],
        late: [
          "함께할 시간의 {pct}%가 지났어요. 남은 몫은 그보다 작아요.",
          "{name:와/과}의 시간 중 대부분을 지나왔어요.",
          "{pct}%가 지났어요. 남은 만남은 미루지 않는 게 좋아요.",
        ],
        last: [
          "함께할 시간의 {pct}%가 지났어요.",
          "{name:와/과}의 시간 중 거의 전부를 지나왔어요. 남은 만남을 먼저 챙겨 두세요.",
          "{pct}%가 지났어요. 다음 만남 날짜부터 정해 두세요.",
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
          "어릴 적 {name:와/과} 마주 앉던 아침들, 아직 마음 한편에 남아 있죠.",
          "{name:이/가} 차려 주신 밥을 매일 먹던 따뜻한 시절이 있었어요.",
          "{name:와/과} 한 지붕 아래 지낸 날들이 지금의 {me:을/를} 만들었어요.",
        ],
      },
      now: {
        "after.*": [
          "그리고 아직 {count}번의 만남이 남아 있어요. 하루하루가 다 선물 같은 날들이에요.",
          "이제 {count}번, 매일로 치면 {span}. 그 하루하루를 다 선물처럼 받아 주세요.",
          "아직도 {name:와/과} 마주 앉을 날이 {count}번이나 남아 있어요.",
        ],
        "*": [
          "{name:와/과} 마주 앉을 날이 아직 {count}번 남아 있어요. 한 번 한 번이 선물이에요.",
          "{name:와/과}의 만남이 아직 {count}번 기다리고 있어요.",
          "{count}번, 매일이면 {span}. {name:와/과}의 그 하루하루가 다 선물이에요.",
        ],
      },
      today: {
        often: [
          "오늘 저녁 {name:와/과} 맛있는 밥 한 끼 함께해요.",
          "오늘은 {name}에게 따뜻한 말 한마디 건네 봐요.",
          "저녁 먹고 {name:와/과} 천천히 걸어 보면 좋겠어요.",
        ],
        sometimes: [
          "이번 주말엔 {name:을/를} 만나러 가 볼까요?",
          "{name}에게 좋아할 만한 사진 한 장 보내 봐요.",
          "다음 만남을 기분 좋게 약속해 두세요.",
        ],
        rarely: [
          "오늘 {name}의 목소리를 들어 보세요. 그거면 충분해요.",
          "{name}에게 \"보고 싶어\" 한마디 보내 봐요.",
          "다음에 {name:을/를} 만날 날을 설레며 기다려 봐요.",
        ],
      },
      past: {
        start: [
          "{name:와/과}의 이야기는 이제 막 시작됐어요. 좋은 날들이 잔뜩 기다리고 있어요.",
          "앞으로 {name:와/과} 쌓을 추억이 한가득이에요.",
          "아직 {pct}%. 설레는 날들이 훨씬 많이 남았어요.",
        ],
        early: [
          "{name:와/과} 함께할 날이 아직 훨씬 많아요. 천천히, 즐겁게 채워 가요.",
          "{pct}%를 지나왔어요. 좋은 날은 앞에도 많아요.",
          "{name:와/과} 만들 추억이 아직 많이 남았어요.",
        ],
        middle: [
          "{name:와/과} 함께한 날만큼, 함께할 날도 남아 있어요.",
          "{pct}%를 함께 걸어왔어요. 남은 길도 함께라서 다행이에요.",
          "{name:와/과}의 날들, 지금이 딱 한가운데예요.",
        ],
        late: [
          "{name:와/과} 함께한 {pct}%의 날들, 다 고마운 날이었죠. 남은 날도 그렇게 채워 가요.",
          "지나온 날만큼 남은 날도 따뜻하게 채워 가요.",
          "{name:와/과} 남은 날을 조금 더 다정하게 보내요.",
        ],
        last: [
          "{name:와/과} 함께한 날들이 이렇게나 많았어요. 남은 날도 고마운 마음으로 채워 가요.",
          "지나온 {pct}%의 시간, 그리고 아직 남은 오늘이 있어요.",
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

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
 *   - 편지처럼 다정하게. 상대 쪽 마음("오늘도 전화를 조금은 기다리셨을지도")과 작은 생활 장면(현관, 도마질 소리,
 *     문자 한 줄)으로 쓴다. "소중히 여겨 주세요·선물이에요·마음에 담아 두세요" 같은 상투어는 쓰지 않는다.
 *   - 끝맺음과 {span} 꼬리("채 안 돼요")는 같은 틀이 이어지지 않게 섞는다. "어때요/어떨까요"는 드물게.
 *   - 죄책감 주기·죽음 직접 언급은 쓰지 않는다. 남은 건 "만남"이지 "수명"이 아니다.
 *   - 「만났어요」(met)에 "N번 남았다"는 쓰지 않는다 — 줄어든 숫자는 바로 위 큰 숫자가 보여 준다.
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
      moment: {
        rarely: [
          "{title}, 앞으로 {count}번이에요. 해마다 오니까 끝이 없을 줄 알았는데, 세어 보니 이만큼이네요.",
          "1년에 한 번 오는 {title}. {count}번 중에 올해 것은 올해에만 있어요.",
          "{me:이/가} {title:을/를} 맞을 날은 {count}번이에요. 올해 이맘때는 한 번 가면 그만이고요.",
          "기다리면 또 오겠지 했던 {title}. {count}번이라고 들으니 마음이 조금 달라지죠.",
          "{title:은/는} 앞으로 {count}번. 한 번 놓치면 꼬박 한 해를 기다려야 해요.",
          "올해를 넘기면 {title:은/는} {count}번에서 하나가 줄어요. 그래서 이번이 좀 더 아까워요.",
        ],
        sometimes: [
          "{title}, 앞으로 {count}번. 한 달에 한두 번이면 생각보다 빨리 줄어드는 숫자예요.",
          "{count}번이면 넉넉해 보이죠. 바빠서 건너뛴 달들도 그 안에서 조용히 빠져나갔어요.",
          "{me:이/가} {title:을/를} 할 수 있는 날은 {count}번. 미뤄 둔 그 한 번도 그중 하나였죠.",
          "{title:은/는} 앞으로 {count}번. 달력 한 장에 한두 칸씩 채워지는 숫자예요.",
        ],
        often: [
          "{title}, 앞으로 {count}번. 매일 하는 일이라 끝이 있다는 걸 잊고 지내죠.",
          "늘 하던 {title}도 세어 보면 {count}번이에요. 오늘 것은 오늘 한 번뿐이고요.",
          "{count}번이면 많아 보여요. 그래도 그중 오늘 몫은 딱 하나예요.",
          "{title:은/는} {count}번. 아무렇지 않게 지나간 하루들이 이 숫자를 조금씩 줄여 왔어요.",
        ],
        "*": [
          "{title}, 앞으로 {count}번이에요. 숫자로 보니 손에 잡힐 만큼이죠.",
          "{me:이/가} {title:을/를} 누릴 날은 {count}번. 그중 같은 날은 하나도 없을 거예요.",
        ],
      },
      momentToday: {
        rarely: [
          "올해 {title:은/는} 날짜부터 잡아 둬요.",
          "이번엔 같이 가고 싶은 사람에게 먼저 말을 꺼내 봐요.",
          "이번 {title}엔 사진 한 장쯤 남겨 와요.",
          "다음에 하자는 말은 이번 {title}엔 넣어 둬도 돼요.",
        ],
        sometimes: [
          "이번 달 달력에 {title:을/를} 위한 하루를 동그라미 쳐 둬요.",
          "다음 한 번은 서두르지 않고 끝까지 있다 와도 괜찮아요.",
          "미뤄 둔 한 번이 있다면, 이번 주말이 딱 좋겠네요.",
        ],
        often: [
          "오늘 {title}만큼은 휴대폰을 가방에 넣어 두기로 해요.",
          "오늘의 한 번을 그냥 흘려보내지만 않으면 돼요.",
          "오늘 {title:은/는} 평소보다 조금만 더 길게 해 봐요.",
        ],
        "*": ["다음 한 번엔 마음을 조금 더 실어 보내요."],
      },
      cheer: {
        "*": [
          "{name}께서는 {country} 평균수명보다 오래 곁에 계셔 주세요. 몸을 잘 지켜 오신 덕분이에요.",
          "{country} 평균수명을 넘기셨어요. {name}께서 하루하루 몸을 돌봐 오신 시간이 쌓인 거예요.",
          "{name}께서는 {country} 평균보다 더 오래 함께해 주고 계세요. 축하드릴 일이죠.",
          "{country} 평균수명을 훌쩍 넘기셨네요. 그 덕분에 오늘도 {name}께 전화를 걸 수 있어요.",
          "{country} 평균수명보다 오래, 지금도 {name}께서 그 자리에 계세요. 참 고마운 일이에요.",
        ],
      },
      then: {
        parent: [
          "매일 아침 {name} 목소리에 눈을 뜨던 때가 있었죠.",
          "학교에서 돌아오면 늘 {name:이/가} 집에서 {me:을/를} 기다려 주셨죠.",
          "{name:이/가} 차려 주신 밥을 아무렇지 않게 매일 먹던 시절이 있었어요.",
          "한 지붕 아래에서 {name:와/과} 매일 얼굴을 마주하던 날들이 있었죠.",
          "아픈 밤이면 {name:이/가} 이마에 손을 얹고 곁을 지켜 주셨죠.",
          "그땐 {name:와/과} 먹는 저녁이 특별할 것 없는 매일이었어요.",
          "어릴 적엔 하루에도 몇 번씩 \"{name}\" 하고 부르곤 했죠.",
          "{name}의 잔소리가 끝도 없이 이어질 것만 같던 날들이 있었어요.",
          "늦게 들어오는 날이면 {name:이/가} 거실 불을 켜 두고 기다리셨죠.",
          "부엌에서 {name:이/가} 도마질하는 소리로 저녁이 오던 때가 있었죠.",
        ],
      },
      now: {
        senior: [
          "{name:와/과} 마주 앉을 날은 {count}번이에요. 그때마다 {name}께서는 현관까지 나와 계시겠죠.",
          "앞으로 {count}번. 숫자보다, 그날마다 {name}께서 꺼내실 이야기가 더 궁금해져요.",
          "{name}께서 웃으시는 얼굴을 볼 날이 {count}번 있어요. 그 웃음이 매번 조금씩 달라요.",
          "{name}께서는 {count}번의 만남마다 달력에 동그라미를 치실 것 같아요.",
          "{name}께서 문 열어 주실 날이 {count}번이에요. 그 문소리는 오래 기억에 남아요.",
          "앞으로 {count}번, {name}께서는 그날마다 {me} 얼굴부터 살피실 거예요.",
        ],
        "senior.after": [
          "지금은 {name}께서 {me:을/를} 기다리실 차례예요. 앞으로 {count}번, 그 기다림에 답할 수 있어요.",
          "이제는 한 번 한 번의 만남이 그 시절의 매일만큼 깊어졌어요.",
          "지금은 {name:와/과} 마주 앉는 날이 {count}번이에요. 그날마다 그때 이야기가 나오겠죠.",
          "요즘 함께하는 하루는 그 시절의 매일보다 오래 마음에 남아요.",
          "이제 {count}번이에요. 숫자로는 다 담기지 않는, {name}께서 기다리시는 날들이에요.",
        ],
        "after.*": [
          "이제는 {count}번이에요. 날마다 만난다 쳐도 {span} 안에 끝나요.",
          "그런데 이제 남은 건 {count}번. 하루도 빠짐없이 만나도 {span}에 못 미쳐요.",
          "지금은 {count}번이 남았어요. 그 시절의 매일로 치면 {span}도 안 되는 날들이에요.",
          "이제 {name:와/과} 마주할 날은 {count}번이에요. 이어 붙이면 {span}도 다 못 채우죠.",
          "그 많던 날들이 지나고 이제 {count}번이 남았어요. 날짜로 치면 {span:이/가} 채 안 돼요.",
          "이제는 {count}번. 그때처럼 매일 본다면 {span:이/가} 다 가기 전에 끝나 버려요.",
          "지금은 {name}께서 {me:을/를} 기다리시는 쪽이에요. 앞으로 {count}번, {span:이/가} 채 안 되는 날들이에요.",
          "그런데 지금은 {count}번. 그때의 하루하루로 바꾸면 {span:을/를} 넘기지 못해요.",
          "이제 남은 건 {count}번이에요. 그 시절처럼 하루씩 이어 보면 {span}도 채 되지 않아요.",
          "지금 {name:와/과} 남은 만남은 {count}번. 그때처럼 날마다 보면 {span} 안에 다 만나요.",
        ],
        "after.week": [
          "이제 {count}번. 일주일이면 다 써 버릴 만큼이죠.",
          "그런데 이제 남은 건 {count}번. 두 손으로 다 셀 수 있을 만큼이에요.",
          "이제 {count}번이에요. 그 한 번마다 {name}께서 문 앞에 나와 계실 거예요.",
        ],
        "after.month": [
          "이제 남은 만남은 {count}번이에요. 달력 한 장이면 다 넘어가는 날들이죠.",
          "그런데 이제는 {count}번. 그때처럼 매일 보면 한 달도 안 걸려요.",
          "이제는 손가락으로 꼽아 볼 수 있을 만큼, {count}번이 남았어요.",
        ],
        "*": [
          "{name:와/과} 앞으로 만날 날은 {count}번이에요. 날짜로만 세면 {span:이/가} 다 차지 않아요.",
          "{name:와/과} 마주 앉을 수 있는 날은 {count}번, 날짜로 치면 {span:이/가} 채 안 돼요.",
          "{name:와/과} 남은 만남은 {count}번이에요. 하루씩 이어 붙여도 {span}에 못 미치는 시간이죠.",
          "{name:을/를} 볼 수 있는 날이 {count}번이에요. 매일 본다 해도 {span:을/를} 채우지 못해요.",
          "{name}도 가끔 {me} 생각을 하겠죠. 서로 마주할 날은 {count}번, {span}도 못 채워요.",
          "{count}번. {name:와/과} 앞으로 만날 수 있는 횟수예요. 이어 붙이면 {span} 안에 다 들어가요.",
          "{name:와/과} 보낼 날이 {count}번 있어요. 하루에 한 번씩이면 {span:이/가} 가기 전에 끝나요.",
          "지금처럼 만나면 {name:을/를} {count}번 더 볼 수 있어요. 날짜로 치면 {span}도 안 걸려요.",
          "{name:와/과} \"또 보자\" 하고 헤어질 날이 {count}번이에요. 다 이어도 {span} 안쪽이에요.",
          "{name:와/과} 남은 날은 {count}번이에요. 매일 만나도 {span:을/를} 넘기지 못하는 숫자죠.",
        ],
        week: [
          "{count}번이면 한 주 안에 다 지나가요. {name:와/과} 남은 만남 얘기예요.",
          "{name:와/과} 만날 날은 {count}번. 두 손이면 다 세어지는 숫자예요.",
          "{name:와/과}의 만남은 이제 {count}번. 다음 한 번은 오래 기억에 남을 거예요.",
        ],
        month: [
          "달력 한 장이면 다 넘어가요. {name:와/과} 남은 만남 {count}번 말이에요.",
          "{name:와/과} 만날 날이 {count}번이에요. 매일 만나면 한 달이 채 안 걸려요.",
          "손가락으로 꼽아 볼 수 있을 만큼 줄었어요. {name:와/과}의 만남, 이제 {count}번이에요.",
        ],
        more: [
          "{name:와/과} 앞으로 만날 날은 {count}번이에요. 넉넉해 보여도 날짜로 세면 {span}도 안 돼요.",
          "{count}번이면 아직 많아 보이죠. 그래도 매일 만난다면 {span:이/가} 가기 전에 다 지나가요.",
          "{name:와/과} 남은 만남은 {count}번. 넉넉해 보이는 지금이 가장 많이 남아 있는 때예요.",
        ],
      },
      today: {
        senior: [
          "이번 주엔 {name}께 전화 한 통 드려요. 첫마디부터 목소리가 밝아지실 거예요.",
          "다음에 찾아뵐 땐 옛날 사진 몇 장 챙겨 가요. 그때 이야기가 한참 길어질 거예요.",
          "{name}께서 좋아하시는 간식 하나 사 들고 가요. 거창한 건 필요 없어요.",
          "\"보고 싶었어요\" 한마디면, {name}께서는 그 말을 저녁까지 곱씹으실 거예요.",
          "다음에 뵐 땐 {name}의 손을 한 번 오래 잡아 드려요.",
          "{name}께 어릴 적 이야기를 여쭤보면, 처음 듣는 이야기가 나올지도 몰라요.",
          "영상 통화로 얼굴만 보여 드려도 {name}께서는 화면 앞으로 바짝 다가앉으실 거예요.",
          "다음 만남엔 {name:와/과} 나란히 서서 사진 한 장 찍어요.",
        ],
        often: [
          "오늘 저녁엔 {name:와/과} 같은 밥상에 앉아 하루 이야기를 나눠 봐요.",
          "오늘은 휴대폰을 엎어 두고 {name}의 이야기를 끝까지 들어요.",
          "저녁 먹고 {name:와/과} 동네 한 바퀴, 천천히 걸어요.",
          "늘 곁에 있어 미뤄 둔 \"고마워\", 오늘은 말해도 괜찮아요.",
          "오늘은 {name:와/과} 사진 한 장 찍어 둬요. 나중에 꺼내 보면 둘 다 웃음부터 나요.",
          "{name}의 오늘이 어땠는지, 차 한 잔 앞에 두고 물어봐 주면 돼요.",
          "{name}도 오늘 하고 싶은 말이 쌓여 있을지 몰라요. 먼저 물어봐 줘요.",
          "별일 없는 오늘이야말로 {name:와/과} 마주 앉기 좋은 날이에요.",
        ],
        sometimes: [
          "이번 주말엔 {name:을/를} 보러 가요. 얼굴만 보고 와도 돼요.",
          "다음 만남 날짜를 오늘 정해 두면, 기다리는 며칠도 즐거워져요.",
          "{name}에게 요즘 찍은 사진 한 장 보내 봐요. 답장이 생각보다 빨리 올지도 몰라요.",
          "{name}도 {me} 연락을 기다리던 참일 거예요. 오늘은 먼저 전화해 봐요.",
          "다음에 만날 땐 {name:이/가} 좋아하는 걸 하나 챙겨 가면 좋겠어요.",
          "이번 달이 가기 전에 {name:와/과} 밥 한 끼 약속을 잡아 둬요.",
          "\"보고 싶다\"는 말, 생각난 김에 {name}에게 보내 봐요.",
          "다음 만남엔 {name:와/과} 사진 한 장쯤 남겨 두기로 해요.",
        ],
        rarely: [
          "오늘은 {name}에게 전화 한 통 걸어 봐요. 버스 기다리는 5분이면 돼요.",
          "다음 만남을 명절까지 미루지 않아도 돼요. 오늘 날짜부터 정해 봐요.",
          "\"잘 지내?\" 한 줄이면 돼요. {name}도 그 한 줄을 한참 들여다볼지 몰라요.",
          "오래 묵혀 둔 사진 한 장, 오늘 {name}에게 보내 봐요. 그날 얘기가 줄줄이 나올 거예요.",
          "멀리 있어도 영상 통화 한 번이면 {name}의 얼굴을 볼 수 있어요.",
          "올해가 가기 전에 {name:을/를} 한 번 더 볼 날을 달력에 적어 둬요.",
          "누가 먼저 연락하느냐는 중요하지 않아요. 오늘은 {me:이/가} 먼저 해도 괜찮아요.",
          "다음 휴가 땐 {name}에게 잠깐이라도 들러 보는 건 어떨까요?",
        ],
        "elder.often": [
          "오늘 저녁엔 {name:와/과} 마주 앉아 밥을 천천히 먹어요.",
          "식사하시면서 {name}의 하루가 어떠셨는지 여쭤봐요. 생각보다 많이 기뻐하실 거예요.",
          "저녁 먹고 {name:와/과} 동네 한 바퀴 걸어요. 걸음은 느린 쪽에 맞추고요.",
          "늘 곁에 계셔서 못 한 \"고마워요\", 오늘은 해도 괜찮아요.",
          "오늘은 {name:와/과} 사진 한 장 찍어 둬요. 나중에 가장 아끼는 사진이 될지도 몰라요.",
          "{name:이/가} 좋아하시는 반찬 하나, 오늘은 {me:이/가} 해 드려 보는 건 어때요?",
          "{name}의 옛날이야기, 오늘은 중간에 끊지 말고 끝까지 들어 드려요.",
          "{name}께서는 같이 앉아 있는 것만으로도 좋으실 거예요. 차 한 잔이면 돼요.",
        ],
        "elder.sometimes": [
          "이번 주말엔 {name:을/를} 찾아뵈러 가요. 오래 머물지 않아도 반가워하실 거예요.",
          "{name}께서는 오늘도 {me} 전화를 조금은 기다리셨을지도 몰라요.",
          "오늘 {name}께 전화 한 통 드려요. 목소리만 들으셔도 한결 기운 나실 거예요.",
          "찾아뵐 날을 오늘 정해 두면, {name}께는 그날까지가 기다리는 즐거움이에요.",
          "요즘 찍은 사진 한 장 {name}께 보내 드려요. 화면을 몇 번이고 다시 켜 보실걸요.",
          "이번 달이 가기 전에 {name:와/과} 밥 한 끼 해요. 메뉴는 {name}께 맡기면 돼요.",
          "다음에 뵐 땐 {name:이/가} 좋아하시는 걸 하나 사 들고 가면 좋겠어요.",
          "\"보고 싶어요\" 한마디, {name}께 먼저 건네 봐요.",
        ],
        "elder.rarely": [
          "오늘은 {name}께 전화 한 통 드려요. 별말 없이 안부만 여쭤도 돼요.",
          "다음 명절까지 기다리지 않아도 돼요. 찾아뵐 날을 먼저 정해 봐요.",
          "짧은 안부 문자 한 줄도 {name}께는 하루 종일 기분 좋은 소식이에요.",
          "{name}께서는 휴대폰을 자꾸 들여다보셨을지도 몰라요. 오늘 영상 통화 한 번 걸어 드려요.",
          "올해가 가기 전에 {name:을/를} 한 번 더 찾아뵐 날을 달력에 적어 둬요.",
          "{name:와/과} 함께 찍은 옛 사진 한 장, 오늘 보내 드려요. 사진 속 이야기를 또 해 주실 거예요.",
          "바쁘다는 말은 잠시 내려놓고, 오늘은 {me:이/가} 먼저 연락드려도 괜찮아요.",
          "이번 휴가엔 {name}께 잠깐이라도 들러요. 그 반나절을 오래 기억하실 거예요.",
        ],
        "*": [
          "오늘은 {name}에게 먼저 연락해 봐요.",
          "오늘 저녁, {name:와/과} 밥 한 끼 해도 좋겠어요.",
          "{name}도 {me} 소식이 궁금할지 몰라요. 전화 한 통 걸어 봐요.",
        ],
      },
      past: {
        senior: [
          "{name:와/과} {me:이/가} 함께해 온 시간이 벌써 {pct}%예요. 그만큼 같이 웃은 날이 많았다는 뜻이죠.",
          "지나온 {pct}%의 날들이 지금의 {me:을/를} 만들었어요. {name}께서도 그걸 아실 거예요.",
          "함께한 날이 이렇게나 많았어요. 고맙다는 말은 아무리 늦어도 늦지 않아요.",
          "{pct}%의 날들을 함께 지나왔어요. 그동안 못 한 말이 있다면, 이제는 해도 괜찮아요.",
          "오래 함께해 온 만큼, {name}께서는 {me} 얼굴만 봐도 다 아실 거예요.",
        ],
        start: [
          "{name:와/과} {me}의 이야기는 이제 {pct}%가 지났어요. 아직 나누지 않은 이야기가 훨씬 많아요.",
          "함께할 시간의 {pct}%만 지났어요. 지금의 어색함도 나중엔 웃으며 꺼낼 이야기가 되겠죠.",
          "{name:와/과}의 날들은 이제 막 첫 장을 넘겼어요. 다음 장엔 뭐가 적힐지 아무도 몰라요.",
          "아직 {pct}%. {name:와/과} 쌓아 갈 추억이 거의 다 앞에 있어요.",
          "둘의 시간은 이제 시작이에요. 처음 만난 날을 {name}도 기억하고 있을 거예요.",
          "{name:와/과} 함께할 날의 대부분이 아직 앞에 있어요. 서두르지 않아도 돼요.",
        ],
        early: [
          "{name:와/과} {me:이/가} 함께할 시간은 {pct}%가 지났어요. 아직 많지만, 생각보다 빨리 흘러가요.",
          "지금까지 {pct}%. 앞날이 더 길어 보여도 달력은 생각보다 빨리 넘어가요.",
          "{name:와/과}의 시간은 아직 초반이에요. 아무렇지 않게 보낸 오늘이 나중에 자주 생각날 거예요.",
          "{pct}%가 지났어요. 남은 날이 훨씬 많을 때, 더 자주 봐 두면 좋겠어요.",
          "{name:와/과} 함께한 날보다 함께할 날이 아직 많아요. 그래도 다음 약속은 미루지 말아요.",
          "벌써 {pct}%. 시간이 넉넉해 보일 때가 제일 빨리 지나가더라고요.",
        ],
        middle: [
          "{name:와/과} {me:이/가} 함께할 시간, 벌써 {pct}%를 지나왔어요. 남은 날은 걸음을 조금 늦춰도 돼요.",
          "어느새 {pct}%, 절반쯤 왔어요. 처음 만났을 때 이야기를 {name}에게 꺼내 봐도 좋겠어요.",
          "{pct}%를 함께 지나왔어요. 이제부터는 만날 때마다 그날 입은 옷까지 기억날 거예요.",
          "{name:와/과}의 시간은 {pct}%, 딱 절반쯤이에요. 남은 만남엔 뭘 같이 할지 하나만 떠올려 봐요.",
          "벌써 {pct}%가 지났어요. 다음 만남은 평소보다 한 시간만 더 있다 와도 좋겠네요.",
          "함께할 시간의 {pct}%가 흘렀어요. {name}도 아마 그만큼 {me:을/를} 알아 왔을 거예요.",
        ],
        late: [
          "{name:와/과} {me:이/가} 함께할 시간 중 {pct}%가 벌써 지나갔어요. 그래서 다음 만남이 예전보다 커 보여요.",
          "{pct}%를 이미 지나왔어요. 이제는 헤어질 때 손을 한 번 더 흔들게 될지도 몰라요.",
          "함께할 시간의 {pct}%가 지나갔어요. 그래서 \"또 보자\"는 말을 조금 더 진심으로 하게 돼요.",
          "벌써 {pct}%. 그걸 알고 나면, 오늘이 조금 달라 보일 거예요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 보고 싶을 때 보러 가는 것, 그거면 돼요.",
          "지나온 {pct}%의 날들 속에 {name}의 웃음이 많았죠. 남은 날에도 그 웃음이 있을 거예요.",
        ],
        last: [
          "{name:와/과} {me:이/가} 함께할 시간도 {pct}%가 갔어요. 남은 만남은 하나하나 이름을 붙일 수 있을 만큼이에요.",
          "함께할 시간의 {pct}%가 이미 흘렀어요. 이제는 만남 하나하나가 지나온 날들보다 오래 남아요.",
          "벌써 {pct}%가 지났어요. 다음 만남을 '언젠가'로 두지 않으면 돼요.",
          "{pct}%. 지나온 날에 비하면 남은 만남은 적어요. 그래서 하나하나가 더 또렷해요.",
          "지나온 날이 {pct}%예요. {name}도 아마 {me:와/과}의 다음 만남을 기다리고 있을 거예요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 오늘 같은 평범한 하루가 나중엔 제일 많이 생각날 거예요.",
        ],
        "elder.late": [
          "{name:와/과} {me:이/가} 함께한 {pct}% 동안은 {name}께서 기다려 주신 날이 더 많았죠.",
          "{pct}%를 이미 지나왔어요. {name}께 받은 만큼, 남은 날엔 조금씩 돌려 드리면 돼요.",
          "벌써 {pct}%. 다음에 찾아뵐 땐 조금 더 오래 있다 와요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. {name}께서는 아마 다음에 올 날을 손꼽고 계실 거예요.",
          "지나온 {pct}% 동안 {name}께서 {me:을/를} 지켜봐 주셨어요. 이제는 {me:이/가} 먼저 찾아갈 차례예요.",
        ],
        "elder.last": [
          "{name:와/과} {me:이/가} 지나온 시간이 {pct}%예요. 아껴 둔 말은 다음 만남에 꺼내 봐요.",
          "{name:와/과} 보낸 시간의 {pct}%가 이미 흘렀어요. 다음에 찾아뵐 날은 오늘 달력에 적어 둬요.",
          "벌써 {pct}%가 지났어요. {name}께서는 {me} 목소리만 들어도 다 괜찮다고 하실 거예요.",
          "{pct}%를 함께 지나왔어요. 다음에 뵐 땐 현관에서 조금 더 오래 인사하고 나와도 좋겠어요.",
          "매일이던 만남이 어느새 이만큼 줄었어요. {pct}%를 지나온 지금도, {name}께서는 여전히 {me} 편이세요.",
        ],
        "partner.start": [
          "{name:와/과} {me}의 이야기는 이제 막 시작됐어요. 요즘 주고받는 문자도 나중엔 다시 읽고 싶어질 거예요.",
          "둘의 시간은 아직 {pct}%. 앞으로 함께 채워 갈 날들이 훨씬 많아요.",
          "이제 겨우 시작이에요. {name:와/과} 다음 주말엔 뭘 할지부터 기대되네요.",
          "{name:와/과} 함께한 날은 아직 {pct}%. {name}도 오늘 {me} 생각을 몇 번은 했을 거예요.",
          "뭐든 처음이라 다 새로운 때예요. 오늘 나눈 시시한 대화도 다 기억해 두고 싶을 만큼요.",
        ],
        "partner.early": [
          "{name:와/과} {me}의 시간은 아직 {pct}%를 지났을 뿐이에요. 같이 가 볼 곳이 아직 많아요.",
          "둘의 이야기는 아직 초반이에요. 서로 \"오늘 어땠어?\" 묻는 저녁이 쌓여 가면 돼요.",
          "{pct}%를 함께 지나왔어요. 요즘은 말없이 있어도 편한 사이가 됐죠.",
          "{name:와/과} 쌓아 갈 날이 아직 많아요. 그래도 오늘 하고 싶은 말은 오늘 해요.",
          "지금의 평범한 하루들이 나중엔 둘이 가장 자주 꺼내는 이야기가 될 거예요.",
        ],
      },
      met: {
        "*": [
          "잘 다녀왔어요. 오늘로 올해 {n}번째 만남이에요.",
          "오늘의 만남, 잘 적어 둘게요. 올해 {n}번째예요.",
          "{name:와/과} 함께한 오늘이 하나 더 쌓였어요. 올해 {n}번째예요.",
          "오늘 나눈 이야기, 집에 가는 길에 또 생각날 거예요. 올해 {n}번째예요.",
          "오늘 같은 날은 나중에 자주 꺼내 보게 돼요. 올해 {n}번째예요.",
          "한 번 더 얼굴을 봤네요. 올해 {n}번째예요.",
          "{name}에게도 오늘은 좋은 하루였을 거예요. 올해 {n}번째예요.",
          "오늘 만남도 여기에 남겨 둘게요. 올해 {n}번째예요.",
        ],
        elder: [
          "찾아뵙길 잘했어요. 올해 {n}번째 만남이에요.",
          "{name}께선 오늘 하루를 저녁 내내 떠올리시겠죠. 올해 {n}번째예요.",
          "돌아서는 {me:을/를} {name}께서는 한참 바라보셨을 거예요. 올해 {n}번째예요.",
          "{name:와/과}의 올해 {n}번째 만남이에요. 다음에도 반갑게 맞아 주실 테고요.",
        ],
      },
    },
    en: {
      moment: {
        rarely: [
          "{title}: {count} more times. It comes back every year, so it feels endless — until you count it.",
          "{title} comes once a year. With {count} left, this year's one is a precious one.",
          "{count} more times. The season will return, but this year won't.",
        ],
        often: [
          "{title}: {count} more times. It feels ordinary because it's daily, but it isn't endless.",
          "{count} sounds like a lot. Still, today's one only happens today.",
        ],
        "*": [
          "{title}: {count} more times. Smaller than it felt, isn't it?",
          "You can enjoy {title} {count} more times. Each one is a different day.",
        ],
      },
      momentToday: {
        rarely: ["Put this year's {title} on the calendar now.", "Ask someone to come along this time."],
        often: ["Today, put the phone away and just be there for it."],
        "*": ["Make the next one count a little more."],
      },
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
      moment: {
        rarely: [
          "{title}, 앞으로 {count}번이에요. 1년에 한 번씩 와요.",
          "{title:은/는} {count}번. 해마다 한 칸씩 지나가요.",
          "{me:이/가} {title:을/를} 맞을 날은 {count}번이에요. 올해 것도 그중 하나고요.",
          "1년에 한 번, {title}. 그렇게 {count}번을 더 맞아요.",
          "{count}번의 {title}. 날씨도, 옆에 있는 사람도 해마다 조금씩 다를 거예요.",
        ],
        sometimes: [
          "한 달에 한두 번 하는 {title}, 앞으로 {count}번이에요.",
          "{title:은/는} {count}번. 달력 한 장에 한두 칸이에요.",
          "{me:이/가} {title:을/를} 할 수 있는 날은 {count}번이에요.",
          "{count}번의 {title}. 건너뛴 달도 그 안에 들어 있어요.",
        ],
        often: [
          "{title}, 앞으로 {count}번이에요. 오늘 것도 그중 하나예요.",
          "매일 하는 {title}. 세어 보니 {count}번이에요.",
          "{title:은/는} {count}번. 하루에 하나씩 넘어가요.",
          "{count}번의 {title}. 대부분은 별일 없는 날에 있을 거예요.",
        ],
        "*": [
          "{title}, 앞으로 {count}번이에요.",
          "{title:은/는} 지금처럼 하면 {count}번이에요.",
          "{count}번. {me:이/가} {title:을/를} 할 수 있는 횟수예요.",
        ],
      },
      momentToday: {
        rarely: [
          "올해 {title} 날짜부터 달력에 동그라미 쳐요.",
          "이번엔 누구와 갈지부터 정해요.",
          "이번 {title:은/는} 끝까지 있다 와요.",
        ],
        sometimes: [
          "이번 달 {title} 날을 하루 비워 둬요.",
          "미뤄 둔 한 번이 있다면 이번 주말에 해요.",
          "다음 한 번은 서두르지 않아도 돼요.",
        ],
        often: [
          "오늘 {title:은/는} 휴대폰 없이 해 봐요.",
          "오늘 것 하나면 충분해요.",
          "오늘은 {title}에 10분만 더 써요.",
        ],
        "*": ["다음 한 번은 날짜만 먼저 잡아요.", "이번 한 번을 미루지 않으면 돼요."],
      },
      cheer: {
        "*": [
          "{name}께서는 {country} 평균수명을 넘기셨어요. 오래 몸을 돌봐 오신 덕이에요.",
          "{country} 평균수명보다 오래 계세요. {name}께서 지켜 오신 하루들이에요.",
          "{name}께서는 {country} 평균보다 오래 지내 오셨어요. 고마운 일이에요.",
          "{country} 평균수명을 지나셨어요. 오늘도 {name}께 전화를 걸 수 있어요.",
          "{country} 평균수명을 넘긴 지금도, {name}께서는 그 자리에 계세요.",
        ],
      },
      then: {
        parent: [
          "어릴 땐 {name:와/과} 매일 아침 같은 식탁에 앉았어요.",
          "학교에서 돌아오면 {name:이/가} 집에 계셨죠.",
          "한동안은 {name}의 목소리가 하루의 시작이었어요.",
          "{name:와/과} 한집에 살던 때가 있었어요. 저녁마다 얼굴을 봤죠.",
          "그땐 {name:이/가} 차려 주신 밥을 매일 먹었어요.",
          "늦게 오는 날엔 {name:이/가} 현관 불을 켜 두셨어요.",
          "주말이면 {name:와/과} 한 방에서 텔레비전을 봤죠.",
          "아침마다 {name:이/가} 깨우는 소리에 일어났어요.",
          "{name}의 발소리를 매일 듣던 시절이 있었어요.",
          "한 지붕 아래서 {name:와/과} 하루에도 몇 번씩 마주쳤어요.",
        ],
      },
      now: {
        senior: [
          "{name:와/과} 만날 날은 {count}번이에요. 한 번에 한 끼씩, 천천히요.",
          "앞으로 {count}번이에요. 그날마다 {name}께서 차를 한 잔 내오시겠죠.",
          "{count}번이에요. {name}께서 들려주실 이야기가 아직 많아요.",
          "{name}께 갈 날은 {count}번이에요. 가는 길에 과일이라도 한 봉지 사 가요.",
          "{name:을/를} 뵐 날, {count}번이에요. 한 번 한 번 오래 앉아 있다 와요.",
        ],
        "senior.after": [
          "지금은 {me:이/가} {name}께 찾아가는 쪽이에요. 앞으로 {count}번이에요.",
          "이제는 한 번 뵈면 그 시절 하루보다 오래 남아요. {count}번이에요.",
          "{count}번 찾아가는 날마다 그때 이야기를 조금씩 꺼내요.",
          "이제는 {name:와/과} 같은 식탁에 앉는 날이 {count}번이에요.",
          "지금은 그때와 반대예요. {me:이/가} 현관문을 열고 {name}께서 맞아 주시죠.",
        ],
        "after.*": [
          "지금은 {count}번이에요. 그때처럼 매일 보면 {span:이/가} 채 안 돼요.",
          "이제 남은 만남은 {count}번이에요. 이어 붙이면 {span} 안쪽이에요.",
          "날마다 만나면 {count}번은 {span} 안에 끝나요.",
          "그 시절처럼 하루하루로 바꾸면 {count}번은 {span}도 안 돼요.",
          "{count}번이에요. 하루씩 세어 봐도 {span:을/를} 넘지 않아요.",
          "지금은 그때와 달라요. {count}번, 날로 치면 {span}에 못 미쳐요.",
          "이제는 {name}께 가는 날이 {count}번이에요. 이어 보면 {span}도 못 채워요.",
          "그때처럼 매일 만나면 {count}번은 {span:이/가} 가기 전에 끝나요.",
          "이제 {name:와/과} 한 식탁에 앉을 날은 {count}번. {span:이/가} 안 되는 날들이에요.",
        ],
        "after.week": [
          "{count}번이면 한 주 안에 다 지나가요.",
          "지금은 {count}번. 한 손으로 셀 수 있어요.",
          "이제 {count}번이에요. 헤어질 때마다 다음 날짜를 말씀드려요.",
        ],
        "after.month": [
          "{count}번이면 달력 한 장 안에 들어가요.",
          "지금은 {count}번. 그때처럼 매일 보면 한 달이 안 걸려요.",
          "이제 {count}번이에요. 하나씩 날짜를 붙여 볼 수 있는 숫자예요.",
        ],
        "*": [
          "{name:와/과} 앞으로 만날 날은 {count}번이에요. 매일로 치면 {span:이/가} 채 안 돼요.",
          "{name:와/과} 남은 만남은 {count}번. 하루씩 세면 {span}에 못 미쳐요.",
          "{name:을/를} 만날 날은 {count}번이에요. 이어 붙이면 {span} 안쪽이에요.",
          "{count}번. {name:와/과} 앞으로 만나는 횟수예요. 날로 세면 {span}도 안 돼요.",
          "{name:와/과} 마주 앉을 날이 {count}번 있어요. 매일 본다면 {span} 안에 끝나요.",
          "지금처럼 만나면 {name:을/를} {count}번 더 봐요. {span:을/를} 넘지 않는 날수예요.",
          "{name:와/과} 헤어지며 손 흔들 날이 {count}번이에요. 다 합치면 {span} 안쪽이고요.",
          "{name:와/과}의 만남은 {count}번이에요. 하루씩 이으면 {span}도 못 채워요.",
          "{name}도 가끔 {me} 안부를 궁금해할 거예요. 만날 날은 {count}번이에요.",
          "{name:와/과} 앞으로 {count}번이에요. 매일 만나면 {span:이/가} 가기 전에 다 만나요.",
        ],
        week: [
          "{name:와/과} 만날 날은 {count}번이에요. 한 주 안에 들어가는 숫자예요.",
          "{count}번. {name:와/과} 앞으로 만날 횟수예요.",
          "{name:와/과} {count}번이에요. 만날 때마다 다음 날짜를 같이 정해요.",
        ],
        month: [
          "{name:와/과} 만날 날은 {count}번이에요. 달력 한 장이면 다 들어가요.",
          "{count}번. {name:와/과}의 만남이에요. 매일 보면 한 달이 안 걸려요.",
          "{name:와/과}의 만남은 {count}번이에요. 손으로 꼽아 볼 수 있어요.",
        ],
        more: [
          "{name:와/과} 만날 날은 {count}번이에요. 많아 보여도 날수로는 {span:이/가} 채 안 돼요.",
          "{count}번을 하루도 거르지 않고 이으면 {span} 안에 들어가요.",
          "{name:와/과}의 만남은 {count}번. 오늘이 그 숫자가 가장 큰 날이에요.",
        ],
      },
      today: {
        senior: [
          "이번 주에 {name}께 전화 한 통 드려요. 길지 않아도 돼요.",
          "다음에 뵐 날을 오늘 정해서 말씀드려요.",
          "다음에 갈 땐 {name}께서 좋아하시는 과일을 사 가요.",
          "{name}께 옛날 얘기를 하나 여쭤봐요. 처음 듣는 얘기일 수도 있어요.",
          "다음 만남엔 {name:와/과} 사진 한 장 찍어 둬요.",
          "{name}의 손을 한 번 잡아 드려요. 말은 없어도 돼요.",
          "영상 통화 한 번 걸어 드려요. 얼굴 보는 데 5분이면 돼요.",
          "다음에 뵐 땐 조금 일찍 가서 조금 늦게 나와요.",
        ],
        often: [
          "이번 주 {name:와/과} 같이 먹을 저녁을 하루 정해요.",
          "오늘은 {name}의 이야기를 끝까지 들어요.",
          "저녁 먹고 {name:와/과} 잠깐 걸어요.",
          "오늘 {name}에게 \"고마워\" 한마디 해요.",
          "오늘은 휴대폰을 내려놓고 {name:와/과} 차 한 잔 해요.",
          "{name}에게 오늘 하루를 물어봐요. 짧게라도요.",
          "주말에 {name:와/과} 뭘 할지 하나만 골라요.",
          "오늘 {name:와/과} 사진 한 장 남겨 둬요.",
        ],
        sometimes: [
          "다음 만남 날짜를 오늘 잡아요.",
          "이번 달 {name:와/과} 만날 날을 달력에 적어요.",
          "오늘 {name}에게 짧게 안부를 보내요.",
          "다음에 만나면 갈 곳을 하나 찾아 놔요.",
          "{name}에게 요즘 찍은 사진 한 장 보내요.",
          "이번 주말이 비어 있다면 {name:을/를} 보러 가요.",
          "다음엔 {name:이/가} 좋아하는 걸 하나 챙겨 가요.",
          "{name}도 {me} 연락을 기다릴 수 있어요. 오늘은 먼저 해요.",
        ],
        rarely: [
          "다음 만남은 헤어질 때 바로 잡아 두면 덜 미루게 돼요.",
          "올해 {name:와/과} 만날 날을 하나 골라 달력에 적어요.",
          "오늘 {name}에게 전화 한 통 해요. 5분이면 돼요.",
          "\"잘 지내?\" 한 줄이면 돼요. 오늘 {name}에게 보내요.",
          "다음 휴가 일정에 {name:을/를} 보러 가는 하루를 넣어요.",
          "영상 통화로 {name}의 얼굴을 한 번 봐요.",
          "오래된 사진 한 장 {name}에게 보내요. 답이 늦어도 괜찮아요.",
          "누가 먼저인지는 상관없어요. 오늘은 {me:이/가} 먼저 해요.",
        ],
        "elder.often": [
          "이번 주 저녁 하루는 {name:와/과} 같이 먹어요.",
          "오늘은 {name}께 하루가 어떠셨는지 여쭤봐요.",
          "저녁 먹고 {name:와/과} 천천히 걸어요. 걸음은 {name}께 맞추고요.",
          "오늘 {name}께 \"고마워요\" 한마디 해 드려요.",
          "{name}의 옛날이야기를 오늘은 끝까지 들어 드려요.",
          "{name}께서 좋아하시는 반찬을 하나 해 드려요.",
          "오늘은 {name:와/과} 차 한 잔 놓고 조용히 앉아 있어도 돼요.",
          "{name:와/과} 사진 한 장 찍어 둬요. 오늘 날짜로요.",
        ],
        "elder.sometimes": [
          "다음에 찾아뵐 날짜를 달력에 먼저 동그라미 쳐요.",
          "이번 달 {name}께 찾아뵐 날을 달력에 적어 둬요.",
          "오늘 {name}께 짧게 안부를 여쭤요.",
          "이번 주말이 비어 있다면 {name:을/를} 뵈러 가요.",
          "요즘 찍은 사진 한 장 {name}께 보내 드려요.",
          "다음에 뵐 땐 {name}께서 좋아하시는 걸 하나 사 가요.",
          "{name}께 전화 드려요. 용건이 없어도 괜찮아요.",
          "이번 달이 가기 전에 {name:와/과} 밥 한 끼 해요.",
        ],
        "elder.rarely": [
          "다음에 찾아뵐 날은 헤어질 때 바로 말씀드려 둬요.",
          "올해 {name:을/를} 찾아뵐 날을 몇 개 미리 골라 둬요.",
          "오늘 {name}께 전화 한 통 드려요. 안부만 여쭤도 돼요.",
          "명절 전에 한 번 더 찾아뵐 날을 잡아요.",
          "영상 통화로 {name}께 얼굴을 보여 드려요.",
          "옛 사진 한 장 {name}께 보내 드려요.",
          "다음 휴가에 {name}께 들르는 하루를 넣어 둬요.",
          "오늘은 {me:이/가} 먼저 연락드려요.",
        ],
        "*": [
          "오늘 {name}에게 연락 한 번 해요.",
          "{name:와/과} 만날 날을 하나 잡아요.",
          "{name}에게 짧게 안부를 보내요.",
        ],
      },
      past: {
        senior: [
          "{name:와/과} 함께해 온 날이 {pct}%예요. 그 안에 {me}의 어린 시절이 다 있어요.",
          "{pct}%를 함께 지나왔어요. {name}께서는 그 날들을 대부분 기억하실 거예요.",
          "지나온 {pct}%의 날들 덕분에, 말이 없어도 편한 사이예요.",
          "{pct}%. {name:와/과} 함께 지나온 몫이에요. 하고 싶은 말은 다음에 해요.",
          "오래 함께했어요. {pct}%만큼의 날들이 {name:와/과} {me} 사이에 있어요.",
        ],
        start: [
          "{name:와/과}의 시간은 {pct}%를 지났어요. 대부분은 아직 앞에 있어요.",
          "아직 {pct}%예요. 처음 만난 날이 아직 가까워요.",
          "이제 시작이에요. {name:와/과} 만날 날을 하나씩 정해 가면 돼요.",
          "{pct}%. {name:와/과} 지나온 몫은 아직 작아요.",
          "함께할 날 대부분이 앞에 있어요. 서두를 일은 없어요.",
          "{name:와/과} 함께한 지 {pct}%째예요. 아직 처음 무렵이에요.",
        ],
        early: [
          "{name:와/과} 지나온 쪽은 {pct}%예요. 남은 쪽이 더 커요.",
          "지금까지 {pct}%예요. 생각보다 빨리 지나가는 때예요.",
          "{pct}%를 지났어요. 다음 약속은 이번에 만날 때 잡아요.",
          "아직 초반이에요. {name:와/과} 지나온 몫은 {pct}%예요.",
          "{pct}%. 서로 익숙해지는 때예요. 익숙해도 연락은 먼저 해요.",
          "{name:와/과} 함께한 날보다 함께할 날이 많아요. 지금은 {pct}%예요.",
        ],
        middle: [
          "{name:와/과}의 시간 중 {pct}%를 지나왔어요. 절반쯤이에요.",
          "{pct}%. 지나온 몫과 남은 몫이 비슷해요.",
          "어느새 {pct}%예요. 처음 만난 날을 한 번 떠올려 봐요.",
          "함께한 시간이 {pct}%예요. 다음 만남엔 같이 할 일을 하나 챙겨 가요.",
          "절반쯤 왔어요. {name:와/과} 지나온 날이 {pct}%예요.",
          "{pct}%가 지났어요. 다음 만남은 조금 더 오래 있다 와도 돼요.",
        ],
        late: [
          "{pct}%를 지나왔어요. 만남 하나하나가 예전보다 또렷해요.",
          "함께한 날이 {pct}%예요. {name:와/과} 나눈 이야기가 그만큼 쌓였어요.",
          "{pct}%. 남은 만남은 미루지 않는 쪽이 좋아요.",
          "{name:와/과} 지나온 날이 {pct}%예요. 헤어질 때 인사를 조금 길게 해요.",
          "{pct}%를 함께 왔어요. 그동안 {name}의 웃는 얼굴을 많이 봤죠.",
          "벌써 {pct}%예요. 다음 약속은 헤어지기 전에 잡아요.",
        ],
        last: [
          "{pct}%. {name:와/과} 함께 지나온 몫이에요. 남은 만남은 하나씩 셀 수 있어요.",
          "{name:와/과} 보낸 시간이 {pct}%예요. 하고 싶은 말은 다음 만남에 꺼내요.",
          "{pct}%가 지났어요. 다음 만남 날짜부터 달력에 적어요.",
          "지나온 날이 {pct}%예요. 그 날들 속에 {name}의 목소리가 많아요.",
          "{pct}%를 함께했어요. 평범한 하루를 같이 보내는 것으로 충분해요.",
          "{name:와/과} {pct}%를 지나왔어요. 남은 날도 지금처럼 만나면 돼요.",
        ],
        "elder.late": [
          "{name:와/과} 함께한 {pct}% 동안 {name}께서 {me:을/를} 더 많이 기다리셨어요.",
          "{pct}%를 지나왔어요. 다음에 뵐 땐 차 한 잔 더 마시고 와요.",
          "{name:와/과}의 시간 중 {pct}%가 지났어요. 찾아뵐 날은 미리 잡아 둬요.",
          "지나온 {pct}% 동안 받은 것이 많아요. 다음에 뵐 땐 {me:이/가} 밥을 사요.",
          "{pct}%. {name}께서는 그 날들을 하나하나 기억하고 계실 거예요.",
        ],
        "elder.last": [
          "{name:와/과} 지나온 시간이 {pct}%예요. 다음에 찾아뵐 날은 전화로 먼저 여쭤요.",
          "{pct}%를 함께 지나왔어요. 하고 싶은 말이 있다면 다음에 뵐 때 해요.",
          "{pct}%가 지났어요. {name}께서는 {me} 목소리만 들어도 안심하실 거예요.",
          "{name:와/과}의 시간 중 {pct}%를 지나왔어요. 다음 방문은 조금 길게 잡아요.",
          "지나온 날이 {pct}%예요. 그 시간 내내 {name}께서 {me:을/를} 지켜보셨어요.",
        ],
        "partner.start": [
          "{name:와/과}의 시간은 아직 {pct}%예요. 서로 알아 가는 중이에요.",
          "이제 막 시작했어요. 요즘 주고받는 말들은 나중에 다시 떠오를 거예요.",
          "아직 {pct}%. {name:와/과} 같이 가 볼 곳이 많아요.",
          "시작한 지 얼마 안 됐어요. {name}의 하루를 묻는 데서부터면 돼요.",
          "{name:와/과} 함께할 날 대부분이 앞에 있어요. 오늘은 {pct}% 지점이에요.",
        ],
        "partner.early": [
          "{name:와/과}의 시간은 {pct}%를 지났어요. 아직 초반이에요.",
          "{pct}%를 함께 지나왔어요. 말없이 있어도 편해지는 때예요.",
          "둘의 시간은 이제 {pct}%예요. 오늘 할 말은 오늘 해요.",
          "아직 앞이 길어요. {name:와/과} 저녁마다 짧게라도 이야기를 나눠요.",
          "{name:와/과} 함께한 날은 {pct}%예요. 같이 하는 일이 하나 있으면 좋아요.",
        ],
      },
      met: {
        "*": [
          "적어 두었어요. 올해 {n}번째 만남이에요.",
          "오늘 만남을 남겼어요. 올해 {n}번째예요.",
          "올해 {n}번째 만남으로 기록했어요.",
          "{name:와/과} 만난 오늘을 적어요. 올해 {n}번째예요.",
          "잘 다녀왔네요. 올해 {n}번째예요.",
          "오늘도 얼굴을 봤어요. 올해 {n}번째 만남이에요.",
          "기록했어요. {name:와/과}의 올해 {n}번째 만남이에요.",
          "오늘 한 번이 더해졌어요. 올해 {n}번째예요.",
        ],
        elder: [
          "찾아뵌 날을 적어 두었어요. 올해 {n}번째예요.",
          "{name}께서도 오늘을 기억하실 거예요. 올해 {n}번째 만남이에요.",
          "{name:와/과}의 올해 {n}번째 만남이에요. 다음 날짜도 잡았나요?",
          "오늘 뵙고 왔어요. 올해 {n}번째예요.",
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
      moment: {
        rarely: [
          "해마다 돌아오는 {title}. 아직 {count}번을 더 맞을 수 있어요.",
          "{title}, 앞으로도 {count}번이나 와요. 1년마다 기다릴 거리가 하나 있는 셈이죠.",
          "{me:은/는} {title:을/를} {count}번 더 맞아요. 매번 옆자리 얼굴이 조금씩 다르겠죠.",
          "{title:은/는} 앞으로 {count}번. 이맘때가 오면 또 설렐 거예요.",
          "{count}번의 {title}. 해마다 사진첩에 한 장씩 늘어 갈 거예요.",
          "{title:은/는} 아직 {count}번 남아 있어요. 1년 내내 기다릴 만한 날이죠.",
        ],
        sometimes: [
          "{title}, 앞으로 {count}번 더 할 수 있어요. 기다리는 맛이 있는 숫자예요.",
          "{count}번의 {title}. 다음 한 번은 누구와 함께일지 벌써 궁금해요.",
          "{me:은/는} {title:을/를} {count}번 더 해요. 달력에 반가운 칸이 그만큼 있어요.",
          "{title:은/는} 아직 {count}번. 바쁜 달에도 하나쯤은 끼워 넣을 수 있어요.",
        ],
        often: [
          "{title}, 앞으로 {count}번. 오늘 것도 기분 좋게 시작하면 돼요.",
          "늘 하는 {title}도 {count}번이나 있어요. 평범한 날마다 작은 즐거움이 하나씩이에요.",
          "{count}번의 {title}. 매일 조금씩 다른 하루가 거기에 담길 거예요.",
          "{title:은/는} {count}번. 내일 아침이 은근히 기다려지는 숫자예요.",
        ],
        "*": [
          "{title}, 아직 {count}번이 기다리고 있어요. 다음 한 번이 벌써 기다려져요.",
          "{me:은/는} {title:을/를} {count}번 더 누려요. 그때마다 누구랑일지 궁금해요.",
        ],
      },
      momentToday: {
        rarely: [
          "올해 {title}엔 같이 갈 사람에게 미리 말해 둬요.",
          "이번 {title}엔 맛있는 것 하나 챙겨 가요.",
          "올해 {title:은/는} 날짜부터 콕 찍어 달력에 그려 둬요.",
        ],
        sometimes: [
          "이번 달 {title:은/는} 좋아하는 사람이랑 같이 해요.",
          "다음 {title} 날짜를 정해 두면 그 주가 내내 기다려져요.",
          "이번 한 번은 끝나고 사진 한 장 남겨요.",
        ],
        often: [
          "오늘 {title:은/는} 좋아하는 노래 하나 틀어 놓고 해요.",
          "오늘의 {title}, 평소보다 조금 더 즐겁게 해 봐요.",
          "오늘 {title:은/는} 누군가와 같이 해도 좋겠어요.",
        ],
        "*": ["다음 {title:은/는} 좋아하는 사람과 같이 해요.", "이번 한 번도 실컷 즐기면 돼요."],
      },
      cheer: {
        "*": [
          "{name}께서는 {country} 평균수명보다 오래 곁에 계세요. 그 덕에 오늘도 웃을 일이 있어요.",
          "{country} 평균수명을 넘기셨어요. {name}께 박수 한 번 쳐 드리고 싶은 날이에요.",
          "{name}께서는 {country} 평균보다 오래 건강히 지내 오셨어요. 참 반가운 숫자예요.",
          "{country} 평균수명을 넘기신 {name}. 오늘도 목소리를 들을 수 있어서 기뻐요.",
          "{country} 평균을 훌쩍 넘기셨네요. {name}께서 아껴 오신 날들이 이렇게 쌓였어요.",
        ],
      },
      then: {
        parent: [
          "어릴 땐 {name:이/가} 부르는 소리에 하루가 시작됐죠.",
          "학교 끝나고 현관문을 열면 {name:이/가} \"왔니\" 하고 반겨 주셨죠.",
          "{name:이/가} 끓여 주신 찌개 냄새로 저녁이 오던 때가 있었어요.",
          "{name:와/과} 한 상에 둘러앉아 시시한 얘기로 웃던 날들이 있었죠.",
          "주말 아침이면 {name} 옆에서 늦잠을 자던 시절이 있었어요.",
          "생일마다 {name:이/가} 미역국을 끓여 주시던 날들이 있었죠.",
          "{name} 손을 잡고 시장에 따라가던 때가 있었어요.",
          "비 오는 날이면 {name:이/가} 우산을 들고 교문 앞에 서 계셨죠.",
          "저녁마다 {name:와/과} 텔레비전 앞에 나란히 앉아 웃던 때가 있었죠.",
          "{name:이/가} 깎아 주신 사과를 하나씩 받아먹던 저녁들이 있었어요.",
        ],
      },
      now: {
        senior: [
          "{name:와/과} 마주 앉을 날이 아직 {count}번 있어요. 그날마다 {name}께서 반찬부터 꺼내 두실 거예요.",
          "앞으로 {count}번, {name}께서 \"왔구나\" 하고 반겨 주실 날이에요.",
          "{name}께서 {me:을/를} 기다리실 날이 {count}번 있어요. 그 기다림 끝엔 늘 웃음이 있죠.",
          "아직 {count}번이에요. 그때마다 {name}께서 들려주실 이야기가 쌓여 있어요.",
          "{name}께서 현관문을 활짝 여실 날이 {count}번이에요. 생각만 해도 반가워요.",
          "{count}번의 만남마다 {name}께서는 {me} 얼굴을 보자마자 웃으실 거예요.",
        ],
        "senior.after": [
          "이제는 {name}께서 {me:을/를} 기다리시는 쪽이에요. 반가운 날이 아직 {count}번 있어요.",
          "지금은 그 시절 이야기를 꺼내며 같이 웃을 날이 {count}번 있어요.",
          "이제는 {me:이/가} 찾아가는 날이 {count}번이에요. 그날마다 그때처럼 반겨 주시겠죠.",
          "지금도 {name:와/과} 한 상에 앉을 날이 {count}번이나 있어요.",
          "아직 {count}번, {name}께서 그때처럼 웃어 주실 날이 있어요.",
        ],
        "after.*": [
          "{count}번을 날로 세면 {span} 안쪽이에요. 그날마다 {name}께서 반겨 주시죠.",
          "지금도 {count}번이 남아 있어요. 이어 붙이면 {span} 안쪽이라도 넉넉한 날들이에요.",
          "지금은 {count}번이에요. 날짜로는 {span:이/가} 채 안 돼도 하루하루 다 반가운 날이에요.",
          "아직 {count}번이 있어요. 하루씩 세면 {span} 안에 드는 날들인데 한 번 한 번이 다 반가워요.",
          "지금은 {count}번의 만남이 기다리고 있어요. 다 이어도 {span:이/가} 안 되는데 그날마다 할 얘기는 꼭 있어요.",
          "그때만큼 자주는 아니어도 {count}번이나 더 마주 앉을 수 있어요.",
          "지금도 {name}께서는 {me} 오는 날을 기다리시죠. 그런 날이 {count}번 있어요.",
          "매일은 아니어도 {count}번을 더 만나요. 모아 봐야 {span} 안쪽이지만 저녁으로는 꽤 많아요.",
          "앞으로 {count}번은 {me:이/가} 먼저 현관문을 열고 들어갈 차례예요.",
          "지금은 {me:이/가} {name}께 밥을 차려 드릴 날도 있겠죠. 그런 날이 {count}번이에요.",
        ],
        "after.week": [
          "이제는 {count}번이에요. 한 번 한 번이 명절처럼 기다려지는 날이죠.",
          "지금은 {count}번. 그날마다 {name}께서 좋아하시는 걸 하나씩 챙겨 가면 돼요.",
          "아직 {count}번이 있어요. 기다려지는 날이 그만큼이에요.",
        ],
        "after.month": [
          "이제는 {count}번이에요. 달력에 그날마다 동그라미를 쳐 둘 수 있을 만큼이죠.",
          "그래도 아직 {count}번, {name}께서 반겨 주실 날이 있어요.",
          "지금은 {count}번. 하나씩 꼽아 보면 그날마다 할 얘기가 떠올라요.",
        ],
        "*": [
          "{name:와/과} 마주 앉을 날이 아직 {count}번 있어요. 날로 세면 {span} 안쪽이어도 할 얘기는 넉넉해요.",
          "{name:와/과} 만날 날은 {count}번. 하루씩 이어 봐야 {span} 안쪽인데 웃을 일은 가득해요.",
          "{count}번이나 {name:을/를} 더 볼 수 있어요. 그때마다 웃을 거리 하나씩은 생기겠죠.",
          "{name:와/과} \"다음에 또 보자\" 할 날이 {count}번 있어요. 다 이어도 {span:이/가} 안 되지만 매번 반가워요.",
          "{name:와/과}의 만남이 {count}번 있어요. 다음 만남이 벌써 기다려져요.",
          "{name:와/과} 웃으며 보낼 날이 {count}번이에요. 날로 세면 {span:이/가} 채 안 돼도 웃음은 넉넉하죠.",
          "{name:와/과} 밥 먹으며 수다 떨 날이 {count}번 있어요. 생각보다 넉넉하죠.",
          "{name:와/과} 함께할 날이 {count}번. {span}에 못 미쳐도 만날 때마다 반가워요.",
          "{name}도 {me:을/를} 만날 날을 기다릴 거예요. 그런 날이 아직 {count}번이에요.",
          "{name:와/과} 마주할 날이 {count}번 있어요. 날로 세면 {span}도 못 채워요. 그래도 웃을 일은 꽤 많죠.",
        ],
        week: [
          "{name:와/과} 만날 날이 {count}번 있어요. 한 번 한 번이 다 기다려지는 날이에요.",
          "{count}번이에요. {name:와/과}의 다음 만남은 오래 웃으며 이야기할 날이 될 거예요.",
          "{name:와/과} 마주할 {count}번, 그날마다 맛있는 걸 하나씩 먹어도 좋겠어요.",
        ],
        month: [
          "{name:와/과} 만날 날이 {count}번이에요. 달력 한 장에 반가운 칸이 그만큼이에요.",
          "{count}번이면 그날마다 {name:와/과} 갈 곳을 하나씩 정해 볼 수 있어요.",
          "{name:와/과}의 만남, {count}번이 기다려요. 갈 맛집부터 떠오르는 숫자예요.",
        ],
        more: [
          "{name:와/과} 만날 날이 아직 {count}번이나 있어요. 하고 싶은 걸 다 해 봐도 될 만큼이에요.",
          "{count}번이에요. {name:와/과} 웃을 일이 그만큼 기다린다는 얘기죠.",
          "{name:와/과} 마주 앉을 날이 {count}번. 날로는 {span}도 안 되지만 하고 싶은 얘기를 하기엔 넉넉해요.",
        ],
      },
      today: {
        senior: [
          "이번 주엔 {name}께 전화 드려요. \"밥은 먹었니\" 하는 목소리가 반가울 거예요.",
          "다음에 뵐 땐 {name}께서 좋아하시는 떡 한 봉지 들고 가요.",
          "{name}께 요즘 재미있었던 일 하나 들려드려요. 이야기 끝나기도 전에 웃으시죠.",
          "다음 만남엔 {name:와/과} 사진 한 장 찍어요. 액자에 넣어 두실지도 몰라요.",
          "{name}께 옛날 노래 하나 틀어 드려요. 따라 부르실지도 몰라요.",
          "다음에 찾아뵐 땐 {name}의 손을 잡고 동네를 천천히 걸어요.",
          "{name}께 \"오늘 얼굴 좋아 보여요\" 한마디 해 드려요. 쑥스러워하시면서도 좋아하시죠.",
          "요즘 찍은 사진 한 장 {name}께 보내 드려요. 크게 키워서 보실 거예요.",
        ],
        often: [
          "오늘 저녁엔 {name:와/과} 좋아하는 메뉴로 밥 먹어요.",
          "오늘은 {name}에게 웃긴 얘기 하나 해 줘요. 같이 웃으면 하루가 가벼워져요.",
          "저녁 먹고 {name:와/과} 아이스크림 하나씩 물고 걸어요.",
          "오늘 {name}에게 \"고마워\" 한마디 해 봐요. 쑥스러워도 금방 웃음이 터져요.",
          "오늘은 {name:와/과} 같이 듣고 싶은 노래 하나 틀어 둬요.",
          "{name}의 하루가 어땠는지 물어봐요. 생각보다 재밌는 얘기가 나올걸요.",
          "오늘은 {name:와/과} 커피 한 잔 앞에 두고 수다 떨어요.",
          "주말에 {name:와/과} 할 일 하나, 오늘 미리 정해 두면 한 주가 신나요.",
        ],
        sometimes: [
          "이번 주말엔 {name:을/를} 보러 가요. 반갑게 웃어 줄 거예요.",
          "{name}에게 요즘 찍은 사진 한 장 보내요. 금방 답장이 오겠죠.",
          "다음 만남 날짜를 정하면 그날까지 달력 볼 맛이 나요.",
          "{name:와/과} 같이 가 보고 싶은 곳, 오늘 하나 골라 둬요.",
          "\"요즘 어떻게 지내?\" 하고 {name}에게 먼저 물어봐요.",
          "이번 달엔 {name:와/과} 맛집 하나 같이 가 봐요.",
          "{name:이/가} 좋아하는 간식 하나 챙겨 두면 다음 만남이 더 반가워요.",
          "{name}도 {me} 소식을 반가워할 거예요. 오늘 짧게 안부 보내요.",
        ],
        rarely: [
          "오늘 {name}에게 전화 걸어 봐요. \"웬일이야\" 하며 반가워할 거예요.",
          "{name}에게 \"보고 싶다\" 한마디 보내요. 답장에 웃음이 섞여 올 거예요.",
          "옛날 사진 한 장 {name}에게 보내 봐요. 그날 얘기로 한참 떠들게 돼요.",
          "다음 휴가엔 {name:을/를} 보러 가는 일정을 넣어 봐요.",
          "영상 통화 한 번이면 {name}의 웃는 얼굴을 바로 볼 수 있어요.",
          "올해 안에 {name:와/과} 만날 날을 하나 달력에 그려 둬요.",
          "멀어도 괜찮아요. 오늘 {name}에게 먼저 연락하면 돼요.",
          "{name:와/과} 다음에 만나면 뭘 할지 오늘 같이 정해 보는 건 어때요?",
        ],
        "elder.often": [
          "오늘 저녁엔 {name}께 하루 어떠셨는지 여쭤봐요. 이야기가 길어질수록 좋아요.",
          "{name}께서 좋아하시는 반찬 하나, 오늘은 {me:이/가} 만들어 드려요.",
          "저녁 먹고 {name:와/과} 동네 한 바퀴 걸어요. 이웃 얘기를 잔뜩 들려주실 거예요.",
          "오늘 {name}께 \"고마워요\" 한마디 해 드려요. 말씀은 없어도 표정이 달라져요.",
          "{name:와/과} 옛날 앨범을 펼쳐 봐요. 사진마다 얘기가 하나씩 나와요.",
          "오늘은 {name}께 차 한 잔 타 드려요. 같이 앉아만 있어도 좋아하실 거예요.",
          "주말엔 {name}께서 가 보고 싶다던 곳에 모시고 가요.",
          "{name}께 요즘 배운 걸 하나 알려 드려요. 신기해하시죠.",
        ],
        "elder.sometimes": [
          "이번 주말엔 {name:을/를} 뵈러 가요. 벌써 장 봐 두셨을지도 몰라요.",
          "오늘 {name}께 전화 드려요. 첫마디부터 목소리가 밝아지시죠.",
          "찾아뵐 날을 미리 말씀드려요. 그날까지 {name}께서 즐겁게 기다리시죠.",
          "요즘 찍은 사진 몇 장 {name}께 보내 드려요. 이웃분들께 자랑하실지도 몰라요.",
          "이번 달엔 {name:와/과} 맛있는 데 가서 밥 한 끼 해요. 계산은 {me:이/가} 하고요.",
          "다음에 뵐 땐 {name}께서 좋아하시는 과일 한 봉지 사 들고 가요.",
          "{name}께 \"보고 싶었어요\" 하고 먼저 말씀드려 봐요.",
          "{name:와/과} 통화하면서 다음에 같이 갈 곳을 하나 정해 봐요.",
        ],
        "elder.rarely": [
          "오늘 {name}께 전화 한 통 드려요. \"웬일이니\" 하며 반기실 거예요.",
          "{name}께 \"보고 싶어요\" 문자 한 줄 보내 드려요. 몇 번이고 다시 보실 거예요.",
          "다음 명절 말고 그 전에 한 번 찾아뵐 날을 정해 봐요.",
          "영상 통화로 얼굴 보여 드려요. 화면 너머로 손부터 흔드시죠.",
          "{name:와/과} 함께 찍은 옛 사진 한 장 보내 드려요. 그날 얘기가 술술 나와요.",
          "이번 휴가엔 {name}께 들러요. 반나절이어도 무척 반가워하실 거예요.",
          "올해 안에 {name:을/를} 뵈러 갈 날을 하나 달력에 적어 둬요.",
          "오늘은 {me:이/가} 먼저 연락드려요. {name}께는 그게 제일 반가운 소식이에요.",
        ],
        "*": [
          "오늘은 {name}에게 반가운 연락 하나 보내 봐요.",
          "{name:와/과} 맛있는 밥 한 끼 약속을 잡아 봐요.",
          "{name}도 {me} 소식이 궁금할 때예요. 전화 한 통 걸어 봐요.",
        ],
      },
      past: {
        senior: [
          "{name:와/과} {me:이/가} 함께해 온 날이 벌써 {pct}%예요. 웃은 날이 훨씬 많았죠.",
          "지나온 {pct}%의 날들마다 {name}께서 {me} 편이 되어 주셨어요.",
          "{pct}%를 지나오는 동안 {name}께서 들려주신 이야기가 가득해요.",
          "함께한 {pct}%의 시간이 {me:을/를} 이만큼 키웠어요. {name}께서도 뿌듯하실 거예요.",
          "{pct}%를 함께해 왔으니, {name}께서는 {me} 얼굴만 봐도 다 아실 거예요.",
        ],
        start: [
          "{name:와/과}의 이야기는 이제 {pct}%예요. 재미있는 장면은 대부분 아직 앞에 있어요.",
          "아직 {pct}%. {name:와/과} 웃을 일이 한참 기다리고 있어요.",
          "{name:와/과}의 시간은 첫 페이지를 막 넘겼어요. 다음 장이 벌써 궁금해요.",
          "함께할 날의 {pct}%만 지나왔어요. 처음 만난 날 얘기는 아직 어제 일 같죠.",
          "{name:와/과} 쌓아 갈 추억이 아직 한가득이에요. 이제 {pct}%를 왔을 뿐이에요.",
          "시작한 지 얼마 안 됐어요. {name:와/과} 갈 곳, 먹을 것, 할 얘기가 아직 많아요.",
        ],
        early: [
          "{name:와/과}의 시간은 {pct}%를 지났어요. 좋은 날은 앞에 훨씬 많아요.",
          "{pct}%. {name:와/과} 아직 안 가 본 곳이 많다는 얘기예요.",
          "지금까지 {pct}%를 함께했어요. 이제 서로 좋아하는 메뉴쯤은 다 알겠죠.",
          "{name:와/과} 함께할 날이 아직 훨씬 길어요. 지나온 {pct}%도 이렇게 즐거웠는걸요.",
          "{pct}%를 지나왔어요. 둘만 아는 농담이 하나둘 늘어 가는 때예요.",
          "아직 초반이에요. {name:와/과} 다음에 뭘 할지 생각하면 벌써 즐거워요.",
        ],
        middle: [
          "{name:와/과} 함께한 날이 {pct}%, 딱 반쯤이에요. 남은 반에도 웃을 일이 많을 거예요.",
          "{pct}%를 함께 왔어요. 남은 날도 둘이 같이라 든든해요.",
          "어느새 {pct}%. 처음 만난 날 얘기를 꺼내면 둘 다 웃음부터 나요.",
          "{name:와/과}의 시간은 {pct}%가 지났어요. 그만큼 서로를 잘 알게 됐죠.",
          "지나온 {pct}%만큼, 앞으로도 그만큼의 좋은 날이 있어요.",
          "{pct}%, 한가운데예요. 다음 만남엔 처음 가 보는 곳에 같이 가 봐요.",
        ],
        late: [
          "{name:와/과} 함께한 {pct}%의 날들, 고마운 날이 참 많았죠.",
          "{pct}%를 함께 지나왔어요. 그 많은 날 중에 웃은 날이 제일 많았을 거예요.",
          "벌써 {pct}%. {name:와/과} 나누는 이야기는 오히려 점점 깊어져요.",
          "{name:와/과}의 시간은 {pct}%가 흘렀어요. 만날 때 반가운 마음은 그대로예요.",
          "지나온 {pct}% 동안 {name}에게 받은 마음, 다음 만남에 조금씩 돌려줘요.",
          "{pct}%를 지나왔어도 {name:와/과} 만나면 여전히 할 말이 많죠.",
        ],
        last: [
          "{name:와/과} 함께한 날이 {pct}%예요. 그 덕에 지금의 {me:이/가} 있어요.",
          "{pct}%를 함께 지나왔어요. 만날 때마다 \"고마워\" 한마디씩 얹어요.",
          "지나온 {pct}%의 날들이 쌓여서 이제는 눈빛만 봐도 통하죠.",
          "벌써 {pct}%. 그래도 다음 만남은 여전히 반갑고 설레요.",
          "{name:와/과}의 시간은 {pct}%를 지나왔어요. 앞으로 올 날은 좋아하는 일로 채워요.",
          "{pct}%를 함께했어요. 오늘 같은 평범한 하루도 둘이면 충분히 좋아요.",
        ],
        "elder.late": [
          "함께한 {pct}% 동안 {name}께서 차려 주신 밥이 몇 그릇일까요.",
          "{pct}%를 지나왔어요. 이제는 {me:이/가} {name}께 맛있는 걸 사 드릴 차례예요.",
          "벌써 {pct}%. 다음에 뵐 땐 {name}께서 좋아하시는 노래를 같이 들어요.",
          "지나온 {pct}% 내내 {name}께서 {me:을/를} 응원해 주셨어요. 이번엔 {me} 차례예요.",
          "{name:와/과}의 시간은 {pct}%를 지났어요. 다음 만남도 문 앞에서부터 반기시겠죠.",
        ],
        "elder.last": [
          "{name:와/과} 지나온 시간이 {pct}%예요. 그 시간 내내 {name}께서 {me} 편이셨죠.",
          "{pct}%를 함께해 왔어요. 다음에 뵐 땐 그때 그 시절 얘기로 실컷 웃어요.",
          "벌써 {pct}%. {name}께서는 지금도 {me} 오는 날을 기다리시죠.",
          "{pct}%를 지나왔어요. 다음에 찾아뵐 땐 {name}의 손을 꼭 잡아 드려요.",
          "함께한 {pct}%의 날들 덕분에, 지금도 {name}께 전화하면 마음이 놓여요.",
        ],
        "partner.start": [
          "{name:와/과}의 이야기는 이제 {pct}%. 같이 해 보고 싶은 게 잔뜩 있죠.",
          "막 시작한 사이예요. 요즘 {name:와/과} 주고받는 문자 하나하나가 설레요.",
          "아직 {pct}%. 처음 가 보는 곳에 {name:와/과} 함께 갈 날이 많아요.",
          "둘의 시간은 이제 시작이에요. {name}도 오늘 {me} 생각에 웃었을 거예요.",
          "아직 서로 처음인 게 많아요. {name:와/과} 다음 데이트 계획부터 세워 봐요.",
        ],
        "partner.early": [
          "{name:와/과} 함께한 날은 {pct}%. 같이 갈 여행지 목록이 아직 길어요.",
          "{pct}%를 지나왔어요. 이제는 {name}의 웃음소리만 들어도 기분이 좋아지죠.",
          "둘의 이야기는 아직 초반이에요. 오늘 저녁엔 \"오늘 어땠어?\" 하고 물어봐요.",
          "{name:와/과} 쌓아 갈 날이 훨씬 많아요. 둘만의 단골집도 하나씩 늘겠죠.",
          "지금은 {name:와/과} 서로 닮아 가는 중이에요. 그게 꽤 즐거운 일이죠.",
        ],
      },
      met: {
        "*": [
          "반가운 하루였죠. 올해 {n}번째 만남이에요.",
          "{name:와/과} 웃은 오늘, 올해 {n}번째로 적어 둘게요.",
          "오늘 나눈 얘기에 아직 웃음이 나요. 올해 {n}번째예요.",
          "좋은 날이 하나 더 쌓였어요. 올해 {n}번째예요.",
          "{name}도 집에 가는 길에 웃고 있을 거예요. 올해 {n}번째예요.",
          "오늘도 만나서 다행이에요. 올해 {n}번째 만남이에요.",
          "다음 만남이 벌써 기다려져요. 오늘은 올해 {n}번째였어요.",
          "사진 한 장쯤 찍었나요? 올해 {n}번째 만남이에요.",
        ],
        elder: [
          "{name}께서 무척 반가우셨을 거예요. 올해 {n}번째 만남이에요.",
          "찾아뵌 오늘이 {name}께는 한동안 이야깃거리예요. 올해 {n}번째예요.",
          "{name}께서 문 앞까지 배웅해 주셨겠죠. 올해 {n}번째예요.",
          "{name:와/과}의 올해 {n}번째 만남이에요. 다음에도 현관에서 먼저 맞아 주시겠죠.",
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

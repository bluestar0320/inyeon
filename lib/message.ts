/*
 * 「한마디 보내기」. 숫자를 보고 끝나지 않고 실제 연락으로 이어지게, 그 사람에게 보낼 첫 문장을 건넨다.
 * 앱의 숫자(남은 횟수·비율)는 넣지 않는다 — 받는 사람에게는 이유 없는 안부가 가장 반갑다.
 * 보내기 전에 메신저에서 얼마든지 고칠 수 있으니, 짧고 평범하게 쓴다.
 */
import type { Lang } from "./i18n.ts";

type Group = "elder" | "partner" | "child" | "other";

const LINES: Record<Lang, Record<Group, string[]>> = {
  ko: {
    elder: [
      "{name}, 갑자기 목소리 듣고 싶어서 연락드려요. 이번 주에 얼굴 뵈러 갈게요.",
      "{name}, 요즘 어떻게 지내세요? 다음 주말에 맛있는 거 사 들고 갈게요.",
      "{name}, 별일 없으시죠? 그냥 보고 싶어서요.",
    ],
    partner: ["오늘 하루 어땠어? 갑자기 보고 싶어서.", "이번 주말에 우리 뭐 할까? 나 벌써 기다려져.", "그냥 생각나서. 오늘도 고마워."],
    child: ["오늘 하루 어땠어? 저녁에 얘기 들려줘.", "갑자기 네 생각이 나서. 이번 주에 같이 맛있는 거 먹자.", "보고 싶다. 조만간 얼굴 보자."],
    other: ["갑자기 생각나서 연락했어. 이번 주에 밥 한번 먹자.", "잘 지내? 요즘 어떻게 사는지 궁금해서.", "보고 싶다. 조만간 얼굴 보자."],
  },
  en: {
    elder: ["Hi {name}, I just wanted to hear your voice. I'll come by this week.", "Hi {name}, how have you been? I'll bring something good next weekend.", "Hi {name}, just thinking of you. Talk soon."],
    partner: ["How was your day? I suddenly missed you.", "What should we do this weekend? I'm already looking forward to it.", "Just thinking of you. Thank you for today."],
    child: ["How was your day? Tell me all about it tonight.", "I was just thinking of you. Let's get something good to eat this week.", "Miss you. Let's see each other soon."],
    other: ["You popped into my head. Dinner this week?", "How are you doing? I've been wondering what you're up to.", "Miss you. Let's catch up soon."],
  },
  ja: {
    elder: ["{name}、急に声が聞きたくなって連絡しました。今週、顔を見に行きますね。", "{name}、最近どうしていますか？来週末、おいしいものを持って行きます。", "{name}、お変わりないですか？なんだか会いたくなって。"],
    partner: ["今日はどんな一日だった？急に会いたくなって。", "今週末、何しようか。もう楽しみにしてる。", "なんとなく思い出して。今日もありがとう。"],
    child: ["今日はどうだった？夜に話を聞かせてね。", "ふと思い出して。今週、一緒においしいもの食べよう。", "会いたいな。近いうちに顔を見せてね。"],
    other: ["ふと思い出して連絡したよ。今週ごはんでもどう？", "元気にしてる？最近どうしてるか気になって。", "会いたいな。近いうちに会おうよ。"],
  },
  es: {
    elder: ["{name}, tenía ganas de oír tu voz. Esta semana paso a verte.", "{name}, ¿cómo has estado? El próximo fin de semana llevo algo rico.", "{name}, ¿todo bien por allá? Solo quería saludarte."],
    partner: ["¿Qué tal tu día? De repente te extrañé.", "¿Qué hacemos este fin de semana? Ya tengo ganas.", "Solo pensaba en ti. Gracias por hoy."],
    child: ["¿Qué tal tu día? Esta noche me cuentas.", "Me acordé de ti. Esta semana comemos algo rico juntos.", "Te extraño. Nos vemos pronto."],
    other: ["Me acordé de ti. ¿Comemos esta semana?", "¿Cómo estás? Tenía curiosidad por saber de ti.", "Te extraño. A ver si nos vemos pronto."],
  },
  zh: {
    elder: ["{name}，突然想听听您的声音。这周我回去看您。", "{name}，最近还好吗？下周末我带点好吃的回去。", "{name}，一切都好吧？就是想您了。"],
    partner: ["今天过得怎么样？突然好想你。", "这个周末我们做点什么？我已经开始期待了。", "就是想到你了。今天也谢谢你。"],
    child: ["今天过得怎么样？晚上讲给我听。", "突然想到你。这周一起吃点好吃的吧。", "想你了，过几天见个面吧。"],
    other: ["突然想起你，这周一起吃个饭吧。", "最近怎么样？有点想知道你的近况。", "想你了，找时间见一面吧。"],
  },
};

export function messageGroup(rel: string): Group {
  if (rel === "parent" || rel === "grandparent") return "elder";
  if (rel === "partner" || rel === "child") return rel;
  return "other";
}

/** 같은 사람에게는 날마다 다른 한 줄(seed). 어른께는 이름으로 부르며 시작한다. */
export function messageFor(lang: Lang, rel: string, name: string, seed: number): string {
  const list = LINES[lang][messageGroup(rel)];
  return list[seed % list.length].replaceAll("{name}", name);
}

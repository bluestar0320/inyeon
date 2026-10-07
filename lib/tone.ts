import type { LimitedBy } from "./calc";
import { josa } from "./format";
import { getLang, type Lang } from "./i18n";
import type { Tone } from "./types";

/**
 * 같은 숫자라도 문장에 따라 무게가 달라진다. 계산 결과는 건드리지 않고 문구만
 * 고른다. calm은 담담하게, warm은 숫자 너머의 사람을 떠올리게, aware는 유한함을
 * 또렷하게 드러낸다.
 */
export interface ToneCopy {
  label: string;
  description: string;
  /** 대시보드 인사말. */
  greeting: string;
  /** 인연 카드의 숫자 위에 붙는 라벨. */
  meetingLabel: string;
  /** 순간 카드의 숫자 위에 붙는 라벨. */
  momentLabel: string;
  /** 내 남은 시간 카드 라벨. */
  lifeLabel: string;
  /** 결혼 계획 카드의 숫자 위에 붙는 라벨. */
  marriageLabel: string;
  meetingSentence: (name: string, count: string) => string;
  momentSentence: (title: string, count: string) => string;
  marriageSentence: (targetAge: number, count: string) => string;
  limitedBySentence: (limitedBy: LimitedBy, name: string) => string;
  emptyPeople: string;
  emptyMoments: string;
  emptyMarriage: string;
}

const CALM_KO: ToneCopy = {
  label: "담담하게",
  description: "숫자를 계획의 재료로 다룹니다.",
  greeting: "앞으로 남은 것들을 세어 봅니다.",
  meetingLabel: "앞으로 만날 수 있는 횟수",
  momentLabel: "앞으로 할 수 있는 횟수",
  lifeLabel: "나에게 남은 시간",
  marriageLabel: "앞으로 만날 수 있는 사람",
  meetingSentence: (name, count) => `${josa(name, "와/과")} 앞으로 ${count}번 만날 수 있어요.`,
  momentSentence: (title, count) => `${josa(title, "은/는")} 앞으로 ${count}번 할 수 있어요.`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}세까지 새로운 사람을 ${count}번 만날 수 있어요.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "이 횟수는 내 남은 시간이 기준이에요.";
    if (limitedBy === "them") return `이 횟수는 ${name}의 남은 시간이 기준이에요.`;
    if (limitedBy === "both") return "두 사람의 남은 시간이 비슷해요.";
    if (limitedBy === "horizon") return "이 횟수는 정해 둔 목표 시점이 기준이에요.";
    return "나이를 채우면 기준이 되는 쪽을 알려드려요.";
  },
  emptyPeople: "자주 만나는 사람부터 한 명 적어 보세요.",
  emptyMoments: "올해 꼭 하고 싶은 일을 하나 적어 보세요.",
  emptyMarriage: "목표로 하는 나이가 있다면 세어 볼 수 있어요.",
};

/*
 * 숫자를 줄어드는 재고가 아니라 남아 있는 선물로 읽게 한다. 슬픔을 짜내지 않는다 —
 * "이제 몇 번밖에"가 아니라 "아직 이만큼"이 이 톤의 방향이다.
 */
const WARM_KO: ToneCopy = {
  label: "따뜻하게",
  description: "숫자 너머의 사람과 순간을 떠올리게 합니다.",
  greeting: "지금 곁에 있는 것들이 가장 귀합니다.",
  meetingLabel: "함께할 수 있는 날",
  momentLabel: "다시 누릴 수 있는 순간",
  lifeLabel: "나에게 주어진 시간",
  marriageLabel: "다가올 만남",
  meetingSentence: (name, count) =>
    `${josa(name, "와/과")} 마주 앉을 날이 아직 ${count}번 남아 있어요. 한 번 한 번이 선물이에요.`,
  momentSentence: (title, count) =>
    `${josa(title, "을/를")} 앞으로 ${count}번 더 누릴 수 있어요. 이번 한 번도 온 마음으로.`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}세까지 ${count}번의 새로운 만남이 기다려요. 그중 한 사람이면 충분해요.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "내 시간이 먼저 저물어요. 그러니 곁에 있을 때 더 많이 머물러 주세요.";
    if (limitedBy === "them") return `${name}의 시간이 먼저 저물어요. 그래서 오늘의 한 번이 더 소중해요.`;
    if (limitedBy === "both") return "두 사람의 시간이 나란히 흘러가요.";
    if (limitedBy === "horizon") return "정해 둔 그날까지의 이야기예요.";
    return "나이를 채우면 누구의 시간을 기준으로 세는지 알려드려요.";
  },
  emptyPeople: "떠올리면 마음이 따뜻해지는 사람, 한 명부터 적어 보세요.",
  emptyMoments: "생각만 해도 설레는 일을 하나 적어 보세요.",
  emptyMarriage: "함께할 사람을 기다리는 마음도 셀 수 있어요.",
};

const AWARE_KO: ToneCopy = {
  label: "찡하게",
  description: "남은 횟수가 얼마나 귀한지 또렷하게 짚어 줍니다.",
  greeting: "남은 횟수는 생각보다 적어요.",
  meetingLabel: "남은 만남",
  momentLabel: "남은 횟수",
  lifeLabel: "나에게 남은 시간",
  marriageLabel: "남은 기회",
  meetingSentence: (name, count) => `${josa(name, "와/과")} 남은 만남은 ${count}번이에요.`,
  momentSentence: (title, count) => `${title}, 남은 횟수 ${count}번.`,
  marriageSentence: (targetAge, count) => `${targetAge}세까지 남은 기회, ${count}번.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "먼저 끝나는 쪽은 내 시간입니다.";
    if (limitedBy === "them") return `먼저 끝나는 쪽은 ${name}의 시간입니다.`;
    if (limitedBy === "both") return "두 사람의 시간이 거의 동시에 끝납니다.";
    if (limitedBy === "horizon") return "수명보다 목표 시점이 먼저 옵니다.";
    return "나이를 채우면 어느 쪽이 먼저 끝나는지 계산됩니다.";
  },
  emptyPeople: "아직 아무도 세지 않았습니다.",
  emptyMoments: "아직 아무것도 세지 않았습니다.",
  emptyMarriage: "목표 나이를 정하면 남은 기회가 계산됩니다.",
};

/* ---- English ---- */

const CALM_EN: ToneCopy = {
  label: "Plainly",
  description: "Treats the numbers as material for planning.",
  greeting: "Let's count what lies ahead.",
  meetingLabel: "Times you can still meet",
  momentLabel: "Times you can still do it",
  lifeLabel: "Time ahead",
  marriageLabel: "People you can still meet",
  meetingSentence: (name, count) => `You can see ${name} ${count} more times.`,
  momentSentence: (title, count) => `You can enjoy ${title} ${count} more times.`,
  marriageSentence: (targetAge, count) =>
    `You can meet ${count} new people before you turn ${targetAge}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "This count is based on your remaining time.";
    if (limitedBy === "them") return `This count is based on ${name}'s remaining time.`;
    if (limitedBy === "both") return "You both have about the same time left.";
    if (limitedBy === "horizon") return "This count runs until the date you set.";
    return "Add ages and we'll show whose time sets the limit.";
  },
  emptyPeople: "Start with one person you see often.",
  emptyMoments: "Write down one thing you want to do this year.",
  emptyMarriage: "If you have an age in mind, we can count toward it.",
};

const WARM_EN: ToneCopy = {
  label: "Warmly",
  description: "Brings to mind the people and moments behind the numbers.",
  greeting: "What's beside you now is what matters most.",
  meetingLabel: "Days you still get together",
  momentLabel: "Moments still ahead of you",
  lifeLabel: "The time you've been given",
  marriageLabel: "Meetings still to come",
  meetingSentence: (name, count) =>
    `You still have ${count} more times to sit down with ${name}. Each one is a gift.`,
  momentSentence: (title, count) =>
    `${title}: ${count} more times to savor. Give this one your whole heart.`,
  marriageSentence: (targetAge, count) =>
    `${count} new meetings are waiting before you turn ${targetAge}. One person is all it takes.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Your time runs out first. So stay close while you can.";
    if (limitedBy === "them")
      return `${name}'s time runs out first. That's why today's visit matters so much.`;
    if (limitedBy === "both") return "Your times flow on side by side.";
    if (limitedBy === "horizon") return "This is the story up to the day you chose.";
    return "Add ages and we'll show whose time we're counting by.";
  },
  emptyPeople: "Start with someone who warms your heart.",
  emptyMoments: "Write down something that makes your heart skip.",
  emptyMarriage: "Waiting for the right person can be counted, too.",
};

const AWARE_EN: ToneCopy = {
  label: "Clearly",
  description: "Makes it plain that what's left is finite.",
  greeting: "The number of times left is already set.",
  meetingLabel: "Meetings left",
  momentLabel: "Times left",
  lifeLabel: "Time left",
  marriageLabel: "Chances left",
  meetingSentence: (name, count) => `Meetings left with ${name}: ${count}.`,
  momentSentence: (title, count) => `${title}, times left: ${count}.`,
  marriageSentence: (targetAge, count) => `Chances left before ${targetAge}: ${count}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Your time ends first.";
    if (limitedBy === "them") return `${name}'s time ends first.`;
    if (limitedBy === "both") return "Both of your times end at about the same point.";
    if (limitedBy === "horizon") return "Your target date comes before either lifetime ends.";
    return "Add ages to see whose time ends first.";
  },
  emptyPeople: "No one counted yet.",
  emptyMoments: "Nothing counted yet.",
  emptyMarriage: "Set a target age to count the chances left.",
};

/* ---- 日本語 ---- */

const CALM_JA: ToneCopy = {
  label: "淡々と",
  description: "数字を計画の材料として扱います。",
  greeting: "これから残っているものを数えてみましょう。",
  meetingLabel: "これから会える回数",
  momentLabel: "これからできる回数",
  lifeLabel: "これからの時間",
  marriageLabel: "これから出会える人",
  meetingSentence: (name, count) => `${name}とはこれから${count}回会えます。`,
  momentSentence: (title, count) => `${title}はこれから${count}回できます。`,
  marriageSentence: (targetAge, count) => `${targetAge}歳までに新しい人と${count}回出会えます。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "この回数は自分の残り時間が基準です。";
    if (limitedBy === "them") return `この回数は${name}の残り時間が基準です。`;
    if (limitedBy === "both") return "二人の残り時間はほぼ同じです。";
    if (limitedBy === "horizon") return "この回数は決めておいた時点が基準です。";
    return "年齢を入れると、どちらが基準かお知らせします。";
  },
  emptyPeople: "よく会う人を一人、書いてみましょう。",
  emptyMoments: "今年ぜひやりたいことを一つ書いてみましょう。",
  emptyMarriage: "目標の年齢があれば、数えてみることができます。",
};

const WARM_JA: ToneCopy = {
  label: "あたたかく",
  description: "数字の向こうにいる人やひとときを思い浮かべます。",
  greeting: "いま、そばにあるものがいちばん大切です。",
  meetingLabel: "一緒に過ごせる日",
  momentLabel: "また味わえるひととき",
  lifeLabel: "わたしに与えられた時間",
  marriageLabel: "これからの出会い",
  meetingSentence: (name, count) =>
    `${name}と向かい合える日は、まだ${count}回あります。一回一回が贈りものです。`,
  momentSentence: (title, count) => `${title}を、あと${count}回味わえます。今度の一回も、心をこめて。`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}歳までに${count}回の新しい出会いが待っています。そのうちの一人で十分です。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "わたしの時間が先に暮れていきます。だから、そばにいられるうちに。";
    if (limitedBy === "them")
      return `${name}の時間が先に暮れていきます。だから今日の一回がいっそう大切です。`;
    if (limitedBy === "both") return "二人の時間が、並んで流れていきます。";
    if (limitedBy === "horizon") return "決めておいたその日までの物語です。";
    return "年齢を入れると、誰の時間を基準に数えるかお知らせします。";
  },
  emptyPeople: "思い浮かべると心があたたかくなる人を、一人書いてみましょう。",
  emptyMoments: "考えるだけで胸がはずむことを、一つ書いてみましょう。",
  emptyMarriage: "誰かを待つ気持ちも、数えることができます。",
};

const AWARE_JA: ToneCopy = {
  label: "はっきりと",
  description: "残りが有限であることをはっきり示します。",
  greeting: "残りの回数は、もう決まっています。",
  meetingLabel: "残りの再会",
  momentLabel: "残りの回数",
  lifeLabel: "残りの時間",
  marriageLabel: "残りの機会",
  meetingSentence: (name, count) => `${name}との残りの再会、${count}回。`,
  momentSentence: (title, count) => `${title}、残り${count}回。`,
  marriageSentence: (targetAge, count) => `${targetAge}歳までの残りの機会、${count}回。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "先に終わるのは自分の時間です。";
    if (limitedBy === "them") return `先に終わるのは${name}の時間です。`;
    if (limitedBy === "both") return "二人の時間はほぼ同時に終わります。";
    if (limitedBy === "horizon") return "寿命より目標の時点が先に来ます。";
    return "年齢を入れると、どちらが先に終わるか計算されます。";
  },
  emptyPeople: "まだ誰も数えていません。",
  emptyMoments: "まだ何も数えていません。",
  emptyMarriage: "目標の年齢を決めると、残りの機会が計算されます。",
};

/* ---- Español ---- */

const CALM_ES: ToneCopy = {
  label: "Con serenidad",
  description: "Trata los números como material para planificar.",
  greeting: "Contemos lo que queda por delante.",
  meetingLabel: "Veces que aún podéis veros",
  momentLabel: "Veces que aún puedes hacerlo",
  lifeLabel: "Tiempo por delante",
  marriageLabel: "Personas que aún puedes conocer",
  meetingSentence: (name, count) => `Puedes ver a ${name} ${count} veces más.`,
  momentSentence: (title, count) => `Puedes disfrutar de ${title} ${count} veces más.`,
  marriageSentence: (targetAge, count) =>
    `Puedes conocer a ${count} personas nuevas antes de los ${targetAge}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Este número se basa en tu tiempo restante.";
    if (limitedBy === "them") return `Este número se basa en el tiempo restante de ${name}.`;
    if (limitedBy === "both") return "A los dos os queda un tiempo parecido.";
    if (limitedBy === "horizon") return "Este número llega hasta la fecha que elegiste.";
    return "Añade las edades y te diremos qué tiempo marca el límite.";
  },
  emptyPeople: "Empieza por una persona a la que ves a menudo.",
  emptyMoments: "Escribe algo que quieras hacer este año.",
  emptyMarriage: "Si tienes una edad en mente, podemos contar hasta ella.",
};

const WARM_ES: ToneCopy = {
  label: "Con ternura",
  description: "Hace pensar en las personas y los momentos detrás de los números.",
  greeting: "Lo que tienes cerca ahora es lo más valioso.",
  meetingLabel: "Días que aún compartiréis",
  momentLabel: "Momentos que aún te esperan",
  lifeLabel: "El tiempo que se te ha dado",
  marriageLabel: "Encuentros por venir",
  meetingSentence: (name, count) =>
    `Aún te quedan ${count} veces para sentarte frente a ${name}. Cada una es un regalo.`,
  momentSentence: (title, count) =>
    `${title}: ${count} veces más para disfrutarlo. Vive esta con todo el corazón.`,
  marriageSentence: (targetAge, count) =>
    `Te esperan ${count} encuentros nuevos antes de los ${targetAge}. Basta con una persona.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Tu tiempo se apaga antes. Por eso, quédate cerca mientras puedas.";
    if (limitedBy === "them")
      return `El tiempo de ${name} se apaga antes. Por eso la visita de hoy vale tanto.`;
    if (limitedBy === "both") return "Vuestros tiempos avanzan uno junto al otro.";
    if (limitedBy === "horizon") return "Es la historia hasta el día que elegiste.";
    return "Añade las edades y te diremos con qué tiempo contamos.";
  },
  emptyPeople: "Empieza por alguien que te caliente el corazón.",
  emptyMoments: "Escribe algo que te ilusione solo con pensarlo.",
  emptyMarriage: "Esperar a esa persona también se puede contar.",
};

const AWARE_ES: ToneCopy = {
  label: "Con claridad",
  description: "Deja claro que lo que queda es finito.",
  greeting: "Las veces que quedan ya están contadas.",
  meetingLabel: "Encuentros restantes",
  momentLabel: "Veces restantes",
  lifeLabel: "Tiempo restante",
  marriageLabel: "Oportunidades restantes",
  meetingSentence: (name, count) => `Encuentros restantes con ${name}: ${count}.`,
  momentSentence: (title, count) => `${title}, veces restantes: ${count}.`,
  marriageSentence: (targetAge, count) =>
    `Oportunidades restantes hasta los ${targetAge}: ${count}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Tu tiempo termina primero.";
    if (limitedBy === "them") return `El tiempo de ${name} termina primero.`;
    if (limitedBy === "both") return "Vuestros tiempos terminan casi a la vez.";
    if (limitedBy === "horizon") return "La fecha objetivo llega antes que el final de ambas vidas.";
    return "Añade las edades para ver qué tiempo termina primero.";
  },
  emptyPeople: "Aún no has contado a nadie.",
  emptyMoments: "Aún no has contado nada.",
  emptyMarriage: "Fija una edad objetivo para contar las oportunidades restantes.",
};

/* ---- 中文 ---- */

const CALM_ZH: ToneCopy = {
  label: "平静地",
  description: "把数字当作规划的材料。",
  greeting: "数一数今后还剩下的。",
  meetingLabel: "今后还能见面的次数",
  momentLabel: "今后还能做的次数",
  lifeLabel: "今后的时间",
  marriageLabel: "今后还能遇见的人",
  meetingSentence: (name, count) => `今后还能和${name}见面${count}次。`,
  momentSentence: (title, count) => `${title}今后还能做${count}次。`,
  marriageSentence: (targetAge, count) => `${targetAge}岁之前还能认识${count}位新朋友。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "这个次数以你剩余的时间为准。";
    if (limitedBy === "them") return `这个次数以${name}剩余的时间为准。`;
    if (limitedBy === "both") return "你们俩剩余的时间差不多。";
    if (limitedBy === "horizon") return "这个次数以你设定的时间点为准。";
    return "填写年龄后，会告诉你以谁的时间为准。";
  },
  emptyPeople: "先写下一位常见面的人吧。",
  emptyMoments: "写下一件今年一定想做的事吧。",
  emptyMarriage: "如果心里有目标年龄，可以数一数。",
};

const WARM_ZH: ToneCopy = {
  label: "温暖地",
  description: "让你想起数字背后的人与时光。",
  greeting: "此刻陪在身边的，最珍贵。",
  meetingLabel: "还能相聚的日子",
  momentLabel: "还能再享受的时光",
  lifeLabel: "属于我的时间",
  marriageLabel: "即将到来的相遇",
  meetingSentence: (name, count) => `和${name}相对而坐的日子还有${count}次。每一次都是礼物。`,
  momentSentence: (title, count) => `${title}，还能再享受${count}次。这一次也请全心全意。`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}岁之前，还有${count}次新的相遇在等你。其中一个人就足够了。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "我的时间会先走到尽头。所以趁还在身边，多陪一陪。";
    if (limitedBy === "them") return `${name}的时间会先走到尽头。所以今天的这一次更加珍贵。`;
    if (limitedBy === "both") return "你们的时间并肩流淌。";
    if (limitedBy === "horizon") return "这是到你选定那一天为止的故事。";
    return "填写年龄后，会告诉你以谁的时间来计算。";
  },
  emptyPeople: "先写下一位想起来就心里温暖的人吧。",
  emptyMoments: "写下一件光是想想就让你心动的事吧。",
  emptyMarriage: "等待那个人的心情，也可以数一数。",
};

const AWARE_ZH: ToneCopy = {
  label: "清醒地",
  description: "清楚地表明剩下的次数是有限的。",
  greeting: "剩下的次数，早已注定。",
  meetingLabel: "剩余的相见",
  momentLabel: "剩余的次数",
  lifeLabel: "剩余的时间",
  marriageLabel: "剩余的机会",
  meetingSentence: (name, count) => `和${name}剩余的相见，${count}次。`,
  momentSentence: (title, count) => `${title}，剩余${count}次。`,
  marriageSentence: (targetAge, count) => `${targetAge}岁之前剩余的机会，${count}次。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "先结束的是你的时间。";
    if (limitedBy === "them") return `先结束的是${name}的时间。`;
    if (limitedBy === "both") return "你们的时间几乎同时结束。";
    if (limitedBy === "horizon") return "目标时间点比寿命先到来。";
    return "填写年龄后，会计算出谁的时间先结束。";
  },
  emptyPeople: "还没有数任何人。",
  emptyMoments: "还没有数任何事。",
  emptyMarriage: "设定目标年龄，就能算出剩余的机会。",
};

const BY_TONE: Record<Tone, Record<Lang, ToneCopy>> = {
  calm: { ko: CALM_KO, en: CALM_EN, ja: CALM_JA, es: CALM_ES, zh: CALM_ZH },
  warm: { ko: WARM_KO, en: WARM_EN, ja: WARM_JA, es: WARM_ES, zh: WARM_ZH },
  aware: { ko: AWARE_KO, en: AWARE_EN, ja: AWARE_JA, es: AWARE_ES, zh: AWARE_ZH },
};

/** 고를 수 있는 톤. 설정 화면이 이 순서로 보여준다. */
export const TONE_ORDER: Tone[] = ["calm", "warm", "aware"];

export function copyFor(tone: Tone): ToneCopy {
  return (BY_TONE[tone] ?? BY_TONE.calm)[getLang()];
}

const HORIZON_PASSED = {
  ko: (age: number) => `이미 만 ${age}세를 지나서 0번입니다. 세는 기간을 다시 정해 주세요.`,
  en: (age: number) => `You're already past ${age}, so this is 0. Choose a new period to count.`,
  ja: (age: number) => `すでに${age}歳を過ぎているため0回です。数える期間を決め直してください。`,
  es: (age: number) => `Ya has pasado los ${age}, así que es 0. Elige otro periodo para contar.`,
  zh: (age: number) => `你已经过了${age}岁，所以是0次。请重新设定计算期间。`,
} satisfies Record<Lang, (age: number) => string>;

/** "내가 n세 될 때까지"의 n이 이미 지났을 때. 톤과 상관없이 사실만 말한다. */
export function horizonPassedSentence(age: number): string {
  return HORIZON_PASSED[getLang()](age);
}

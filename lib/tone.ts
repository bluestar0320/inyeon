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
  greeting: "세어 보고, 다음 약속 하나만 정해 두면 돼요.",
  meetingLabel: "앞으로 만날 수 있는 횟수",
  momentLabel: "앞으로 할 수 있는 횟수",
  lifeLabel: "나에게 남은 시간",
  marriageLabel: "앞으로 만날 수 있는 사람",
  meetingSentence: (name, count) => `${josa(name, "와/과")} 앞으로 ${count}번 만나요. 다음 날짜는 미리 정해 둬요.`,
  momentSentence: (title, count) => `${josa(title, "은/는")} 앞으로 ${count}번이에요.`,
  marriageSentence: (targetAge, count) => `${targetAge}세까지 새로운 사람을 만날 기회는 ${count}번이에요.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "내 시간을 기준으로 셌어요.";
    if (limitedBy === "them") return `${name}의 시간을 기준으로 셌어요.`;
    if (limitedBy === "both") return "두 사람의 시간이 비슷하게 흘러요.";
    if (limitedBy === "horizon") return "정해 둔 날까지를 셌어요.";
    return "나이를 채우면 누구의 시간으로 셌는지 알려 드려요.";
  },
  emptyPeople: "자주 보는 사람 한 명부터 적어 두면 돼요.",
  emptyMoments: "올해 해 보고 싶은 일 하나를 적어 둬요.",
  emptyMarriage: "목표로 하는 나이를 정하면 차분히 세어 볼게요.",
};

/*
 * 숫자를 줄어드는 재고가 아니라 아직 남아 있는 반가운 날들로 읽게 한다. 슬픔을 짜내지 않는다 —
 * "이제 몇 번밖에"가 아니라 "아직 이만큼"이 이 톤의 방향이다.
 */
const WARM_KO: ToneCopy = {
  label: "따뜻하게",
  description: "숫자 너머의 사람과 순간을 떠올리게 합니다.",
  greeting: "오늘 생각나는 얼굴이 있다면, 반가운 연락 하나 보내 봐요.",
  meetingLabel: "함께할 수 있는 날",
  momentLabel: "다시 누릴 수 있는 순간",
  lifeLabel: "나에게 주어진 시간",
  marriageLabel: "다가올 만남",
  meetingSentence: (name, count) =>
    `${josa(name, "와/과")} 마주 앉을 날이 아직 ${count}번이나 있어요. 다음 만남이 벌써 기다려져요.`,
  momentSentence: (title, count) =>
    `${josa(title, "을/를")} 앞으로 ${count}번 더 할 수 있어요. 이번 한 번도 신나게 해요.`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}세까지 새로운 만남이 ${count}번 기다리고 있어요. 그중 한 사람이면 충분하죠.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "내 시간을 기준으로 셌어요. 곁에 있을 때 한 번 더 웃어 주면 돼요.";
    if (limitedBy === "them") return `${name}의 시간을 기준으로 셌어요. 오늘 거는 전화 한 통이 반가운 소식이 될 거예요.`;
    if (limitedBy === "both") return "두 사람의 시간이 나란히 걸어가요.";
    if (limitedBy === "horizon") return "정해 둔 그날까지, 함께할 날들을 셌어요.";
    return "나이를 채우면 누구의 시간으로 셌는지 알려 드려요.";
  },
  emptyPeople: "요즘 자주 생각나는 사람, 한 명부터 적어 봐요.",
  emptyMoments: "생각만 해도 설레는 일을 하나 적어 봐요.",
  emptyMarriage: "언젠가 만날 사람을 기다리는 날들도 세어 볼 수 있어요.",
};

const AWARE_KO: ToneCopy = {
  label: "찡하게",
  description: "남은 횟수가 얼마나 귀한지 또렷하게 짚어 줍니다.",
  greeting: "세어 보면, 생각보다 적어요.",
  meetingLabel: "남은 만남",
  momentLabel: "남은 횟수",
  lifeLabel: "나에게 남은 시간",
  marriageLabel: "남은 기회",
  meetingSentence: (name, count) => `${josa(name, "와/과")} 마주 앉을 날, 앞으로 ${count}번이에요.`,
  momentSentence: (title, count) => `${title}, 앞으로 ${count}번이에요.`,
  marriageSentence: (targetAge, count) => `${targetAge}세까지 새로 만날 기회는 ${count}번이에요.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "이 숫자는 내 시간에 맞춰 셌어요. 생각보다 짧죠.";
    if (limitedBy === "them") return `이 숫자는 ${name}의 시간에 맞춰 셌어요. 오늘 연락 한 번이 그래서 더 커요.`;
    if (limitedBy === "both") return "두 사람의 시간이 거의 나란히 흘러가요.";
    if (limitedBy === "horizon") return "정해 둔 그날이 먼저 와요.";
    return "나이를 채우면 누구의 시간으로 세는지 알려 드려요.";
  },
  emptyPeople: "아직 아무도 세지 않았어요. 문득 떠오른 사람이 있다면 그 사람부터요.",
  emptyMoments: "아직 아무것도 세지 않았어요. 미뤄 둔 일 하나부터 적어 봐요.",
  emptyMarriage: "목표 나이를 정하면 남은 기회를 세어 드려요.",
};

/* ---- English ---- */

const CALM_EN: ToneCopy = {
  label: "Plainly",
  description: "Treats the numbers as material for planning.",
  greeting: "Count it up, then settle on just the next plan.",
  meetingLabel: "Times you can still meet",
  momentLabel: "Times you can still do it",
  lifeLabel: "Time ahead",
  marriageLabel: "People you can still meet",
  meetingSentence: (name, count) => `You'll see ${name} ${count} more times. Set the next date ahead of time.`,
  momentSentence: (title, count) => `${title}: ${count} more times.`,
  marriageSentence: (targetAge, count) => `${count} chances to meet someone new before you turn ${targetAge}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Counted by your own time.";
    if (limitedBy === "them") return `Counted by ${name}'s time.`;
    if (limitedBy === "both") return "Your two times run about the same.";
    if (limitedBy === "horizon") return "Counted up to the date you set.";
    return "Add both ages and we'll show whose time it's counted by.";
  },
  emptyPeople: "Start with one person you see often.",
  emptyMoments: "Write down one thing you'd like to do this year.",
  emptyMarriage: "Pick a target age, and we'll count toward it.",
};

const WARM_EN: ToneCopy = {
  label: "Warmly",
  description: "Brings to mind the people and moments behind the numbers.",
  greeting: "If a face comes to mind today, send a happy hello.",
  meetingLabel: "Days you still get together",
  momentLabel: "Moments still ahead of you",
  lifeLabel: "The time you've been given",
  marriageLabel: "Meetings still to come",
  meetingSentence: (name, count) =>
    `Still ${count} more times to sit down with ${name}. Already looking forward to the next one.`,
  momentSentence: (title, count) => `${title}, ${count} more times. Have fun with this one.`,
  marriageSentence: (targetAge, count) =>
    `${count} new people to meet before you turn ${targetAge}. One of them is all it takes.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Counted by your own time. Share one more laugh while you're together.";
    if (limitedBy === "them") return `Counted by ${name}'s time. A call today would be happy news.`;
    if (limitedBy === "both") return "Your two times walk along side by side.";
    if (limitedBy === "horizon") return "Counted all the days together, up to the date you chose.";
    return "Add both ages and we'll show whose time it's counted by.";
  },
  emptyPeople: "Start with someone who's been on your mind lately.",
  emptyMoments: "Write down one thing that makes you excited just thinking about it.",
  emptyMarriage: "Even the days of waiting for someone can be counted.",
};

const AWARE_EN: ToneCopy = {
  label: "Clearly",
  description: "Makes it plain that what's left is finite.",
  greeting: "Counted out, it's fewer than you'd think.",
  meetingLabel: "Meetings left",
  momentLabel: "Times left",
  lifeLabel: "Time left",
  marriageLabel: "Chances left",
  meetingSentence: (name, count) => `${count} more times across the table from ${name}.`,
  momentSentence: (title, count) => `${title}, ${count} more times.`,
  marriageSentence: (targetAge, count) => `${count} chances to meet someone new before you turn ${targetAge}.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Counted by your own time. It's shorter than you'd think.";
    if (limitedBy === "them") return `Counted by ${name}'s time. That's why a call today counts for more.`;
    if (limitedBy === "both") return "Your two times run almost side by side.";
    if (limitedBy === "horizon") return "The date you set comes first.";
    return "Add both ages and we'll show whose time it's counted by.";
  },
  emptyPeople: "No one counted yet. If someone just came to mind, start there.",
  emptyMoments: "Nothing counted yet. Start with something you've been putting off.",
  emptyMarriage: "Set a target age, and we'll count the chances.",
};

/* ---- 日本語 ---- */

const CALM_JA: ToneCopy = {
  label: "淡々と",
  description: "数字を計画の材料として扱います。",
  greeting: "数えてみて、次の約束をひとつ決めておけば十分です。",
  meetingLabel: "これから会える回数",
  momentLabel: "これからできる回数",
  lifeLabel: "これからの時間",
  marriageLabel: "これから出会える人",
  meetingSentence: (name, count) => `${name}とは、これから${count}回会えます。次の日にちは先に決めておきましょう。`,
  momentSentence: (title, count) => `「${title}」は、これから${count}回です。`,
  marriageSentence: (targetAge, count) => `${targetAge}歳までに、新しい人と出会う機会は${count}回です。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "自分の時間を基準に数えました。";
    if (limitedBy === "them") return `${name}の時間を基準に数えました。`;
    if (limitedBy === "both") return "二人の時間は、ほぼ同じように流れています。";
    if (limitedBy === "horizon") return "決めておいた日までを数えました。";
    return "年齢を入れると、誰の時間で数えたかをお知らせします。";
  },
  emptyPeople: "よく会う人を、まず一人書いておきましょう。",
  emptyMoments: "今年やってみたいことを、ひとつ書いておきましょう。",
  emptyMarriage: "目標の年齢を決めれば、落ち着いて数えてみます。",
};

const WARM_JA: ToneCopy = {
  label: "あたたかく",
  description: "数字の向こうにいる人やひとときを思い浮かべます。",
  greeting: "今日ふと浮かぶ顔があったら、うれしい連絡をひとつ送ってみましょう。",
  meetingLabel: "一緒に過ごせる日",
  momentLabel: "また味わえるひととき",
  lifeLabel: "わたしに与えられた時間",
  marriageLabel: "これからの出会い",
  meetingSentence: (name, count) =>
    `${name}と向かい合える日が、まだ${count}回もあります。次に会う日が、もう楽しみですね。`,
  momentSentence: (title, count) =>
    `「${title}」を、まだ${count}回楽しめます。今回の一回も、思いきり楽しみましょう。`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}歳までに、新しい出会いが${count}回待っています。そのなかの一人で十分です。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "自分の時間を基準に数えました。そばにいるうちに、もう一度笑いかけてあげてください。";
    if (limitedBy === "them")
      return `${name}の時間を基準に数えました。今日の電話一本が、うれしい知らせになるはずです。`;
    if (limitedBy === "both") return "二人の時間が、並んで歩いていきます。";
    if (limitedBy === "horizon") return "決めておいたその日まで、一緒に過ごせる日を数えました。";
    return "年齢を入れると、誰の時間で数えたかをお知らせします。";
  },
  emptyPeople: "このごろよく思い出す人を、一人書いてみましょう。",
  emptyMoments: "考えるだけでわくわくすることを、ひとつ書いてみましょう。",
  emptyMarriage: "いつか出会う人を待つ日々も、数えてみましょう。",
};

const AWARE_JA: ToneCopy = {
  label: "はっきりと",
  description: "残りが有限であることをはっきり示します。",
  greeting: "数えてみると、思ったより少ないものです。",
  meetingLabel: "残りの再会",
  momentLabel: "残りの回数",
  lifeLabel: "残りの時間",
  marriageLabel: "残りの機会",
  meetingSentence: (name, count) => `${name}と向かい合える日は、あと${count}回です。`,
  momentSentence: (title, count) => `「${title}」は、あと${count}回です。`,
  marriageSentence: (targetAge, count) => `${targetAge}歳までに新しく出会う機会は、あと${count}回です。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "この数は、自分の時間に合わせて数えました。思ったより短いですね。";
    if (limitedBy === "them")
      return `この数は、${name}の時間に合わせて数えました。だから今日の連絡一本が、いっそう大きいんです。`;
    if (limitedBy === "both") return "二人の時間は、ほとんど並んで流れています。";
    if (limitedBy === "horizon") return "決めておいたその日のほうが、先に来ます。";
    return "年齢を入れると、誰の時間で数えるかをお知らせします。";
  },
  emptyPeople: "まだ誰も数えていません。ふと浮かんだ人がいたら、その人から。",
  emptyMoments: "まだ何も数えていません。後回しにしていることを、ひとつ書いてみましょう。",
  emptyMarriage: "目標の年齢を決めると、残りの機会を数えます。",
};

/* ---- Español ---- */

const CALM_ES: ToneCopy = {
  label: "Con serenidad",
  description: "Trata los números como material para planificar.",
  greeting: "Cuenta lo que queda y fija solo la próxima cita.",
  meetingLabel: "Encuentros por delante",
  momentLabel: "Veces que aún puedes hacerlo",
  lifeLabel: "Tiempo por delante",
  marriageLabel: "Personas que aún puedes conocer",
  meetingSentence: (name, count) => `Con ${name} quedan ${count} encuentros. Fija ya la próxima fecha.`,
  momentSentence: (title, count) => `${title}: ${count} veces más.`,
  marriageSentence: (targetAge, count) =>
    `Hasta los ${targetAge}, quedan ${count} ocasiones de conocer a alguien nuevo.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Contado según tu tiempo.";
    if (limitedBy === "them") return `Contado según el tiempo de ${name}.`;
    if (limitedBy === "both") return "Los dos tiempos corren parecidos.";
    if (limitedBy === "horizon") return "Contado hasta la fecha que elegiste.";
    return "Con las edades, te diremos según qué tiempo se cuenta.";
  },
  emptyPeople: "Empieza por alguien a quien ves a menudo.",
  emptyMoments: "Anota una cosa que quieras hacer este año.",
  emptyMarriage: "Elige una edad y lo contamos con calma.",
};

const WARM_ES: ToneCopy = {
  label: "Con ternura",
  description: "Hace pensar en las personas y los momentos detrás de los números.",
  greeting: "Si hoy te viene alguien a la cabeza, mándale un mensaje bonito.",
  meetingLabel: "Días para compartir",
  momentLabel: "Momentos que aún te esperan",
  lifeLabel: "El tiempo que se te ha dado",
  marriageLabel: "Encuentros por venir",
  meetingSentence: (name, count) =>
    `Todavía quedan ${count} veces para sentarte frente a ${name}. Ya dan ganas de que llegue la próxima.`,
  momentSentence: (title, count) => `${title}: todavía ${count} veces más. Disfruta esta con ganas.`,
  marriageSentence: (targetAge, count) =>
    `Hasta los ${targetAge}, te esperan ${count} encuentros nuevos. Con una sola persona basta.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Contado según tu tiempo. Cuando estés cerca, ríete un poco más.";
    if (limitedBy === "them") return `Contado según el tiempo de ${name}. Una llamada hoy será una buena noticia.`;
    if (limitedBy === "both") return "Los dos tiempos van de la mano.";
    if (limitedBy === "horizon") return "Contamos los días buenos hasta la fecha que elegiste.";
    return "Con las edades, te diremos según qué tiempo contamos.";
  },
  emptyPeople: "Empieza por alguien que te venga a la cabeza estos días.",
  emptyMoments: "Anota algo que te ilusione solo con pensarlo.",
  emptyMarriage: "Los días de espera hasta conocer a alguien también se pueden contar.",
};

const AWARE_ES: ToneCopy = {
  label: "Con claridad",
  description: "Deja claro que lo que queda es finito.",
  greeting: "Al contarlas, son menos de lo que parecía.",
  meetingLabel: "Encuentros restantes",
  momentLabel: "Veces restantes",
  lifeLabel: "Tiempo restante",
  marriageLabel: "Oportunidades restantes",
  meetingSentence: (name, count) => `Te quedan ${count} veces para sentarte frente a ${name}.`,
  momentSentence: (title, count) => `${title}: quedan ${count}.`,
  marriageSentence: (targetAge, count) => `Hasta los ${targetAge}, quedan ${count} ocasiones de conocer a alguien.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "Contado según tu tiempo. Es más corto de lo que parece.";
    if (limitedBy === "them") return `Contado según el tiempo de ${name}. Por eso una llamada hoy pesa tanto.`;
    if (limitedBy === "both") return "Los dos tiempos corren casi a la par.";
    if (limitedBy === "horizon") return "La fecha que elegiste llega antes.";
    return "Con las edades, te diremos según qué tiempo se cuenta.";
  },
  emptyPeople: "Aún no has contado a nadie. Si alguien te vino a la cabeza, empieza por esa persona.",
  emptyMoments: "Aún no has contado nada. Empieza por algo que llevas tiempo aplazando.",
  emptyMarriage: "Elige una edad y contamos las ocasiones que quedan.",
};

/* ---- 中文 ---- */

const CALM_ZH: ToneCopy = {
  label: "平静地",
  description: "把数字当作规划的材料。",
  greeting: "数一数，再把下一次见面定下来，就够了。",
  meetingLabel: "往后能见面的次数",
  momentLabel: "往后能做的次数",
  lifeLabel: "往后的时间",
  marriageLabel: "往后能遇见的人",
  meetingSentence: (name, count) => `往后和${name}还能见${count}次。下次的日子，先定下来。`,
  momentSentence: (title, count) => `${title}，往后还有${count}次。`,
  marriageSentence: (targetAge, count) => `到${targetAge}岁，认识新的人的机会还有${count}次。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "按你的时间来数的。";
    if (limitedBy === "them") return `按${name}的时间来数的。`;
    if (limitedBy === "both") return "你们俩的时间差不多。";
    if (limitedBy === "horizon") return "数到你定的那一天为止。";
    return "填上年龄，就告诉你是按谁的时间数的。";
  },
  emptyPeople: "先写下一个常见面的人就好。",
  emptyMoments: "写下一件今年想做的事。",
  emptyMarriage: "定好目标年龄，就慢慢数一数。",
};

const WARM_ZH: ToneCopy = {
  label: "温暖地",
  description: "让你想起数字背后的人与时光。",
  greeting: "今天想起了谁，就给谁发个消息吧。",
  meetingLabel: "还能一起过的日子",
  momentLabel: "还能再来的时候",
  lifeLabel: "属于我的时间",
  marriageLabel: "还会有的相遇",
  meetingSentence: (name, count) => `和${name}面对面坐的日子，还有${count}次呢。下一次已经开始盼了。`,
  momentSentence: (title, count) => `${title}，还能再来${count}次。这一次，也尽兴就好。`,
  marriageSentence: (targetAge, count) =>
    `到${targetAge}岁，还有${count}次新的相遇在等着。遇到一个人，就够了。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "按你的时间来数的。在身边的时候，多笑一笑就好。";
    if (limitedBy === "them") return `按${name}的时间来数的。今天打个电话，就是一件让人高兴的事。`;
    if (limitedBy === "both") return "你们俩的时间，并排走着。";
    if (limitedBy === "horizon") return "数到你定的那一天，一起的日子都在这里。";
    return "填上年龄，就告诉你是按谁的时间数的。";
  },
  emptyPeople: "最近常想起的人，先写一个吧。",
  emptyMoments: "写下一件想想就开心的事。",
  emptyMarriage: "等着那个人的日子，也可以数一数。",
};

const AWARE_ZH: ToneCopy = {
  label: "清醒地",
  description: "清楚地表明剩下的次数是有限的。",
  greeting: "数一数，比想的要少。",
  meetingLabel: "剩下的见面",
  momentLabel: "剩下的次数",
  lifeLabel: "剩下的时间",
  marriageLabel: "剩下的机会",
  meetingSentence: (name, count) => `和${name}面对面坐的日子，往后${count}次。`,
  momentSentence: (title, count) => `${title}，往后${count}次。`,
  marriageSentence: (targetAge, count) => `到${targetAge}岁，认识新的人的机会是${count}次。`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "这个数字按你的时间来数。比想的短吧。";
    if (limitedBy === "them") return `这个数字按${name}的时间来数。所以今天的一个电话，分量更重。`;
    if (limitedBy === "both") return "你们俩的时间，几乎并排走着。";
    if (limitedBy === "horizon") return "你定的那一天，会先到。";
    return "填上年龄，就告诉你按谁的时间来数。";
  },
  emptyPeople: "还没有数过谁。忽然想起了谁，就从那个人开始。",
  emptyMoments: "还什么都没数。先写下一件一直往后拖的事。",
  emptyMarriage: "定好目标年龄，就帮你数一数剩下的机会。",
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

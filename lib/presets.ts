import { defineCopy, tr } from "./i18n.ts";
import type { CalcFilter, Frequency, MomentHorizon } from "./types";

/*
 * 프리셋의 숫자(빈도·기간·비율)는 언어와 상관없이 하나다. 이름과 힌트만 언어별로 두고,
 * 화면을 그릴 때 함수로 합친다(언어는 렌더 시점에 정해지므로 모듈 상수로 둘 수 없다).
 * 언어별 목록은 숫자 목록과 순서가 같아야 한다.
 */

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface FilterPreset {
  label: string;
  hint: string;
  build: () => CalcFilter;
}

/**
 * 필터는 기본값으로 밀어 넣는 게 아니라 사용자가 조건을 직접 세우는 도구다.
 * 프리셋은 "이런 식으로 쓰면 된다"를 보여주는 출발점일 뿐, 값은 전부 수정 가능하다.
 */
const FILTER_SPECS: Omit<CalcFilter, "id" | "label" | "enabled">[] = [
  // 해마다 달라짐 — 20년 뒤 지금의 절반쯤에서 시작한다. 늘어나는 경우도 같은 칸에서 뒤의 값을 키우면 된다.
  { kind: "decay", ratePerYear: 1 - 0.5 ** (1 / 20), anchorYears: 20 },
  /*
   * 기후 프리셋.
   *
   * 컨셉이 처음부터 들었던 예("지구온난화로 서핑을 몇 번밖에 못 하게 되는 경우")를
   * 칩으로 만든 것이다. 다만 숫자는 예보가 아니라 **출발점**이다. 기후 모형은
   * 시나리오(얼마나 줄이느냐)에 따라 결과가 크게 갈리고, 지역마다도 다르다.
   * 그래서 고칠 수 있는 값으로 두고, 어떤 가정인지 힌트에 적어 둔다.
   */
  { kind: "window", mode: "only", fromYear: 0, toYear: 30 }, // 벚꽃이 사라짐
  { kind: "decay", ratePerYear: 0.03 }, // 눈이 줄어듦
  { kind: "decay", ratePerYear: 0.04 }, // 바다가 달라짐
  { kind: "window", mode: "only", fromYear: 0, toYear: 20 }, // 특정 기간만
  { kind: "window", mode: "except", fromYear: 1, toYear: 3 }, // 이 기간은 빼기
  { kind: "multiplier", factor: 0.8 }, // 빈도 조정
  { kind: "cap", maxTotal: 100 }, // 최대 횟수 제한
];

const FILTER_COPY = defineCopy<[label: string, hint: string][]>({
  ko: [
    ["해마다 달라짐", "지금 빈도와 N년 뒤의 빈도를 적으면 그 사이를 자연스럽게 잇습니다. 줄어드는 것도, 은퇴 후처럼 늘어나는 것도 여기서"],
    [
      "벚꽃이 사라짐",
      "온난화가 지금 속도로 이어질 때를 가정한 출발점입니다. 남부부터 개화가 불안정해지는 시점을 대략 30년 뒤로 잡았습니다. 지역과 시나리오에 따라 크게 달라지니 직접 조정하세요.",
    ],
    [
      "눈이 줄어듦",
      "겨울이 짧아지며 눈 오는 날이 매년 조금씩 줄어드는 가정. 스키·눈사람처럼 눈이 있어야 하는 일에 겁니다.",
    ],
    [
      "바다가 달라짐",
      "수온과 파도 조건이 나빠져 서핑·해수욕 같은 일이 해마다 줄어드는 가정. 컨셉이 처음 든 예가 이것입니다.",
    ],
    ["특정 기간만", "몸이 버티는 동안만 가능한 일. 지금부터 몇 년째까지만 센다"],
    ["이 기간은 빼기", "유학·파병·장기 프로젝트처럼 한동안 만나지 못하는 구간을 덜어낸다"],
    ["빈도 조정", "사정이 생겨 예상보다 덜(또는 더) 하게 될 것 같을 때 전체에 배수를 건다"],
    ["최대 횟수 제한", "무슨 일이 있어도 이 숫자를 넘지 않는다고 볼 때"],
  ],
  en: [
    ["Changes over the years", "Set how often now and how often N years from now; the years in between follow smoothly. Works for fewer, or more, like after retiring"],
    [
      "Cherry blossoms fade",
      "A starting point that assumes warming continues at today's pace. It puts blooming becoming unreliable, starting in warmer regions, about 30 years from now. This varies a lot by region and scenario, so adjust it yourself.",
    ],
    [
      "Less snow",
      "Assumes shorter winters bring a few fewer snowy days each year. Use it for things that need snow, like skiing or building snowmen.",
    ],
    [
      "The sea changes",
      "Assumes warmer water and poorer waves mean a little less surfing and swimming each year. This is the example the app started from.",
    ],
    ["Only for a while", "Things you can do only while your body allows. Counts from now up to a given year"],
    ["Skip a period", "Takes out a stretch when you can't meet, like studying abroad, deployment, or a long project"],
    ["Adjust frequency", "Applies a multiplier to everything when you'll likely do it less (or more) than planned"],
    ["Set a maximum", "When you're sure it won't go past this number, whatever happens"],
  ],
  ja: [
    ["年ごとに変わる", "いまの頻度とN年後の頻度を入れると、その間をなめらかにつなぎます。減る場合も、退職後のように増える場合も"],
    [
      "桜が見られなくなる",
      "温暖化が今のペースで続くと仮定した出発点です。暖かい地域から開花が不安定になる時期を、およそ30年後としました。地域やシナリオで大きく変わるので、ご自身で調整してください。",
    ],
    [
      "雪が減る",
      "冬が短くなり、雪の日が毎年少しずつ減るという仮定。スキーや雪だるまのように、雪がないとできないことに使います。",
    ],
    [
      "海が変わる",
      "水温や波の条件が悪くなり、サーフィンや海水浴が年々減るという仮定。このアプリが最初に思い描いた例です。",
    ],
    ["一定期間だけ", "体がもつうちにしかできないこと。今から何年目までだけを数えます"],
    ["この期間は除く", "留学・派遣・長期プロジェクトのように、しばらく会えない期間を差し引きます"],
    ["頻度を調整", "事情があって思ったより少なく（または多く）なりそうなとき、全体に倍率をかけます"],
    ["最大回数を決める", "何があってもこの回数は超えないと考えるとき"],
  ],
  es: [
    ["Cambia con los años", "Indica cuántas veces ahora y cuántas dentro de N años; los años intermedios se ajustan solos. Sirve para menos o para más, como tras jubilarse"],
    [
      "Los cerezos dejan de florecer",
      "Un punto de partida que supone que el calentamiento sigue al ritmo actual. Sitúa en unos 30 años el momento en que la floración se vuelve irregular, empezando por las zonas más cálidas. Varía mucho según la región y el escenario, así que ajústalo a tu gusto.",
    ],
    [
      "Menos nieve",
      "Supone inviernos más cortos y algunos días de nieve menos cada año. Para cosas que necesitan nieve, como esquiar o hacer muñecos de nieve.",
    ],
    [
      "El mar cambia",
      "Supone que el agua más cálida y las peores olas reducen cada año cosas como el surf o bañarse en el mar. Es el ejemplo del que nació la app.",
    ],
    ["Solo durante un tiempo", "Cosas que solo puedes hacer mientras el cuerpo aguante. Cuenta desde ahora hasta cierto año"],
    [
      "Excluir un periodo",
      "Descuenta una temporada en la que no podréis veros, como estudiar fuera, una misión o un proyecto largo",
    ],
    ["Ajustar frecuencia", "Aplica un multiplicador a todo cuando creas que lo harás menos (o más) de lo previsto"],
    ["Máximo de veces", "Cuando crees que, pase lo que pase, no superará esta cifra"],
  ],
  zh: [
    ["逐年变化", "填上现在的频率和N年后的频率，中间的年份会平滑衔接。减少或像退休后那样增加都可以"],
    [
      "樱花渐渐消失",
      "假设变暖按现在的速度持续下去的起点。把温暖地区开花开始变得不稳定的时间大致定在30年后。不同地区和情景差别很大，请自行调整。",
    ],
    ["雪越来越少", "假设冬天变短，下雪的日子每年略少一些。适用于滑雪、堆雪人这类需要雪的事。"],
    ["大海在改变", "假设水温和海浪条件变差，冲浪、海水浴这类事每年减少。这正是这个应用最初想到的例子。"],
    ["仅限一段时间", "只有身体吃得消时才能做的事。只数从现在到第几年"],
    ["扣除这段时间", "扣掉一段见不到面的时间，比如留学、外派或长期项目"],
    ["调整频率", "情况有变、可能比预想少（或多）时，给整体乘上一个倍数"],
    ["设定次数上限", "认为无论如何都不会超过这个数时"],
  ],
});

/** 렌더 중에 부른다. */
export function filterPresets(): FilterPreset[] {
  return tr(FILTER_COPY).map(([label, hint], i) => ({
    label,
    hint,
    build: () => ({ id: newId(), label, enabled: true, ...FILTER_SPECS[i] }),
  }));
}

export interface MomentPreset {
  title: string;
  emoji: string;
  frequency: Frequency;
  horizon: MomentHorizon;
  /** 화면에 띄우는 안내 문구. 사용자의 메모(note)와 다른 것이며 저장되지 않는다. */
  hint?: string;
}

const MOMENT_SPECS: Omit<MomentPreset, "title" | "hint">[] = [
  { emoji: "🌸", frequency: { count: 1, unit: "year" }, horizon: { kind: "life" } },
  { emoji: "🌊", frequency: { count: 1, unit: "year" }, horizon: { kind: "life" } },
  { emoji: "✈️", frequency: { count: 1, unit: "year" }, horizon: { kind: "untilAge", age: 75 } },
  { emoji: "🏠", frequency: { count: 2, unit: "year" }, horizon: { kind: "life" } },
  { emoji: "📖", frequency: { count: 1, unit: "month" }, horizon: { kind: "life" } },
  { emoji: "🏄", frequency: { count: 4, unit: "year" }, horizon: { kind: "untilAge", age: 70 } },
  { emoji: "🎸", frequency: { count: 1, unit: "year" }, horizon: { kind: "years", years: 15 } },
  { emoji: "❄️", frequency: { count: 5, unit: "year" }, horizon: { kind: "life" } },
  { emoji: "🐕", frequency: { count: 7, unit: "week" }, horizon: { kind: "years", years: 12 } },
  { emoji: "🏊", frequency: { count: 2, unit: "week" }, horizon: { kind: "untilAge", age: 80 } },
  { emoji: "🪚", frequency: { count: 2, unit: "month" }, horizon: { kind: "untilAge", age: 75 } },
];

const MOMENT_COPY = defineCopy<[title: string, hint?: string][]>({
  ko: [
    ["벚꽃 보기"],
    ["여름 바다"],
    ["해외여행"],
    ["명절에 본가 가기"],
    ["책 한 권 읽기"],
    ["서핑", "파도 조건이 나빠질 것 같다면 해마다 달라짐 조건으로 「20년 뒤엔 몇 번쯤」을 적어 보세요."],
    ["좋아하는 밴드 공연"],
    ["눈 내리는 날"],
    ["강아지 산책"],
    ["수영"],
    ["만들기", "공방·작업실처럼 몸을 쓰는 일은 언제까지 할 수 있을지도 같이 정해 보세요."],
  ],
  en: [
    ["Seeing cherry blossoms"],
    ["Summer by the sea"],
    ["A trip abroad"],
    ["Going home for the holidays"],
    ["Reading a book"],
    ["Surfing", "As the waves get worse, try adding the “Fewer each year” filter too."],
    ["Seeing my favorite band live"],
    ["Snowy days"],
    ["Walking the dog"],
    ["Swimming"],
    ["Making things", "For hands-on work like a workshop or studio, also decide how long you'll be able to keep at it."],
  ],
  ja: [
    ["お花見"],
    ["夏の海"],
    ["海外旅行"],
    ["帰省"],
    ["本を一冊読む"],
    ["サーフィン", "波の条件が悪くなる分、「年ごとに減る」フィルターも一緒にかけてみてください。"],
    ["好きなバンドのライブ"],
    ["雪の降る日"],
    ["犬の散歩"],
    ["水泳"],
    ["ものづくり", "工房や作業場のように体を使うことは、いつまで続けられそうかも一緒に決めてみてください。"],
  ],
  es: [
    ["Ver los cerezos en flor"],
    ["El mar en verano"],
    ["Viaje al extranjero"],
    ["Volver a casa en las fiestas"],
    ["Leer un libro"],
    ["Surf", "Como las olas irán a peor, prueba a añadir también el filtro «Menos cada año»."],
    ["Concierto de mi grupo favorito"],
    ["Días de nieve"],
    ["Pasear al perro"],
    ["Nadar"],
    ["Crear con las manos", "En trabajos físicos, como un taller, decide también hasta cuándo podrás seguir haciéndolo."],
  ],
  zh: [
    ["赏樱花"],
    ["夏天的海边"],
    ["出国旅行"],
    ["过节回家"],
    ["读完一本书"],
    ["冲浪", "海浪条件会变差，不妨同时加上“逐年减少”筛选。"],
    ["喜欢的乐队的演出"],
    ["下雪的日子"],
    ["遛狗"],
    ["游泳"],
    ["动手做东西", "像工坊、工作室这样要动手出力的事，也一起想想能做到什么时候。"],
  ],
});

/** 렌더 중에 부른다. */
export function momentPresets(): MomentPreset[] {
  return tr(MOMENT_COPY).map(([title, hint], i) => ({ title, hint, ...MOMENT_SPECS[i] }));
}

export interface RelationPreset {
  relation: string;
  emoji: string;
  frequency: Frequency;
  hoursPerMeeting?: number;
  /** 고르면 성장 캘린더까지 한 번에 켜지는 프리셋(자녀). */
  withGrowth?: boolean;
}

const RELATION_SPECS: Omit<RelationPreset, "relation">[] = [
  { emoji: "🌷", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 6 },
  { emoji: "🌳", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 6 },
  { emoji: "🫖", frequency: { count: 2, unit: "year" }, hoursPerMeeting: 8 },
  { emoji: "🧩", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 5 },
  { emoji: "🕊️", frequency: { count: 5, unit: "week" }, hoursPerMeeting: 4 },
  { emoji: "🧸", frequency: { count: 6, unit: "week" }, hoursPerMeeting: 3, withGrowth: true },
  { emoji: "🍻", frequency: { count: 1, unit: "quarter" }, hoursPerMeeting: 4 },
];

const RELATION_COPY = defineCopy<string[]>({
  ko: ["어머니", "아버지", "조부모", "형제·자매", "배우자·연인", "자녀", "가까운 친구"],
  en: ["Mom", "Dad", "Grandparents", "Siblings", "Partner", "Child", "Close friend"],
  ja: ["お母さん", "お父さん", "祖父母", "きょうだい", "パートナー", "子ども", "親友"],
  es: ["Mamá", "Papá", "Abuelos", "Hermanos", "Pareja", "Hijos", "Amistad cercana"],
  zh: ["妈妈", "爸爸", "祖父母", "兄弟姐妹", "伴侣", "孩子", "好友"],
});

/** 렌더 중에 부른다. */
export function relationPresets(): RelationPreset[] {
  return tr(RELATION_COPY).map((relation, i) => ({ relation, ...RELATION_SPECS[i] }));
}

type FrequencyChip = { label: string; frequency: Frequency };

function chips(frequencies: Frequency[], labels: string[]): FrequencyChip[] {
  return labels.map((label, i) => ({ label, frequency: frequencies[i] }));
}

/** 저녁 식사 빈도 칩. 집집마다 다르니 출발점만 준다. */
const DINNER_FREQUENCIES: Frequency[] = [
  { count: 7, unit: "week" },
  { count: 5, unit: "week" },
  { count: 3, unit: "week" },
  { count: 1, unit: "week" },
];

const DINNER_COPY = defineCopy<string[]>({
  ko: ["매일", "주 5회", "주 3회", "주 1회"],
  en: ["Every day", "5 times a week", "3 times a week", "Once a week"],
  ja: ["毎日", "週5回", "週3回", "週1回"],
  es: ["Todos los días", "5 veces por semana", "3 veces por semana", "1 vez por semana"],
  zh: ["每天", "每周5次", "每周3次", "每周1次"],
});

/** 렌더 중에 부른다. */
export function dinnerPresets(): FrequencyChip[] {
  return chips(DINNER_FREQUENCIES, tr(DINNER_COPY));
}

/** 결혼 계획에서 "새로운 사람을 얼마나 자주 만나는지" 고르는 칩. */
const MEETING_FREQUENCIES: Frequency[] = [
  { count: 1, unit: "week" },
  { count: 2, unit: "month" },
  { count: 1, unit: "month" },
  { count: 1, unit: "quarter" },
  { count: 1, unit: "year" },
];

const MEETING_COPY = defineCopy<string[]>({
  ko: ["주 1회", "월 2회", "월 1회", "분기 1회", "연 1회"],
  en: ["Once a week", "Twice a month", "Once a month", "Once a quarter", "Once a year"],
  ja: ["週1回", "月2回", "月1回", "3か月に1回", "年1回"],
  es: ["1 vez por semana", "2 veces al mes", "1 vez al mes", "1 vez cada tres meses", "1 vez al año"],
  zh: ["每周1次", "每月2次", "每月1次", "每季度1次", "每年1次"],
});

/** 렌더 중에 부른다. */
export function meetingFrequencyPresets(): FrequencyChip[] {
  return chips(MEETING_FREQUENCIES, tr(MEETING_COPY));
}

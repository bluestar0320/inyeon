"use client";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 「헷갈리세요?」 — "N년 뒤엔 몇 번쯤"을 정하기 어려울 때만 펼쳐 보는 도움말.
 *
 * 숫자는 원문에서 확인한 것만 쓴다(출처를 함께 적는다).
 *   노인실태조사: 보건복지부·한국보건사회연구원 「2023년도 노인실태조사」, 65세 이상 대면 왕래 빈도
 *     〈표 5-15〉 가장 많이 접촉하는 비동거 자녀: 주 1회 이상 22.7%, 월 1회 미만·만나지 않음 26.6%
 *     〈표 5-18〉 비동거 손자녀: 월 1회 미만·만나지 않음 59.9%
 *     〈표 5-20〉 형제자매·친인척: 월 1회 미만·만나지 않음 78.7%
 *     〈표 5-22〉 친구·이웃·지인: 주 1회 이상 59.7%
 *   기상청 보도자료 「기후변화가 바꾼 우리나라 사계절과 24절기!」(2021.4.27):
 *     1912~1940 대비 1991~2020 여름 20일 길어짐·겨울 22일 짧아짐, 봄 시작 17일 빨라짐,
 *     2021년 서울 벚꽃 관측 이래 가장 이른 개화
 * 통계가 없는 관계(배우자·자녀 등)에는 숫자 대신 떠올려 보는 질문만 둔다.
 */

export type HintKey = "parent" | "grandparent" | "sibling" | "friend" | "season" | "person" | "moment";

const EMOJI_HINT: Record<string, HintKey> = {
  "🌷": "parent",
  "🌳": "parent",
  "🫖": "grandparent",
  "🧩": "sibling",
  "🍻": "friend",
  "🌸": "season",
  "❄️": "season",
  "🌊": "season",
  "🏄": "season",
};

export function hintFor(emoji: string | undefined, kind: "person" | "moment"): HintKey {
  return (emoji && EMOJI_HINT[emoji]) || kind;
}

const SURVEY = {
  ko: "보건복지부·한국보건사회연구원 「2023년도 노인실태조사」",
  en: "Ministry of Health and Welfare · KIHASA, 2023 Survey of Older Koreans",
  ja: "韓国保健福祉部・韓国保健社会研究院「2023年度高齢者実態調査」",
  es: "Ministerio de Salud y Bienestar de Corea · KIHASA, Encuesta de Personas Mayores 2023",
  zh: "韩国保健福祉部·韩国保健社会研究院《2023年度老年人实况调查》",
};
const KMA = {
  ko: "기상청 「기후변화가 바꾼 우리나라 사계절과 24절기」(2021)",
  en: "Korea Meteorological Administration press release (2021)",
  ja: "韓国気象庁 報道資料(2021)",
  es: "Administración Meteorológica de Corea, nota de prensa (2021)",
  zh: "韩国气象厅 新闻稿(2021)",
};

type Tip = { body: string; source?: string };

const COPY = defineCopy<{ toggle: string; tips: Record<HintKey, Tip>; sourceLabel: string }>({
  ko: {
    toggle: "헷갈리세요?",
    sourceLabel: "출처",
    tips: {
      parent: { body: "65세 이상 부모님 중 가장 자주 보는 자녀와도 한 달에 한 번을 못 만나는 경우가 26.6%, 주 1회 이상 만나는 경우는 22.7%예요. 20년 뒤 부모님의 모습을 떠올려 보세요.", source: `${SURVEY.ko} 〈표 5-15〉` },
      grandparent: { body: "65세 이상 어르신의 59.9%는 따로 사는 손주를 한 달에 한 번도 못 만나요.", source: `${SURVEY.ko} 〈표 5-18〉` },
      sibling: { body: "65세 이상 10명 중 8명(78.7%)은 형제자매·친척을 한 달에 한 번도 못 만나요.", source: `${SURVEY.ko} 〈표 5-20〉` },
      friend: { body: "65세 이상의 59.7%는 친구·이웃을 주 1회 이상 만나요. 나이 들수록 가까이 사는 친구를 더 자주 보게 돼요.", source: `${SURVEY.ko} 〈표 5-22〉` },
      season: { body: "지난 100여 년 사이 우리나라 여름은 20일 길어지고 겨울은 22일 짧아졌어요. 봄은 17일 일찍 오고, 2021년 서울 벚꽃은 관측 이래 가장 일찍 폈어요.", source: KMA.ko },
      person: { body: "20년 뒤 두 사람이 사는 곳, 하는 일, 체력을 한 장면으로 떠올려 보세요. 그때 1년에 몇 번쯤 마주 앉을까요?" },
      moment: { body: "20년 뒤의 나를 떠올려 보세요. 시간, 체력, 사는 곳이 달라져도 1년에 몇 번쯤 하고 있을까요?" },
    },
  },
  en: {
    toggle: "Not sure?",
    sourceLabel: "Source",
    tips: {
      parent: { body: "Among Koreans 65+, 26.6% see even their most-visited child less than once a month; 22.7% see them weekly or more. Picture your parent 20 years from now.", source: `${SURVEY.en}, Table 5-15` },
      grandparent: { body: "59.9% of Koreans 65+ see grandchildren who live apart less than once a month.", source: `${SURVEY.en}, Table 5-18` },
      sibling: { body: "8 in 10 Koreans 65+ (78.7%) see siblings and relatives less than once a month.", source: `${SURVEY.en}, Table 5-20` },
      friend: { body: "59.7% of Koreans 65+ see friends or neighbours at least weekly. Friends who live nearby become the people you see most.", source: `${SURVEY.en}, Table 5-22` },
      season: { body: "Over the past century Korea's summers grew 20 days longer and winters 22 days shorter. Spring arrives 17 days earlier, and in 2021 Seoul's cherry blossoms opened the earliest on record.", source: KMA.en },
      person: { body: "Picture where you both live, what you do and how you feel 20 years from now. How many times a year would you sit down together?" },
      moment: { body: "Picture yourself 20 years from now — your time, energy and home. How many times a year would you still do this?" },
    },
  },
  ja: {
    toggle: "迷いますか？",
    sourceLabel: "出典",
    tips: {
      parent: { body: "韓国の65歳以上の親のうち、いちばんよく会う子どもとも月1回未満の人が26.6%、週1回以上会う人は22.7%です。20年後の親の姿を思い浮かべてみてください。", source: `${SURVEY.ja}〈表5-15〉` },
      grandparent: { body: "韓国の65歳以上の59.9%は、離れて暮らす孫と月に1回も会えていません。", source: `${SURVEY.ja}〈表5-18〉` },
      sibling: { body: "韓国の65歳以上の10人に8人(78.7%)は、きょうだい・親戚と月に1回も会えていません。", source: `${SURVEY.ja}〈表5-20〉` },
      friend: { body: "韓国の65歳以上の59.7%は、友人・近所の人と週1回以上会っています。年をとるほど近くの友人と会う回数が増えます。", source: `${SURVEY.ja}〈表5-22〉` },
      season: { body: "この100年ほどで韓国の夏は20日長く、冬は22日短くなりました。春は17日早く訪れ、2021年のソウルの桜は観測史上最も早く咲きました。", source: KMA.ja },
      person: { body: "20年後の二人の住まい、仕事、体力をひとつの場面として思い浮かべてみてください。そのころ年に何回会えるでしょう？" },
      moment: { body: "20年後の自分を思い浮かべてみてください。時間や体力、住む場所が変わっても、年に何回くらい続けているでしょう？" },
    },
  },
  es: {
    toggle: "¿Dudas?",
    sourceLabel: "Fuente",
    tips: {
      parent: { body: "En Corea, el 26,6 % de los padres de 65+ ve a su hijo más cercano menos de una vez al mes; el 22,7 % lo ve cada semana o más. Imagina a tu madre o padre dentro de 20 años.", source: `${SURVEY.es}, tabla 5-15` },
      grandparent: { body: "El 59,9 % de los coreanos de 65+ ve a los nietos que viven aparte menos de una vez al mes.", source: `${SURVEY.es}, tabla 5-18` },
      sibling: { body: "8 de cada 10 coreanos de 65+ (78,7 %) ven a hermanos y familiares menos de una vez al mes.", source: `${SURVEY.es}, tabla 5-20` },
      friend: { body: "El 59,7 % de los coreanos de 65+ ve a amigos o vecinos al menos una vez por semana. Los amigos cercanos acaban siendo a quienes más ves.", source: `${SURVEY.es}, tabla 5-22` },
      season: { body: "En el último siglo, los veranos en Corea se alargaron 20 días y los inviernos se acortaron 22. La primavera llega 17 días antes y en 2021 los cerezos de Seúl florecieron antes que nunca.", source: KMA.es },
      person: { body: "Imagina dónde viviréis, a qué os dedicaréis y cómo estaréis dentro de 20 años. ¿Cuántas veces al año os sentaríais juntos?" },
      moment: { body: "Imagínate dentro de 20 años: tu tiempo, tu energía, tu casa. ¿Cuántas veces al año seguirías haciendo esto?" },
    },
  },
  zh: {
    toggle: "拿不准？",
    sourceLabel: "出处",
    tips: {
      parent: { body: "韩国65岁以上的父母中，与最常见面的子女也每月见不到一次的占26.6%，每周至少见一次的占22.7%。想一想20年后的父母吧。", source: `${SURVEY.zh}〈表5-15〉` },
      grandparent: { body: "韩国65岁以上老人中有59.9%，与分开住的孙辈每月见不到一次。", source: `${SURVEY.zh}〈表5-18〉` },
      sibling: { body: "韩国65岁以上的人中，每10人有8人(78.7%)与兄弟姐妹、亲戚每月见不到一次。", source: `${SURVEY.zh}〈表5-20〉` },
      friend: { body: "韩国65岁以上的人中有59.7%每周至少见一次朋友或邻居。年纪越大，越常见的是住在附近的朋友。", source: `${SURVEY.zh}〈表5-22〉` },
      season: { body: "过去一百多年里，韩国的夏天长了20天，冬天短了22天。春天早来17天，2021年首尔樱花开得是有观测以来最早的。", source: KMA.zh },
      person: { body: "想象20年后你们住在哪里、做什么、身体如何。那时一年能见几次面？" },
      moment: { body: "想象20年后的自己——时间、体力、住处。那时一年还会做几次？" },
    },
  },
});

export default function DecayHint({ hint }: { hint: HintKey }) {
  const t = tr(COPY);
  const tip = t.tips[hint];
  return (
    <details className="w-full">
      <summary className="inline-flex min-h-9 cursor-pointer items-center text-xs font-medium text-ink-600 underline underline-offset-2">
        {t.toggle}
      </summary>
      <div className="mt-1 rounded-xl bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-800">
        <p>{tip.body}</p>
        {tip.source && (
          <p className="mt-1 text-[11px] text-ink-600">
            {t.sourceLabel}: {tip.source}
          </p>
        )}
      </div>
    </details>
  );
}

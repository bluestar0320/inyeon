/*
 * 읽을거리. 이 앱이 세는 것들(부모님, 손주, 친구, 벚꽃, 눈)을 실제 통계로 풀어 쓴 짧은 글.
 *
 * 숫자는 원문에서 확인한 것만 쓴다.
 *   노인실태조사 = 보건복지부·한국보건사회연구원 「2023년도 노인실태조사」(65세 이상 10,078명),
 *                 제5장 〈표 5-15·5-16·5-18·5-20·5-22〉. "왕래"는 직접 만나는 것, "연락"은 전화·문자 등.
 *   기상청 2021 = 기상청 보도자료 「기후변화가 바꾼 우리나라 사계절과 24절기!」(2021.4.27),
 *                 1912~1940년과 1991~2020년 비교(6개 지점).
 * 한국어·영어·일본어로 쓴다(lib/docLang.ts). 세 언어의 숫자는 반드시 같아야 한다.
 */
import type { DocLang } from "./docLang.ts";

interface ReadText {
  title: string;
  summary: string;
  body: string[];
  sources: string[];
}

export interface Read {
  slug: string;
  text: Record<DocLang, ReadText>;
}

const SURVEY: Record<DocLang, string> = {
  ko: "보건복지부·한국보건사회연구원, 「2023년도 노인실태조사」",
  en: "Ministry of Health and Welfare · Korea Institute for Health and Social Affairs, 2023 Survey of Older Koreans",
  ja: "韓国保健福祉部・韓国保健社会研究院「2023年度高齢者実態調査」",
};
const KMA: Record<DocLang, string> = {
  ko: "기상청 보도자료, 「기후변화가 바꾼 우리나라 사계절과 24절기!」(2021.4.27)",
  en: "Korea Meteorological Administration press release, “How climate change reshaped Korea’s four seasons and 24 solar terms” (27 Apr 2021)",
  ja: "韓国気象庁 報道資料「気候変動が変えた韓国の四季と二十四節気」(2021年4月27日)",
};
const tables = (lang: DocLang, list: string) =>
  lang === "ko" ? `${SURVEY.ko} ${list}` : lang === "ja" ? `${SURVEY.ja} ${list}` : `${SURVEY.en}, ${list}`;

export const READS: Read[] = [
  {
    slug: "after-65",
    text: {
      ko: {
        title: "65세가 넘으면, 누구를 가장 자주 만날까",
        summary: "자녀보다 친구다. 65세 이상 1만 명에게 물은 만남의 빈도.",
        body: [
          "2023년 노인실태조사는 65세 이상 1만여 명에게 가족과 지인을 얼마나 자주 직접 만나는지 물었습니다.",
          "가장 자주 만나는 사람은 자녀가 아니었습니다. 친구·이웃·지인을 주 1회 이상 만난다는 사람이 59.7%로, 가장 많이 만나는 자녀와 주 1회 이상 왕래한다는 22.7%의 두 배가 넘습니다.",
          "자녀와는 대신 연락을 자주 합니다. 가장 자주 연락하는 자녀와 주 1회 이상 연락한다는 사람이 64.9%입니다. 얼굴을 보는 일과 목소리를 듣는 일이 따로 움직이는 셈입니다.",
          "형제자매·친척은 더 멀어집니다. 한 달에 한 번도 만나지 않는다는 사람이 78.7%입니다.",
          "앞으로 몇 번 더 만날지 적을 때, 20년 뒤 그 사람이 어디에 살고 누구와 가까이 지낼지를 함께 떠올려 보세요. 가까이 사는 사람이 결국 자주 보는 사람이 됩니다.",
        ],
        sources: [tables("ko", "〈표 5-15〉〈표 5-16〉〈표 5-20〉〈표 5-22〉")],
      },
      en: {
        title: "After 65, who do we see most often?",
        summary: "Friends, not children. How often 10,000 Koreans aged 65+ meet the people in their lives.",
        body: [
          "Korea’s 2023 Survey of Older Koreans asked more than 10,000 people aged 65 and over how often they meet family and friends in person.",
          "The people they see most are not their children. 59.7% meet friends, neighbours or acquaintances at least once a week — more than twice the 22.7% who see even their most-visited child that often.",
          "With children, they talk instead: 64.9% are in touch with their most-contacted child at least weekly. Seeing a face and hearing a voice move separately.",
          "Siblings and relatives drift further away: 78.7% see them less than once a month.",
          "When you write down how many more times you’ll meet someone, picture where they will live in 20 years and who will be close by. The people nearby become the people you see.",
        ],
        sources: [tables("en", "Tables 5-15, 5-16, 5-20, 5-22")],
      },
      ja: {
        title: "65歳を過ぎたら、いちばんよく会うのは誰？",
        summary: "子どもより友人。韓国の65歳以上1万人に聞いた、会う頻度。",
        body: [
          "韓国の2023年高齢者実態調査は、65歳以上の1万人あまりに、家族や知人と直接どれくらい会っているかを尋ねました。",
          "いちばんよく会うのは子どもではありませんでした。友人・近所の人・知人と週1回以上会う人は59.7%で、いちばんよく会う子どもと週1回以上行き来する22.7%の2倍を超えます。",
          "子どもとは、そのかわりに連絡をよく取ります。いちばんよく連絡する子どもと週1回以上連絡を取る人は64.9%です。顔を見ることと声を聞くことは、別々に動いているのです。",
          "きょうだい・親戚とはさらに遠くなります。月に1回も会わない人が78.7%です。",
          "これから何回会えるかを書くとき、20年後にその人がどこに住み、誰の近くで暮らしているかを一緒に思い浮かべてみてください。近くに住む人が、結局いちばんよく会う人になります。",
        ],
        sources: [tables("ja", "〈表5-15〉〈表5-16〉〈表5-20〉〈表5-22〉")],
      },
    },
  },
  {
    slug: "parents",
    text: {
      ko: {
        title: "부모님과 남은 만남을 세어 보면",
        summary: "한 달에 한 번이면 20년에 240번. 그런데 네 명 중 한 명은 그보다 드물다.",
        body: [
          "부모님이 60세이고 예상 수명이 80세라면, 한 달에 한 번 찾아뵐 때 남은 만남은 240번입니다. 이 앱이 처음 세어 본 숫자이기도 합니다.",
          "실제로는 어떨까요. 2023년 노인실태조사에서 65세 이상 부모 가운데 가장 자주 만나는 자녀와도 한 달에 한 번을 못 만나는 경우가 26.6%였습니다. 주 1회 이상 만나는 경우는 22.7%, 한 달에 두세 번은 23.1%, 한 달에 한 번은 27.6%입니다.",
          "나이가 들수록 조금 더 자주 만나는 경향도 있습니다. 85~89세 부모는 주 1회 이상 만나는 비율이 32.6%로, 65~69세(18.4%)보다 높습니다. 돌봄이 필요해지는 시기와 겹치기 때문으로 보입니다.",
          "그러니 '20년 뒤에는 1년에 몇 번'을 적을 때 꼭 줄어드는 쪽으로만 적을 필요는 없습니다. 부모님이 더 연로해지면 더 자주 찾아뵐 수도 있으니까요.",
        ],
        sources: [tables("ko", "〈표 5-15〉")],
      },
      en: {
        title: "Counting the visits left with your parents",
        summary: "Once a month for 20 years is 240 visits. Yet one in four parents sees their children less than that.",
        body: [
          "If your parent is 60 with a life expectancy of 80, visiting once a month leaves 240 visits. It is also the first number this app ever counted.",
          "What happens in reality? In Korea’s 2023 survey, 26.6% of parents aged 65+ saw even their most-visited child less than once a month. 22.7% saw them weekly or more, 23.1% two or three times a month, and 27.6% once a month.",
          "Visits also tend to grow with age: among parents aged 85–89, 32.6% see a child at least weekly, compared with 18.4% of those aged 65–69 — likely because this is when care becomes needed.",
          "So when you set “how many times a year in 20 years”, you don’t have to make it smaller. As your parents grow older, you may visit more.",
        ],
        sources: [tables("en", "Table 5-15")],
      },
      ja: {
        title: "親と会える回数を数えてみると",
        summary: "月に1回なら20年で240回。けれど4人に1人は、それより少ない。",
        body: [
          "親が60歳で、見込まれる寿命が80歳なら、月に1回会いに行くとして残りは240回です。このアプリが最初に数えた数字でもあります。",
          "実際はどうでしょう。韓国の2023年高齢者実態調査では、65歳以上の親のうち、いちばんよく会う子どもとも月1回未満の人が26.6%でした。週1回以上は22.7%、月に2〜3回は23.1%、月に1回は27.6%です。",
          "年をとるほど少し会う回数が増える傾向もあります。85〜89歳の親は週1回以上会う割合が32.6%で、65〜69歳(18.4%)より高くなっています。介護が必要になる時期と重なるためと考えられます。",
          "ですから「20年後は年に何回」を書くとき、必ずしも減らす必要はありません。親が年を重ねれば、もっと会いに行くかもしれないのですから。",
        ],
        sources: [tables("ja", "〈表5-15〉")],
      },
    },
  },
  {
    slug: "grandchildren-siblings",
    text: {
      ko: {
        title: "손주와 형제자매, 생각보다 드문 만남",
        summary: "따로 사는 손주를 한 달에 한 번도 못 보는 조부모가 열에 여섯.",
        body: [
          "65세 이상 어르신의 59.9%는 따로 사는 손주를 한 달에 한 번도 직접 만나지 못합니다. 주 1회 이상 만나는 경우는 6.5%입니다.",
          "형제자매·친척은 더 드뭅니다. 한 달에 한 번 이상 만나는 사람은 21.3%이고, 아예 만나지 않는다는 사람도 21.9%입니다.",
          "어릴 때는 매일 보던 사람들입니다. 명절이나 가족 행사가 거의 유일한 만남이 된다면, 1년에 두세 번으로 적는 편이 현실에 가깝습니다.",
        ],
        sources: [tables("ko", "〈표 5-18〉〈표 5-20〉")],
      },
      en: {
        title: "Grandchildren and siblings: rarer than you think",
        summary: "Six in ten grandparents see grandchildren who live apart less than once a month.",
        body: [
          "59.9% of Koreans aged 65+ see grandchildren who live apart less than once a month. Only 6.5% see them weekly or more.",
          "Siblings and relatives are rarer still: 21.3% see them at least once a month, and 21.9% don’t see them at all.",
          "These are people we once saw every day. If holidays and family events become almost the only time you meet, two or three times a year is closer to reality.",
        ],
        sources: [tables("en", "Tables 5-18, 5-20")],
      },
      ja: {
        title: "孫ときょうだい、思ったより少ない「会う」",
        summary: "離れて暮らす孫に月1回も会えない祖父母が10人に6人。",
        body: [
          "韓国の65歳以上の59.9%は、離れて暮らす孫に月に1回も直接会えていません。週1回以上会う人は6.5%です。",
          "きょうだい・親戚はさらにまれです。月1回以上会う人は21.3%で、まったく会わない人も21.9%います。",
          "子どものころは毎日顔を合わせていた人たちです。お正月や家族の行事がほぼ唯一の機会になるなら、年に2〜3回と書くほうが現実に近いでしょう。",
        ],
        sources: [tables("ja", "〈表5-18〉〈表5-20〉")],
      },
    },
  },
  {
    slug: "seasons",
    text: {
      ko: {
        title: "여름은 20일 길어지고, 겨울은 22일 짧아졌다",
        summary: "벚꽃과 눈을 셀 때 알아 두면 좋은 기후 이야기.",
        body: [
          "기상청이 1912~1940년과 1991~2020년의 기온을 비교했더니, 우리나라의 여름은 20일 길어지고 겨울은 22일 짧아졌습니다.",
          "봄은 17일 일찍 시작해 이제 3월 1일 무렵에 옵니다. 여름도 11일 빨라져 5월 31일쯤 시작됩니다. 2021년 서울의 벚꽃은 관측을 시작한 이래 가장 일찍 폈습니다.",
          "계절이 달라지면 셀 수 있는 순간도 달라집니다. 벚꽃은 더 이른 날짜에, 눈은 더 짧은 겨울 안에서 만나게 됩니다.",
          "앞으로 얼마나 더 달라질지는 온실가스를 얼마나 줄이느냐에 따라 크게 갈립니다. 그래서 이 앱은 기후 조건을 정답으로 넣지 않고, '20년 뒤에는 1년에 몇 번쯤'처럼 직접 가정해 보게 합니다.",
        ],
        sources: [KMA.ko],
      },
      en: {
        title: "Summer grew 20 days longer, winter 22 days shorter",
        summary: "A bit of climate background for counting cherry blossoms and snow.",
        body: [
          "Comparing 1912–1940 with 1991–2020, the Korea Meteorological Administration found that Korean summers became 20 days longer and winters 22 days shorter.",
          "Spring now starts 17 days earlier, around 1 March, and summer 11 days earlier, around 31 May. In 2021 Seoul’s cherry blossoms opened the earliest since records began.",
          "As the seasons shift, so do the moments you can count: blossoms on earlier dates, snow within shorter winters.",
          "How much more they change depends heavily on how much we cut emissions. So this app doesn’t bake in a climate forecast; it lets you assume your own, like “about this many times a year, 20 years from now”.",
        ],
        sources: [KMA.en],
      },
      ja: {
        title: "夏は20日長く、冬は22日短くなった",
        summary: "桜や雪を数えるときに知っておきたい、気候の話。",
        body: [
          "韓国気象庁が1912〜1940年と1991〜2020年の気温を比べたところ、韓国の夏は20日長くなり、冬は22日短くなりました。",
          "春は17日早く始まり、いまでは3月1日ごろに訪れます。夏も11日早まり、5月31日ごろに始まります。2021年のソウルの桜は、観測史上もっとも早く咲きました。",
          "季節が変われば、数えられるひとときも変わります。桜はより早い日に、雪はより短い冬のなかで出会うことになります。",
          "これからどれだけ変わるかは、温室効果ガスをどれだけ減らせるかで大きく分かれます。だからこのアプリは気候の予測を答えとして入れず、「20年後は年に何回くらい」と自分で仮定できるようにしています。",
        ],
        sources: [KMA.ja],
      },
    },
  },
];

export function findRead(slug: string): Read | undefined {
  return READS.find((r) => r.slug === slug);
}

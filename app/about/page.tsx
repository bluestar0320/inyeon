"use client";

import Link from "next/link";

import DocPage, { type DocSection } from "@/components/DocPage";
import { docLang, type DocLang } from "@/lib/docLang";
import { LIFE_TABLE_YEAR } from "@/lib/lifeTable";

const ABOUT: Record<DocLang, { title: string; lead: string; more: string; sections: DocSection[] }> = {
  ko: {
    title: "몇 번 더",
    lead: "남은 시간과 남은 만남을 횟수로 세어 봅니다.",
    more: "읽을거리 보기 →",
    sections: [
      { title: "무엇을 세나요", body: "소중한 사람을 앞으로 몇 번 더 만날 수 있는지, 벚꽃이나 여름 바다 같은 순간을 몇 번 더 누릴 수 있는지를 횟수로 셉니다. 알림을 보내지 않습니다. 숫자를 보고 무엇을 할지는 오롯이 당신의 몫입니다." },
      {
        title: "어떻게 세나요",
        body: [
          `내 나이와 상대의 나이에서 각자의 예상 수명(국제연합 세계인구전망, ${LIFE_TABLE_YEAR}년 생명표)까지 남은 시간을 구하고, 둘 중 짧은 쪽을 기준으로 삼습니다. 여기에 만나는 빈도를 곱하면 남은 횟수가 됩니다.`,
          "예를 들어 부모님이 60세, 예상 수명 80세, 한 달에 한 번 만난다면 앞으로 240번입니다.",
          "빈도가 해마다 달라질 것 같으면 「해마다 달라짐」으로 '20년 뒤에는 1년에 몇 번쯤'을 적을 수 있습니다.",
        ],
      },
      { title: "기록은 어디에 있나요", body: "이 기기에만 있습니다. 서버도 계정도 없습니다. 자세한 내용은 개인정보처리방침에 적어 두었습니다." },
    ],
  },
  en: {
    title: "How Many More",
    lead: "Counting the time and meetings you have left — in times.",
    more: "Browse the reads →",
    sections: [
      { title: "What it counts", body: "How many more times you can see the people you love, and how many more times you can enjoy moments like cherry blossoms or the summer sea. It sends no reminders. What you do with the number is entirely yours." },
      {
        title: "How it counts",
        body: [
          `From your age and theirs, it works out the time each of you has left to your life expectancy (United Nations World Population Prospects, ${LIFE_TABLE_YEAR} life tables) and uses the shorter one. Multiply by how often you meet, and that’s the count.`,
          "For example, a parent aged 60 with a life expectancy of 80, seen once a month, means 240 more times.",
          "If the frequency will change over the years, use “Changes over the years” to set “about this many times a year, 20 years from now”.",
        ],
      },
      { title: "Where your records live", body: "Only on this device. There is no server and no account. The details are in the Privacy Policy." },
    ],
  },
  ja: {
    title: "あと何回",
    lead: "残りの時間と、これから会える回数を数えます。",
    more: "読みものを見る →",
    sections: [
      { title: "何を数えるの？", body: "大切な人にあと何回会えるか、桜や夏の海のようなひとときをあと何回楽しめるかを回数で数えます。通知は送りません。数字を見て何をするかは、すべてあなた次第です。" },
      {
        title: "どう数えるの？",
        body: [
          `自分と相手の年齢から、それぞれの平均余命(国際連合 世界人口推計 ${LIFE_TABLE_YEAR}年生命表)までの残りの時間を求め、短いほうを基準にします。そこに会う頻度をかけると、残りの回数になります。`,
          "たとえば親が60歳、見込まれる寿命が80歳、月に1回会うなら、あと240回です。",
          "頻度が年ごとに変わりそうなら、「年ごとに変わる」で「20年後は年に何回くらい」と入れられます。",
        ],
      },
      { title: "記録はどこにあるの？", body: "この端末だけにあります。サーバーもアカウントもありません。詳しくはプライバシーポリシーに書いています。" },
    ],
  },
};

export default function AboutPage() {
  const doc = ABOUT[docLang()];
  return (
    <DocPage eyebrow="ABOUT" title={doc.title} lead={doc.lead} sections={doc.sections} numbered={false}>
      <p className="text-sm">
        <Link href="/reads" className="font-semibold text-ink-900 underline underline-offset-2">
          {doc.more}
        </Link>
      </p>
    </DocPage>
  );
}

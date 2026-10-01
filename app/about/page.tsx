"use client";

import Link from "next/link";

import DocPage from "@/components/DocPage";
import { LIFE_TABLE_YEAR } from "@/lib/lifeTable";

const SECTIONS = [
  {
    title: "무엇을 세나요",
    body: "소중한 사람을 앞으로 몇 번 더 만날 수 있는지, 벚꽃이나 여름 바다 같은 순간을 몇 번 더 누릴 수 있는지를 횟수로 셉니다. 알림을 보내지 않습니다. 숫자를 보고 무엇을 할지는 오롯이 당신의 몫입니다.",
  },
  {
    title: "어떻게 세나요",
    body: [
      `내 나이와 상대의 나이에서 각자의 예상 수명(국제연합 세계인구전망, ${LIFE_TABLE_YEAR}년 생명표)까지 남은 시간을 구하고, 둘 중 짧은 쪽을 기준으로 삼습니다. 여기에 만나는 빈도를 곱하면 남은 횟수가 됩니다.`,
      "예를 들어 부모님이 60세, 예상 수명 80세, 한 달에 한 번 만난다면 앞으로 240번입니다.",
      "빈도가 해마다 달라질 것 같으면 「해마다 달라짐」으로 '20년 뒤에는 1년에 몇 번쯤'을 적을 수 있습니다.",
    ],
  },
  {
    title: "기록은 어디에 있나요",
    body: "이 기기에만 있습니다. 서버도 계정도 없습니다. 자세한 내용은 개인정보처리방침에 적어 두었습니다.",
  },
];

export default function AboutPage() {
  return (
    <DocPage eyebrow="ABOUT" title="몇 번 더" lead="남은 시간과 남은 만남을 횟수로 세어 봅니다." sections={SECTIONS} numbered={false}>
      <p className="text-sm">
        <Link href="/reads" className="font-semibold text-ink-900 underline underline-offset-2">
          읽을거리 보기 →
        </Link>
      </p>
    </DocPage>
  );
}

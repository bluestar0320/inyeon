"use client";

import Link from "next/link";

import DocPage from "@/components/DocPage";
import { docLang } from "@/lib/docLang";
import { READS } from "@/lib/reads";

const COPY = {
  ko: { title: "읽을거리", lead: "앞으로 몇 번을 적기 전에, 실제로 사람들은 얼마나 자주 만나는지 통계로 먼저 읽어 보세요.", more: "읽어 보기 →" },
  en: { title: "Reads", lead: "Before you write down how many more times, see how often people actually meet — in numbers.", more: "Read →" },
  ja: { title: "読みもの", lead: "あと何回かを書く前に、実際に人がどれくらい会っているのかを統計で読んでみてください。", more: "読む →" },
};

export default function ReadsPage() {
  const lang = docLang();
  const t = COPY[lang];
  return (
    <DocPage eyebrow="READS" title={t.title} lead={t.lead}>
      <ul className="divide-y divide-ink-200/70 border-t border-ink-200/70">
        {READS.map((read) => (
          <li key={read.slug} className="py-5">
            <Link href={`/reads/${read.slug}`} className="group block">
              <h2 className="text-lg font-bold leading-snug text-ink-900 group-hover:underline">{read.text[lang].title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{read.text[lang].summary}</p>
              <p className="mt-2 text-sm font-semibold text-ink-800">{t.more}</p>
            </Link>
          </li>
        ))}
      </ul>
    </DocPage>
  );
}

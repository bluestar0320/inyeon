"use client";

import Link from "next/link";

import DocPage from "@/components/DocPage";
import { docLang } from "@/lib/docLang";
import { findRead } from "@/lib/reads";

const COPY = {
  ko: { sources: "출처", back: "← 읽을거리", try: "직접 세어 보기" },
  en: { sources: "Sources", back: "← Reads", try: "Count it yourself" },
  ja: { sources: "出典", back: "← 読みもの", try: "自分で数えてみる" },
};

export default function ReadView({ slug }: { slug: string }) {
  const lang = docLang();
  const t = COPY[lang];
  const read = findRead(slug)!.text[lang];
  return (
    <DocPage eyebrow="READS" title={read.title} lead={read.summary}>
      <div className="space-y-4 border-t border-ink-200/70 pt-5">
        {read.body.map((p) => (
          <p key={p} className="text-[15px] leading-relaxed text-ink-800">
            {p}
          </p>
        ))}
      </div>
      <div className="rounded-2xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-600">
        <p className="font-semibold text-ink-800">{t.sources}</p>
        {read.sources.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/reads" className="btn-secondary">
          {t.back}
        </Link>
        <Link href="/people/new" className="btn-primary">
          {t.try}
        </Link>
      </div>
    </DocPage>
  );
}

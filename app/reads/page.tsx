"use client";

import Link from "next/link";

import DocPage from "@/components/DocPage";
import { READS } from "@/lib/reads";

export default function ReadsPage() {
  return (
    <DocPage
      eyebrow="READS"
      title="읽을거리"
      lead="앞으로 몇 번을 적기 전에, 실제로 사람들은 얼마나 자주 만나는지 통계로 먼저 읽어 보세요."
    >
      <ul className="divide-y divide-ink-200/70 border-t border-ink-200/70">
        {READS.map((read) => (
          <li key={read.slug} className="py-5">
            <Link href={`/reads/${read.slug}`} className="group block">
              <h2 className="text-lg font-bold leading-snug text-ink-900 group-hover:underline">{read.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{read.summary}</p>
              <p className="mt-2 text-sm font-semibold text-ink-800">읽어 보기 →</p>
            </Link>
          </li>
        ))}
      </ul>
    </DocPage>
  );
}

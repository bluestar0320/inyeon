"use client";

import Link from "next/link";

import DocPage from "@/components/DocPage";
import { findRead } from "@/lib/reads";

export default function ReadView({ slug }: { slug: string }) {
  const read = findRead(slug)!;
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
        <p className="font-semibold text-ink-800">출처</p>
        {read.sources.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/reads" className="btn-secondary">
          ← 읽을거리
        </Link>
        <Link href="/people/new" className="btn-primary">
          직접 세어 보기
        </Link>
      </div>
    </DocPage>
  );
}

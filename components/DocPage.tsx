"use client";

import { defineCopy, getLang, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { updated: (d: string) => `최종 수정: ${d}`, koOnly: "" },
  en: { updated: (d: string) => `Last updated: ${d}`, koOnly: "This page is currently available in Korean only." },
  ja: { updated: (d: string) => `最終更新: ${d}`, koOnly: "このページは現在、韓国語のみです。" },
  es: { updated: (d: string) => `Última actualización: ${d}`, koOnly: "Por ahora esta página solo está en coreano." },
  zh: { updated: (d: string) => `最后更新：${d}`, koOnly: "此页面目前仅提供韩文版。" },
});

export interface DocSection {
  title: string;
  body: string | string[];
}

/*
 * 약관·안내·읽을거리가 같이 쓰는 문서 모양. 제목 하나, 번호 붙은 짧은 절, 절마다 가는 선.
 * 내용은 지금 한국어로만 쓴다. 다른 언어로 보는 사람에게는 그 사실을 한 줄로 알린다.
 */
export default function DocPage({
  eyebrow,
  title,
  lead,
  updated,
  sections,
  numbered = true,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  updated?: string;
  sections?: DocSection[];
  numbered?: boolean;
  children?: React.ReactNode;
}) {
  const t = tr(COPY);
  return (
    <article className="space-y-6">
      <header>
        {eyebrow && <p className="text-xs font-semibold tracking-[0.12em] text-accent-500">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        {updated && <p className="mt-1 text-xs text-ink-600">{t.updated(updated)}</p>}
        {lead && <p className="mt-3 text-sm leading-relaxed text-ink-600">{lead}</p>}
        {getLang() !== "ko" && <p className="mt-3 text-xs text-ink-600">{t.koOnly}</p>}
      </header>
      {sections && (
        <div className="divide-y divide-ink-200/70 border-t border-ink-200/70">
          {sections.map((s, i) => (
            <section key={s.title} className="py-5">
              <h2 className="text-base font-bold text-ink-900">
                {numbered ? `${i + 1}. ` : ""}
                {s.title}
              </h2>
              {(Array.isArray(s.body) ? s.body : [s.body]).map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-ink-600">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      )}
      {children}
    </article>
  );
}

"use client";

import { docLang } from "@/lib/docLang";
import { defineCopy, getLang, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { updated: (d: string) => `최종 수정: ${d}`, fallback: "" },
  en: { updated: (d: string) => `Last updated: ${d}`, fallback: "" },
  ja: { updated: (d: string) => `最終更新: ${d}`, fallback: "" },
  es: { updated: (d: string) => `Última actualización: ${d}`, fallback: "Esta página se muestra en inglés (está disponible en coreano, inglés y japonés)." },
  zh: { updated: (d: string) => `最后更新：${d}`, fallback: "此页面显示英文版（提供韩文、英文和日文版）。" },
});

export interface DocSection {
  title: string;
  body: string | string[];
}

/*
 * 약관·안내·읽을거리가 같이 쓰는 문서 모양. 제목 하나, 번호 붙은 짧은 절, 절마다 가는 선.
 * 내용은 한국어·영어·일본어로 쓴다(lib/docLang.ts). 그 밖의 언어로 보면 영어판이라고 한 줄로 알린다.
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
        {getLang() !== docLang() && <p className="mt-3 text-xs text-ink-600">{t.fallback}</p>}
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

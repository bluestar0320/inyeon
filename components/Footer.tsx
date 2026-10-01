"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { nav: "안내", about: "서비스 소개", reads: "읽을거리", privacy: "개인정보처리방침", terms: "이용약관", note: "기록은 이 기기에만 저장되고 어디에도 보내지 않습니다." },
  en: { nav: "Information", about: "About", reads: "Reads", privacy: "Privacy", terms: "Terms", note: "Everything you enter stays on this device and is never sent anywhere." },
  ja: { nav: "ご案内", about: "サービス紹介", reads: "読みもの", privacy: "プライバシー", terms: "利用規約", note: "記録はこの端末にだけ保存され、どこにも送信されません。" },
  es: { nav: "Información", about: "Acerca de", reads: "Lecturas", privacy: "Privacidad", terms: "Términos", note: "Todo lo que escribes se queda en este dispositivo y no se envía a ninguna parte." },
  zh: { nav: "说明", about: "关于", reads: "阅读", privacy: "隐私政策", terms: "使用条款", note: "记录只保存在这台设备上，不会发送到任何地方。" },
});

/* 모든 화면 맨 아래. 흐름을 막지 않고, 궁금한 사람만 찾아 들어가게 한다. */
export default function Footer() {
  const t = tr(COPY);
  const links: [string, string][] = [
    ["/about", t.about],
    ["/reads", t.reads],
    ["/privacy", t.privacy],
    ["/terms", t.terms],
  ];
  return (
    // 아래쪽 시스템 바(제스처 막대)와 되돌리기 막대에 가리지 않도록 아래 여백을 넉넉히 둔다.
    <footer className="mx-auto mt-16 max-w-3xl border-t border-ink-200/70 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] text-center">
      <nav aria-label={t.nav} className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {links.map(([href, label]) => (
          <Link key={href} href={href} prefetch={false} className="inline-flex min-h-9 items-center text-xs text-ink-600 hover:text-ink-900">
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-600">{t.note}</p>
    </footer>
  );
}

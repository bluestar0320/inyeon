"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { defineCopy, tr } from "@/lib/i18n";
import { confirmLeave } from "@/lib/unsaved";

const COPY = defineCopy({
  ko: { brand: "몇번더?", home: "홈", people: "인연", moments: "순간", settings: "설정" },
  en: { brand: "How Many More?", home: "Home", people: "People", moments: "Moments", settings: "Settings" },
  ja: { brand: "あと何回？", home: "ホーム", people: "大切な人", moments: "ひととき", settings: "設定" },
  es: { brand: "¿Cuántas veces más?", home: "Inicio", people: "Personas", moments: "Momentos", settings: "Ajustes" },
  zh: { brand: "还有几次？", home: "首页", people: "亲友", moments: "时光", settings: "设置" },
});

const LINKS = [
  { href: "/", key: "home" },
  { href: "/people", key: "people" },
  { href: "/moments", key: "moments" },
  { href: "/settings", key: "settings" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const t = tr(COPY);

  // 편집 중 저장하지 않은 게 있으면 화면을 옮기기 전에 한 번 묻는다.
  function guard(event: MouseEvent<HTMLAnchorElement>): void {
    if (!confirmLeave()) event.preventDefault();
  }

  return (
    /*
      위쪽 여백은 상태바 높이만큼이다. APK에서 웹뷰가 상태바 밑까지 올라오므로,
      이 머리글이 그 영역까지 칠해서 상태바 배경이 되고 메뉴는 시계 아래로 내려간다.
      브라우저에서는 인셋이 0이라 지금과 똑같다.
    */
    <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-page/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          onClick={guard}
          prefetch={false}
          className="text-sm font-semibold tracking-tight text-ink-900"
        >
          {t.brand}
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={guard}
                prefetch={false}
                /*
                  현재 위치는 검은 알약이 아니라 밑줄로 알린다. 알약은 화면마다
                  맨 위에 덩어리 하나를 얹어 두는 셈이라, 정작 주인공인 숫자가
                  나오기도 전에 시선을 먼저 가져갔다.
                */
                className={`border-b-2 px-2.5 py-1.5 text-sm transition ${
                  active
                    ? "border-accent-500 font-semibold text-ink-900"
                    : "border-transparent text-ink-400 hover:text-ink-800"
                }`}
              >
                {t[link.key]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { confirmLeave } from "@/lib/unsaved";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/people", label: "인연" },
  { href: "/moments", label: "순간" },
  { href: "/settings", label: "설정" },
];

export default function Nav() {
  const pathname = usePathname();

  // 편집 중 저장하지 않은 게 있으면 화면을 옮기기 전에 한 번 묻는다.
  function guard(event: MouseEvent<HTMLAnchorElement>): void {
    if (!confirmLeave()) event.preventDefault();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-[#fbfaf8]/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          onClick={guard}
          className="text-sm font-semibold tracking-tight text-ink-900"
        >
          인연 계산기
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
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active ? "bg-ink-800 text-white" : "text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

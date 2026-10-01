"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { paperUrl, pickPaper } from "@/lib/paper";

/*
 * 페이지를 옮길 때마다 배경 종이를 바꿔 깐다. 첫 화면의 종이는 layout.tsx의 그리기 전
 * 스크립트가 이미 골라 두었다(번쩍임 없이). 여기서는 그다음 이동부터 맡는다.
 */
export default function PaperBackground() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const root = document.documentElement;
    const previous = Number(root.dataset.paper) || null;
    const next = pickPaper(previous);
    root.dataset.paper = String(next);
    root.style.setProperty("--paper", paperUrl(next));
  }, [pathname]);
  return null;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { count } from "@/lib/analytics";

/* 화면을 옮길 때마다 "이 페이지가 열렸다" 한 번. 주소 뒷부분(?id=…)은 보내지 않는다(lib/analytics.ts). */
export default function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    count({ path: pathname });
  }, [pathname]);
  return null;
}

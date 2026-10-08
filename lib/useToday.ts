"use client";

import { useEffect, useState } from "react";

import { todayISO } from "./format";

/**
 * 오늘 날짜(YYYY-MM-DD). 화면을 켜 둔 채 자정을 넘기면 바뀐다.
 * 폰은 백그라운드에서 타이머를 멈추므로 화면이 다시 보일 때도 확인한다.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const check = () => setToday(todayISO());
    const timer = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return today;
}

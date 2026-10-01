"use client";

import { useEffect, useState } from "react";

/*
 * 「더 자세히」. 자주 안 쓰는 칸을 접어 두는 줄.
 * openWhen이 참이 되면 저절로 펼친다 — 이미 값이 들어 있거나(언제부터를 적었거나) 방금
 * 조건을 걸었다면, 그 결과를 접힌 채 숨겨 두면 안 된다.
 */
export default function MoreDetails({
  label,
  summary,
  openWhen = false,
  children,
}: {
  label: string;
  summary?: string;
  openWhen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(openWhen);
  useEffect(() => {
    if (openWhen) setOpen(true);
  }, [openWhen]);
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex min-h-9 cursor-pointer items-center justify-between gap-2 text-xs">
        <span className="shrink-0 whitespace-nowrap font-medium text-ink-800">{label}</span>
        {summary && <span className="truncate text-ink-600">{summary}</span>}
      </summary>
      <div className="space-y-4 pt-3">{children}</div>
    </details>
  );
}

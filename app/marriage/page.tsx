"use client";

import MarriageEditor from "@/components/MarriageEditor";

export default function MarriagePage() {
  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">결혼 계획</h1>
        <p className="mt-1 text-sm text-ink-400">
          목표한 나이까지 새로운 사람을 몇 번 만날 수 있는지 셉니다.
        </p>
      </div>
      <MarriageEditor />
    </div>
  );
}

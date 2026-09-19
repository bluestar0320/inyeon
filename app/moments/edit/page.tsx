"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import MomentEditor from "@/components/MomentEditor";
import { useAppState } from "@/lib/store";

/** 주소를 조회 문자열로 두는 이유는 app/people/detail/page.tsx의 설명과 같다. */
function Edit() {
  const id = useSearchParams().get("id");
  const { state, hydrated } = useAppState();
  const moment = state.moments.find((m) => m.id === id);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  if (!moment) {
    return (
      <div className="card mt-6 space-y-3">
        <p className="text-sm text-ink-600">찾을 수 없는 항목입니다.</p>
        <Link href="/moments" className="btn-secondary">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">
        {moment.title} 수정
      </h1>
      <MomentEditor key={moment.id} initial={moment} />
    </div>
  );
}

export default function MomentEditPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>}>
      <Edit />
    </Suspense>
  );
}

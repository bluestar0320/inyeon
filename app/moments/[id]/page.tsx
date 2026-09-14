"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import MomentEditor from "@/components/MomentEditor";
import { useAppState } from "@/lib/store";

export default function MomentDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, hydrated } = useAppState();
  const moment = state.moments.find((m) => m.id === params.id);

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
        {moment.emoji} {moment.title}
      </h1>
      <MomentEditor key={moment.id} initial={moment} />
    </div>
  );
}

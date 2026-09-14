"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import PersonEditor from "@/components/PersonEditor";
import { useAppState } from "@/lib/store";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, hydrated } = useAppState();
  const person = state.people.find((p) => p.id === params.id);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  if (!person) {
    return (
      <div className="card mt-6 space-y-3">
        <p className="text-sm text-ink-600">찾을 수 없는 인연입니다.</p>
        <Link href="/people" className="btn-secondary">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">{person.name}</h1>
      <PersonEditor key={person.id} initial={person} />
    </div>
  );
}

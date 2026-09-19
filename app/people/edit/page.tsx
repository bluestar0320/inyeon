"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import PersonEditor from "@/components/PersonEditor";
import { useAppState } from "@/lib/store";

/**
 * 고치는 화면. 보는 화면(/people/detail)과 일부러 나눠 두었다.
 *
 * 한 화면에서 보기와 고치기를 겸하면 입력 칸이 늘 펼쳐져 있어 조잡하고, 무엇보다
 * 이 앱의 주인공인 숫자가 폼에 파묻힌다. 주소를 나누면 뒤로 가기도 자연스럽고,
 * 저장하지 않고 나가려 할 때의 경고도 고치는 화면에만 붙는다.
 */
function Edit() {
  const id = useSearchParams().get("id");
  const { state, hydrated } = useAppState();
  const person = state.people.find((p) => p.id === id);

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
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">
        {person.name} 수정
      </h1>
      <PersonEditor key={person.id} initial={person} />
    </div>
  );
}

export default function PersonEditPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>}>
      <Edit />
    </Suspense>
  );
}

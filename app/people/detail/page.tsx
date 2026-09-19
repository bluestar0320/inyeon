"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import PersonView from "@/components/PersonView";
import { useAppState } from "@/lib/store";

/*
 * 주소가 /people/<id>가 아니라 /people/detail?id=<id>인 이유.
 *
 * 이 앱은 서버가 없어 정적 파일로 내보낸다. 그런데 /people/[id] 같은 경로는 빌드
 * 시점에 id를 전부 알아야 파일을 만들 수 있고, id는 사용자가 나중에 만드는 값이라
 * 알 수가 없다. 조회 문자열로 옮기면 파일 하나로 모든 인연을 연다.
 *
 * 잃는 것도 없다. 데이터가 각자 브라우저에만 있으므로 /people/abc-123은 다른
 * 기기에서는 아무 의미가 없다. 애초에 공유될 주소가 아니다.
 */
function Detail() {
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
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">{person.name}</h1>
      <PersonView key={person.id} person={person} />
    </div>
  );
}

export default function PersonDetailPage() {
  // useSearchParams는 정적 내보내기에서 Suspense 안에 있어야 한다.
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>}>
      <Detail />
    </Suspense>
  );
}

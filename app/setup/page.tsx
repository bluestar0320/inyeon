"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LifeSpanFields from "@/components/LifeSpanFields";
import { remainingYears } from "@/lib/calc";
import { formatYears } from "@/lib/format";
import { emptyProfile, useActions, useAppState } from "@/lib/store";
import { clearDirty, confirmLeave, useUnsavedGuard } from "@/lib/unsaved";
import type { Profile } from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const { saveProfile } = useActions();
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = useState(false);

  // 저장된 프로필은 하이드레이션 뒤에야 들어오므로, 한 번만 폼에 옮겨 담는다.
  useEffect(() => {
    if (!hydrated || loaded) return;
    if (state.profile) setDraft(state.profile);
    setLoaded(true);
  }, [hydrated, loaded, state.profile]);

  const remaining = remainingYears(draft);

  const baseline = state.profile ?? emptyProfile();
  const dirty = loaded && JSON.stringify(baseline) !== JSON.stringify(draft);
  useUnsavedGuard(dirty);

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">내 정보</h1>
        <p className="mt-1 text-sm text-ink-400">
          모든 계산의 기준이 됩니다. 기기 안에만 저장되고 서버로 보내지 않습니다.
        </p>
      </div>

      <div className="card">
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel="내 나이" showHealth />
      </div>

      <div className="card">
        <p className="text-xs font-medium text-ink-400">앞으로 남은 시간</p>
        <p className="numeral mt-1 text-4xl text-ink-900">{formatYears(remaining)}</p>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-ink-400">
        예상 수명은 나이·국가·성별에 맞는 생명표 값을 씁니다. 흔히 말하는 &ldquo;평균
        수명 83.5세&rdquo;는 갓 태어난 사람 기준이라, 이미 그 나이까지 살아온 사람에게는
        맞지 않습니다. 그래서 나이를 넣으면 숫자가 조금 올라갑니다. 물론 직접 바꿀 수도
        있습니다.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={remaining === null}
          onClick={() => {
            saveProfile(draft);
            clearDirty();
            router.push("/");
          }}
        >
          저장하기
        </button>
        {state.profile && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!confirmLeave()) return;
              clearDirty();
              router.push("/");
            }}
          >
            취소
          </button>
        )}
      </div>
      {remaining === null && (
        <p className="px-1 text-xs text-accent-600">생년월일이나 나이를 먼저 채워 주세요.</p>
      )}
    </div>
  );
}

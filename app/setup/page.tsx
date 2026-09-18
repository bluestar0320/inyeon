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
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel="내 나이" />
      </div>

      <div className="card">
        <p className="text-xs font-medium text-ink-400">앞으로 남은 시간</p>
        <p className="numeral mt-1 text-4xl text-ink-900">{formatYears(remaining)}</p>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-ink-400">
        평균 수명은 출생 시 기준 통계입니다. 이미 나이가 있는 사람은 실제 기대 여명이
        이보다 길어지는 경향이 있으니, 숫자가 짧게 느껴진다면 예상 수명을 직접 올려
        잡으세요.
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

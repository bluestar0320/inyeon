"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 저장 단추 아래 한 줄짜리 동의 체크.
 *
 * 첫 화면을 동의서로 막으면 아무도 들어오지 않는다. 처음 무언가를 저장하는 순간에만
 * 한 줄로 묻고, 한 번 동의하면 다시 묻지 않는다. 동의 기록은 앱 기록과 다른 키에 둔다 —
 * 전체 삭제나 백업 불러오기가 동의를 건드리지 않게.
 */
const CONSENT_KEY = "inyeon.consent";
/* 어느 판의 처리방침을 보고 체크했는지. 방침을 크게 고치면 바꾼다(app/privacy/page.tsx의 시행일). */
const POLICY_VERSION = "2026-11-12";

const COPY = defineCopy({
  ko: { label: "개인정보처리방침을 확인했습니다", required: "(필수)", view: "보기" },
  en: { label: "I've read the Privacy Policy", required: "(required)", view: "View" },
  ja: { label: "プライバシーポリシーを確認しました", required: "(必須)", view: "見る" },
  es: { label: "He leído la política de privacidad", required: "(obligatorio)", view: "Ver" },
  zh: { label: "我已阅读隐私政策", required: "(必填)", view: "查看" },
});

/** 동의가 필요한지(아직 한 번도 안 했는지)와 체크 상태. 저장할 때 commit()을 부른다. */
export function useConsent() {
  const [needed, setNeeded] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    try {
      setNeeded(window.localStorage.getItem(CONSENT_KEY) === null);
    } catch {
      setNeeded(false);
    }
  }, []);
  return {
    needed,
    checked,
    setChecked,
    /** 저장 단추를 막아야 하는지. */
    blocking: needed && !checked,
    commit() {
      if (!needed) return;
      try {
        window.localStorage.setItem(CONSENT_KEY, `${POLICY_VERSION} ${new Date().toISOString()}`);
      } catch {
        // 저장이 막힌 환경이면 다음에 한 번 더 묻는다. 막히지는 않는다.
      }
    },
  };
}

export default function ConsentCheck({ consent }: { consent: ReturnType<typeof useConsent> }) {
  const t = tr(COPY);
  if (!consent.needed) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-ink-800">
      <label className="flex min-h-9 items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-ink-800"
          checked={consent.checked}
          onChange={(e) => consent.setChecked(e.target.checked)}
        />
        <span>
          {t.label} <span className="text-ink-600">{t.required}</span>
        </span>
      </label>
      <Link href="/privacy" prefetch={false} className="inline-flex min-h-9 min-w-9 items-center justify-center px-1 text-ink-600 underline underline-offset-2">
        {t.view}
      </Link>
    </div>
  );
}

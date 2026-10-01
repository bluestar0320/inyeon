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

const COPY = defineCopy({
  ko: { label: "개인정보 수집·이용에 동의합니다", required: "(필수)", view: "보기" },
  en: { label: "I agree to how my information is used", required: "(required)", view: "View" },
  ja: { label: "個人情報の収集・利用に同意します", required: "(必須)", view: "見る" },
  es: { label: "Acepto el uso de mis datos", required: "(obligatorio)", view: "Ver" },
  zh: { label: "我同意收集和使用个人信息", required: "(必填)", view: "查看" },
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
        window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
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

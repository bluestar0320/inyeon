"use client";

import { useEffect, useState } from "react";

import PrivacyText from "@/components/PrivacyText";
import { CONSENT_KEY, consentRecord, needsConsent } from "@/lib/consent";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "시작하기 전에", lead: "기록은 이 기기 밖으로 나가지 않습니다. 아래를 읽고 동의해 주세요.", agree: "위 내용을 확인했고 동의합니다", age: "만 14세 이상입니다", start: "동의하고 시작하기", required: "(필수)" },
  en: { title: "Before you start", lead: "Nothing you enter leaves this device. Please read and agree below.", agree: "I have read the above and agree", age: "I am 14 or older", start: "Agree and start", required: "(required)" },
  ja: { title: "はじめる前に", lead: "記録はこの端末の外に出ません。以下を読んで同意してください。", agree: "上記の内容を確認し、同意します", age: "14歳以上です", start: "同意してはじめる", required: "(必須)" },
  es: { title: "Antes de empezar", lead: "Nada de lo que escribas sale de este dispositivo. Lee y acepta lo siguiente.", agree: "He leído lo anterior y acepto", age: "Tengo 14 años o más", start: "Aceptar y empezar", required: "(obligatorio)" },
  zh: { title: "开始之前", lead: "你的记录不会离开这台设备。请阅读并同意以下内容。", agree: "我已阅读并同意以上内容", age: "我已年满14岁", start: "同意并开始", required: "(必填)" },
});

/*
 * 동의 전이면 본문 대신 동의 화면을 그린다.
 *
 * 저장소를 읽기 전(서버 HTML, 하이드레이션 직후)에는 본문을 그대로 둔다. 각 화면이
 * 어차피 "불러오는 중"을 먼저 보이므로, 여기서 빈 화면을 한 번 더 끼우지 않는다.
 * 저장이 막힌 환경(시크릿 모드, 저장 공간 가득)에서는 이번 방문 동안만 들여보낸다 —
 * 동의를 저장하지 못했다고 앱에 갇히게 하면 안 된다. 다음 방문에 다시 묻는다.
 */
export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [agree, setAgree] = useState(false);
  const [age, setAge] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(CONSENT_KEY);
    } catch {
      // 못 읽으면 없는 것으로 본다.
    }
    setNeeded(needsConsent(raw));
  }, []);

  if (needed !== true) return <>{children}</>;

  const t = tr(COPY);
  const accept = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, consentRecord(new Date()));
    } catch {
      // 위 주석 참고.
    }
    setNeeded(false);
  };

  return (
    <section className="space-y-5 py-4" aria-labelledby="consent-title">
      <div>
        <h1 id="consent-title" className="font-album text-2xl text-ink-900">{t.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.lead}</p>
      </div>
      <div className="card">
        <PrivacyText />
      </div>
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-ink-800">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{t.agree} <span className="text-ink-600">{t.required}</span></span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink-800">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>{t.age} <span className="text-ink-600">{t.required}</span></span>
        </label>
      </div>
      <button type="button" className="btn-primary w-full py-3" disabled={!agree || !age} onClick={accept}>
        {t.start}
      </button>
    </section>
  );
}

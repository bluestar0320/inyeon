"use client";

import { useEffect, useState } from "react";

import PrivacyText from "@/components/PrivacyText";
import { CONSENT_KEY, consentDate } from "@/lib/consent";
import { defineCopy, locale, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "개인정보 안내", agreedOn: (d: string) => `동의한 날: ${d}` },
  en: { title: "Privacy", agreedOn: (d: string) => `Agreed on ${d}` },
  ja: { title: "個人情報について", agreedOn: (d: string) => `同意した日: ${d}` },
  es: { title: "Privacidad", agreedOn: (d: string) => `Aceptado el ${d}` },
  zh: { title: "隐私说明", agreedOn: (d: string) => `同意日期：${d}` },
});

export default function PrivacyPage() {
  const t = tr(COPY);
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => {
    try {
      setAt(consentDate(window.localStorage.getItem(CONSENT_KEY)));
    } catch {
      setAt(null);
    }
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="font-album text-2xl text-ink-900">{t.title}</h1>
      <div className="card">
        <PrivacyText />
      </div>
      {at && <p className="text-xs text-ink-600">{t.agreedOn(new Date(at).toLocaleDateString(locale()))}</p>}
    </div>
  );
}

"use client";

import PrivacyText from "@/components/PrivacyText";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "개인정보 안내" },
  en: { title: "Privacy" },
  ja: { title: "個人情報について" },
  es: { title: "Privacidad" },
  zh: { title: "隐私说明" },
});

export default function PrivacyPage() {
  const t = tr(COPY);
  return (
    <div className="space-y-5">
      <h1 className="font-album text-2xl text-ink-900">{t.title}</h1>
      <div className="card">
        <PrivacyText />
      </div>
    </div>
  );
}

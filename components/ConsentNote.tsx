"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { note: "저장하면 입력한 정보가 이 기기에만 보관되고 횟수 계산에만 쓰이는 데 동의하는 것으로 봅니다.", link: "약관 보기" },
  en: { note: "By saving, you agree that what you enter stays on this device and is used only to count.", link: "View terms" },
  ja: { note: "保存すると、入力した情報はこの端末にだけ保存され、回数の計算にだけ使われることに同意したものとみなします。", link: "規約を見る" },
  es: { note: "Al guardar, aceptas que lo que escribes se queda en este dispositivo y solo se usa para contar.", link: "Ver términos" },
  zh: { note: "保存即表示你同意所填信息只保存在这台设备上，并且只用于计算次数。", link: "查看条款" },
});

/*
 * 저장 단추 아래의 한두 줄 동의 안내.
 * 첫 화면을 동의서로 막으면 아무도 들어오지 않는다. 적는 순간에만 짧게 알리고,
 * 자세히 보고 싶은 사람만 약관으로 간다.
 */
export default function ConsentNote() {
  const t = tr(COPY);
  return (
    <p className="text-xs leading-relaxed text-ink-600">
      {t.note}{" "}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-900">
        {t.link}
      </Link>
    </p>
  );
}

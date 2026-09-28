"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "없는 화면입니다", body: "주소가 바뀌었거나 잘못 들어왔습니다.", home: "홈으로" },
  en: { title: "Page not found", body: "The address may have changed or been mistyped.", home: "Go home" },
  ja: { title: "ページが見つかりません", body: "アドレスが変わったか、入力が間違っています。", home: "ホームへ" },
  es: { title: "Página no encontrada", body: "La dirección puede haber cambiado o estar mal escrita.", home: "Ir al inicio" },
  zh: { title: "页面不存在", body: "地址可能已更改或输入有误。", home: "返回首页" },
});

/** Next의 기본 404는 영어뿐이다. 다른 화면처럼 고른 언어로 말한다. */
export default function NotFound() {
  const t = tr(COPY);
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-ink-900">{t.title}</h1>
      <p className="text-sm text-ink-600">{t.body}</p>
      <Link href="/" className="btn-primary" prefetch={false}>
        {t.home}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";
import { useSaveFailed } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    text: "저장하지 못했습니다. 저장 공간이 가득 찼거나 막혀 있어, 새로고침하면 방금 바꾼 내용이 사라집니다. 긴 메모를 줄이거나 내보내기로 백업해 두세요.",
    action: "내보내기",
  },
  en: {
    text: "Couldn't save. Storage is full or blocked, so your latest changes will be lost on reload. Shorten long notes or export a backup.",
    action: "Export",
  },
  ja: {
    text: "保存できませんでした。保存領域がいっぱいか制限されているため、再読み込みすると直前の変更が消えます。長いメモを短くするか、エクスポートでバックアップしてください。",
    action: "エクスポート",
  },
  es: {
    text: "No se pudo guardar. El almacenamiento está lleno o bloqueado, así que tus últimos cambios se perderán al recargar. Acorta las notas largas o exporta una copia.",
    action: "Exportar",
  },
  zh: {
    text: "未能保存。存储空间已满或被阻止，刷新后刚才的更改会丢失。请缩短较长的备注，或导出备份。",
    action: "导出",
  },
});

/** 저장이 실패하는 동안만 뜬다. 조용히 넘기면 사용자는 저장된 줄 안다(lib/store.ts). */
export default function SaveWarning() {
  const failed = useSaveFailed();
  if (!failed) return null;
  const t = tr(COPY);
  return (
    <div role="alert" className="mx-auto max-w-3xl px-4 pt-3">
      <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs leading-relaxed text-accent-600">
        {t.text}{" "}
        <Link href="/settings#backup" className="font-semibold underline">
          {t.action}
        </Link>
      </p>
    </div>
  );
}

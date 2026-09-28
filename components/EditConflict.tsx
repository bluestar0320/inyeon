"use client";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 다른 탭(또는 설치한 앱과 브라우저)에서 같은 기록을 고치거나 지웠을 때.
 *
 * 예전에는 알 길이 없었다. 두 곳에서 고치면 나중에 저장한 쪽이 먼저 저장한 쪽을 말없이
 * 지웠고(메모가 사라졌다), 다른 곳에서 지우면 입력하던 화면이 통째로 "찾을 수 없음"으로
 * 바뀌며 적던 내용이 날아갔다. 이제는 알리고, 덮어쓸지 묻는다.
 */
export type Conflict = "changed" | "deleted" | null;

const COPY = defineCopy({
  ko: {
    changed: "다른 창에서 이 기록이 바뀌었습니다. 저장하면 여기서 고친 내용으로 덮어씁니다.",
    deleted: "다른 창에서 이 기록이 지워졌습니다. 저장하면 여기 적힌 내용으로 다시 만듭니다.",
    confirm: "다른 창에서 바뀐 내용이 있습니다. 여기서 고친 내용으로 덮어쓸까요?",
  },
  en: {
    changed: "This record was changed in another window. Saving will overwrite it with your edits here.",
    deleted: "This record was deleted in another window. Saving will create it again from what's here.",
    confirm: "This was changed in another window. Overwrite it with your edits here?",
  },
  ja: {
    changed: "別のウィンドウでこの記録が変更されました。保存すると、ここでの編集で上書きします。",
    deleted: "別のウィンドウでこの記録が削除されました。保存すると、ここにある内容で作り直します。",
    confirm: "別のウィンドウで変更されています。ここでの編集で上書きしますか？",
  },
  es: {
    changed: "Este registro cambió en otra ventana. Al guardar, se sobrescribirá con tus cambios de aquí.",
    deleted: "Este registro se eliminó en otra ventana. Al guardar, se volverá a crear con lo que hay aquí.",
    confirm: "Esto cambió en otra ventana. ¿Sobrescribir con tus cambios de aquí?",
  },
  zh: {
    changed: "此记录已在另一个窗口中更改。保存后将以这里的修改覆盖。",
    deleted: "此记录已在另一个窗口中删除。保存后将按这里的内容重新创建。",
    confirm: "此内容已在另一个窗口中更改。要用这里的修改覆盖吗？",
  },
});

/** 저장해도 되는지. 바뀐 게 있으면 묻는다. */
export function confirmOverwrite(conflict: Conflict): boolean {
  return conflict !== "changed" || window.confirm(tr(COPY).confirm);
}

/**
 * 편집을 시작한 때의 기록과 지금 저장된 기록을 견준다.
 * startedAt: 편집을 시작할 때의 updatedAt(새로 만드는 중이면 null).
 */
export function detectConflict(startedAt: string | null, current: { updatedAt: string } | undefined): Conflict {
  if (startedAt === null) return null;
  if (!current) return "deleted";
  return current.updatedAt !== startedAt ? "changed" : null;
}

export default function EditConflict({ conflict }: { conflict: Conflict }) {
  if (!conflict) return null;
  return (
    <p role="alert" className="rounded-xl bg-accent-50 px-4 py-3 text-xs leading-relaxed text-accent-600">
      {tr(COPY)[conflict]}
    </p>
  );
}

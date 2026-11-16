import { useSyncExternalStore } from "react";

import type { RowKey } from "./deck.ts";
import { defineCopy } from "./i18n.ts";

/** 두 줄의 이름. 머리글과 카드 줄이 같은 말을 쓰게 여기 한 곳에 둔다(lib/i18n.ts의 용어). */
export const ROW_NAMES = defineCopy<Record<RowKey, string>>({
  ko: { people: "인연", moments: "순간" },
  en: { people: "People", moments: "Moments" },
  ja: { people: "大切な人", moments: "ひととき" },
  es: { people: "Personas", moments: "Momentos" },
  zh: { people: "亲友", moments: "时光" },
});

// 머리글이 지금 보는 줄 이름을 알려면 필요한 아주 작은 저장소. Deck이 정하고 Nav가 읽는다.
let row: RowKey = "people";
const listeners = new Set<() => void>();

export function setDeckRow(next: RowKey): void {
  if (next === row) return;
  row = next;
  listeners.forEach((l) => l());
}

export function useDeckRow(): RowKey {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => row,
    () => "people",
  );
}

import { useSyncExternalStore } from "react";

import type { RowKey } from "./deck.ts";

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

"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * 방금 지운 것을 잠깐 붙들어 두는 자리.
 *
 * 앱 상태(localStorage)와 따로 두는 이유는 두 가지다. 되돌리기는 기기를 껐다 켜면
 * 남아 있을 이유가 없고, 저장된 데이터에 "지워진 것"이 섞이면 내보내기 파일이
 * 지저분해진다. 그래서 메모리에만 두고 시간이 지나면 스스로 사라진다.
 */
export interface UndoEntry {
  /** 화면에 띄울 문구. 예: "어머니을(를) 지웠습니다." */
  message: string;
  /** 되돌리기를 눌렀을 때 실제로 복구하는 일. */
  restore: () => void;
  /** 같은 항목을 두 번 담지 않도록 구분하는 값. */
  token: number;
}

/** 이 시간이 지나면 되돌리기 막대가 스스로 사라진다. */
export const UNDO_TIMEOUT_MS = 8000;

let entry: UndoEntry | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

export function offerUndo(message: string, restore: () => void): void {
  clearTimer();
  entry = { message, restore, token: Date.now() };
  timer = setTimeout(() => {
    entry = null;
    timer = null;
    emit();
  }, UNDO_TIMEOUT_MS);
  emit();
}

export function takeUndo(): void {
  const current = entry;
  clearTimer();
  entry = null;
  emit();
  current?.restore();
}

export function dismissUndo(): void {
  clearTimer();
  entry = null;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUndo(): UndoEntry | null {
  const value = useSyncExternalStore(
    subscribe,
    () => entry,
    () => null,
  );
  // 화면을 떠나도 타이머는 계속 돌아야 하므로 정리하지 않는다.
  useEffect(() => undefined, []);
  return value;
}

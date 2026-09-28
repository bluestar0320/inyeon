"use client";

import { useSyncExternalStore } from "react";

/**
 * 방금 지운 것을 잠깐 붙들어 두는 자리.
 *
 * 앱 상태(localStorage)와 따로 두는 이유는 두 가지다. 되돌리기는 기기를 껐다 켜면
 * 남아 있을 이유가 없고, 저장된 데이터에 "지워진 것"이 섞이면 내보내기 파일이
 * 지저분해진다. 그래서 메모리에만 두고 시간이 지나면 스스로 사라진다.
 */
export interface UndoEntry {
  /** 화면에 띄울 문구. 예: "어머니를 지웠습니다." */
  message: string;
  /** 되돌리기를 눌렀을 때 실제로 복구하는 일. */
  restore: () => void;
  /** 같은 항목을 두 번 담지 않도록 구분하는 값. */
  token: number;
}

/** 이 시간이 지나면 되돌리기 막대가 스스로 사라진다. */
export const UNDO_TIMEOUT_MS = 8000;

/*
 * 되돌릴 것들을 쌓아 둔다. 예전에는 한 칸뿐이라, 막대가 떠 있는 동안 다른 것을
 * 지우면 먼저 지운 것은 되돌릴 길 없이 사라졌다(어머니 둘을 연달아 지우면 하나만
 * 돌아왔다). 되돌리기를 누르면 맨 위부터 하나씩 돌아오고, 남은 게 있으면 막대가
 * 다음 것을 보여준다. 시간이 다 되면 한꺼번에 사라진다.
 */
let stack: UndoEntry[] = [];
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

function restartTimer(): void {
  clearTimer();
  if (stack.length === 0) return;
  timer = setTimeout(() => {
    stack = [];
    timer = null;
    emit();
  }, UNDO_TIMEOUT_MS);
}

export function offerUndo(message: string, restore: () => void): void {
  stack = [...stack, { message, restore, token: Date.now() + stack.length }];
  restartTimer();
  emit();
}

export function takeUndo(): void {
  const current = stack[stack.length - 1];
  stack = stack.slice(0, -1);
  restartTimer();
  emit();
  current?.restore();
}

export function dismissUndo(): void {
  clearTimer();
  stack = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 화면을 옮겨도 타이머는 계속 돌아야 해서(삭제 후 목록으로 이동한다) 정리하지 않는다. */
export function useUndo(): UndoEntry | null {
  return useSyncExternalStore(
    subscribe,
    () => stack[stack.length - 1] ?? null,
    () => null,
  );
}
